import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';
import { requireActiveOrg } from '../lib/org-context.js';
import { requireActiveWorkshop, assertWorkshopInOrg, type WorkshopBindings } from '../lib/workshop-context.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { createPartSchema, updatePartSchema, movementSchema, transferSchema } from '../schemas.js';
import type { Role } from '../types.js';

/**
 * Inventario — entidad de NIVEL SUCURSAL (RF-601..608).
 *
 * A diferencia de clientes, aqui SI se exige la sucursal activa: las
 * existencias son fisicas y pertenecen a un local concreto. Es la otra mitad
 * del corte vertical, la que demuestra que el alcance por nivel funciona.
 */
export const inventoryRoutes = new Hono<WorkshopBindings>();

// Una sola cadena literal, sin concatenar: supabase-js deriva el tipo de la
// fila a partir del texto del select, y una concatenacion lo degrada a `string`.
const PART_COLUMNS =
  'id, organization_id, workshop_id, part_number, name, description, brand, category, current_stock, minimum_stock, maximum_stock, unit_cost, is_active, created_at, updated_at';

/** El Mechanic consume repuestos, asi que puede registrar movimientos; no administra el catalogo. */
const CATALOG_ROLES: readonly Role[] = ['owner', 'receptionist'];

function assertCanManageCatalog(role: Role): void {
  if (!CATALOG_ROLES.includes(role)) {
    throw forbidden('inventory.insufficient_permissions', 'Tu rol no permite administrar el catalogo de repuestos.');
  }
}

/**
 * Traduce los errores que levantan las funciones plpgsql a errores de negocio.
 * Las funciones usan `raise exception 'codigo'`, de modo que el catalogo de
 * codigos siga siendo uno solo aunque la regla viva en la base de datos.
 */
function mapDbError(message: string, fallbackCode: string): never {
  const known = [
    'inventory.part_not_found',
    'inventory.insufficient_stock',
    'inventory.invalid_movement_type',
    'inventory.invalid_quantity',
    'inventory.cross_organization_transfer',
    'inventory.same_workshop_transfer',
  ];
  const hit = known.find((code) => message.includes(code));
  if (hit === 'inventory.part_not_found') throw notFound(hit, 'Repuesto no encontrado.');
  if (hit === 'inventory.insufficient_stock') {
    throw conflict(hit, 'La existencia es insuficiente para esta operacion.');
  }
  if (hit) throw badRequest(hit, 'La operacion de inventario no es valida.');
  throw badRequest(fallbackCode, message);
}

inventoryRoutes.use('*', requireAuth, requireActiveOrg, requireActiveWorkshop);

/** Lista los repuestos de la sucursal activa — RF-602. */
inventoryRoutes.get('/parts', async (c) => {
  const search = c.req.query('search')?.trim();
  const lowStockOnly = c.req.query('lowStock') === 'true';

  let query = serviceClient()
    .from('parts')
    .select(PART_COLUMNS)
    .eq('organization_id', c.get('orgId'))
    .eq('workshop_id', c.get('workshopId'))
    .eq('is_active', true);

  if (search) {
    const like = `%${search}%`;
    query = query.or(`name.ilike.${like},part_number.ilike.${like},brand.ilike.${like}`);
  }

  const { data, error } = await query.order('name');
  if (error) throw badRequest('inventory.lookup_failed', error.message);

  const parts = data ?? [];
  // RF-607: en o por debajo del minimo. Se filtra aqui porque PostgREST no
  // compara dos columnas entre si en el mismo filtro.
  const result = lowStockOnly
    ? parts.filter((p) => (p as { current_stock: number; minimum_stock: number }).current_stock <=
        (p as { minimum_stock: number }).minimum_stock)
    : parts;

  return c.json({ parts: result });
});

/**
 * Registra un repuesto en la sucursal activa — RF-601.
 * Si nace con existencia > 0, se genera automaticamente su movimiento de
 * entrada: ninguna existencia debe aparecer sin un movimiento que la explique.
 */
inventoryRoutes.post('/parts', async (c) => {
  assertCanManageCatalog(c.get('orgRole'));
  const input = createPartSchema.parse(await c.req.json());
  const db = serviceClient();

  const { data: part, error } = await db
    .from('parts')
    .insert({
      organization_id: c.get('orgId'),
      workshop_id: c.get('workshopId'),
      part_number: input.partNumber,
      name: input.name,
      description: input.description ?? null,
      brand: input.brand ?? null,
      category: input.category ?? null,
      current_stock: 0,
      minimum_stock: input.minimumStock ?? 0,
      maximum_stock: input.maximumStock ?? null,
      unit_cost: input.unitCost ?? null,
    })
    .select(PART_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw conflict('inventory.part_number_in_use', 'Ya existe un repuesto con ese numero en esta sucursal.');
    }
    throw badRequest('inventory.create_failed', error.message);
  }

  if ((input.initialStock ?? 0) > 0) {
    const { error: movErr } = await db.rpc('register_part_movement', {
      p_part_id: (part as { id: string }).id,
      p_movement_type: 'purchase',
      p_quantity: input.initialStock,
      p_unit_cost: input.unitCost ?? null,
      p_reference: 'stock-inicial',
      p_notes: 'Existencia inicial del repuesto',
      p_performed_by: c.get('userId'),
    });
    if (movErr) mapDbError(movErr.message, 'inventory.movement_failed');

    const { data: refreshed } = await db
      .from('parts')
      .select(PART_COLUMNS)
      .eq('id', (part as { id: string }).id)
      .maybeSingle();

    return c.json({ part: refreshed ?? part }, 201);
  }

  return c.json({ part }, 201);
});

/** Detalle de un repuesto de la sucursal activa. */
inventoryRoutes.get('/parts/:partId', async (c) => {
  const part = await findInWorkshop(c.req.param('partId'), c.get('orgId'), c.get('workshopId'));
  return c.json({ part });
});

/** Edita los datos de catalogo de un repuesto. La existencia no se toca aqui. */
inventoryRoutes.patch('/parts/:partId', async (c) => {
  assertCanManageCatalog(c.get('orgRole'));
  const partId = c.req.param('partId');
  await findInWorkshop(partId, c.get('orgId'), c.get('workshopId'));
  const input = updatePartSchema.parse(await c.req.json());

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.brand !== undefined) patch.brand = input.brand;
  if (input.category !== undefined) patch.category = input.category;
  if (input.minimumStock !== undefined) patch.minimum_stock = input.minimumStock;
  if (input.maximumStock !== undefined) patch.maximum_stock = input.maximumStock;
  if (input.unitCost !== undefined) patch.unit_cost = input.unitCost;

  const { data, error } = await serviceClient()
    .from('parts')
    .update(patch)
    .eq('id', partId)
    .eq('workshop_id', c.get('workshopId'))
    .select(PART_COLUMNS)
    .maybeSingle();

  if (error) throw badRequest('inventory.update_failed', error.message);
  if (!data) throw notFound('inventory.part_not_found', 'Repuesto no encontrado.');

  return c.json({ part: data });
});

/** Historial de movimientos de un repuesto — RF-604. */
inventoryRoutes.get('/parts/:partId/movements', async (c) => {
  const partId = c.req.param('partId');
  await findInWorkshop(partId, c.get('orgId'), c.get('workshopId'));

  const { data, error } = await serviceClient()
    .from('part_movements')
    .select('id, part_id, movement_type, quantity, previous_stock, new_stock, unit_cost, total_cost, reference, notes, performed_by, created_at')
    .eq('part_id', partId)
    .order('created_at', { ascending: false });

  if (error) throw badRequest('inventory.lookup_failed', error.message);
  return c.json({ movements: data ?? [] });
});

/**
 * Registra un movimiento de existencias — RF-604, RF-605, RF-606.
 * El calculo y la actualizacion ocurren dentro de una funcion de Postgres,
 * en una sola transaccion (ADR-007).
 */
inventoryRoutes.post('/parts/:partId/movements', async (c) => {
  const partId = c.req.param('partId');
  await findInWorkshop(partId, c.get('orgId'), c.get('workshopId'));
  const input = movementSchema.parse(await c.req.json());

  const { data, error } = await serviceClient().rpc('register_part_movement', {
    p_part_id: partId,
    p_movement_type: input.movementType,
    p_quantity: input.quantity,
    p_unit_cost: input.unitCost ?? null,
    p_reference: input.reference ?? null,
    p_notes: input.notes ?? null,
    p_performed_by: c.get('userId'),
  });

  if (error) mapDbError(error.message, 'inventory.movement_failed');

  return c.json({ movement: data }, 201);
});

/**
 * Transfiere existencias a otra sucursal de la misma empresa — RF-608.
 * El repuesto de destino debe existir ya en la sucursal receptora.
 */
inventoryRoutes.post('/parts/:partId/transfer', async (c) => {
  const partId = c.req.param('partId');
  const orgId = c.get('orgId');
  await findInWorkshop(partId, orgId, c.get('workshopId'));
  const input = transferSchema.parse(await c.req.json());

  // La sucursal de destino debe pertenecer a la empresa activa: una
  // transferencia no puede cruzar el limite de aislamiento.
  await assertWorkshopInOrg(input.toWorkshopId, orgId);

  const { data: target, error: targetErr } = await serviceClient()
    .from('parts')
    .select('id')
    .eq('id', input.toPartId)
    .eq('organization_id', orgId)
    .eq('workshop_id', input.toWorkshopId)
    .maybeSingle();

  if (targetErr) throw badRequest('inventory.lookup_failed', targetErr.message);
  if (!target) throw notFound('inventory.part_not_found', 'El repuesto de destino no existe en esa sucursal.');

  const { error } = await serviceClient().rpc('transfer_stock', {
    p_from_part_id: partId,
    p_to_part_id: input.toPartId,
    p_quantity: input.quantity,
    p_performed_by: c.get('userId'),
  });

  if (error) mapDbError(error.message, 'inventory.transfer_failed');

  return c.json({ transferred: input.quantity, toPartId: input.toPartId }, 201);
});

/**
 * Recupera el repuesto exigiendo que sea de la sucursal activa. Un repuesto de
 * otra sucursal responde "no encontrado" (RF-602): desde esta sucursal, no
 * existe.
 */
async function findInWorkshop(
  partId: string,
  orgId: string,
  workshopId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await serviceClient()
    .from('parts')
    .select(PART_COLUMNS)
    .eq('id', partId)
    .eq('organization_id', orgId)
    .eq('workshop_id', workshopId)
    .maybeSingle();

  if (error) throw badRequest('inventory.lookup_failed', error.message);
  if (!data) throw notFound('inventory.part_not_found', 'Repuesto no encontrado.');
  return data as Record<string, unknown>;
}

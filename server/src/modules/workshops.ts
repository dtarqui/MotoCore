import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';
import { requireActiveOrg, type OrgBindings } from '../lib/org-context.js';
import { getMembership } from '../lib/memberships.js';
import { assertWorkshopInOrg } from '../lib/workshop-context.js';
import { conflict, forbidden, internal, notFound } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { createWorkshopSchema, updateWorkshopSchema, assignMemberSchema } from '../schemas.js';
import type { Workshop } from '../types.js';

/**
 * Talleres de la organizacion activa (ADR-006). Montado en `/api/workshops`:
 * el taller es un recurso INTERIOR a la organizacion, de modo que el contexto
 * llega por `X-Org-Id` y no anidado en la ruta (§2.3 del contrato, ADR-005).
 *
 * Reglas de acceso: cualquier miembro LEE los talleres de su organizacion —no
 * son frontera de seguridad—; solo el Owner los administra.
 */
export const workshopRoutes = new Hono<OrgBindings>();

const WORKSHOP_COLUMNS = 'id, organization_id, name, address, phone, is_active, created_at, updated_at';

workshopRoutes.use('*', requireAuth, requireActiveOrg);

/** Solo el Owner administra talleres — RF-301, RF-305. */
function assertOwner(c: { get: (k: 'orgRole') => string }): void {
  if (c.get('orgRole') !== 'owner') {
    throw forbidden('workshop.insufficient_permissions', 'Solo el Owner puede administrar talleres.');
  }
}

/** Lista los talleres de la organizacion activa — RF-302. */
workshopRoutes.get('/', async (c) => {
  const { data, error } = await c.get('db')
    .from('workshops')
    .select(WORKSHOP_COLUMNS)
    .eq('organization_id', c.get('orgId'))
    .order('name');

  if (error) throw internal(`workshops.select: ${error.message}`);
  return c.json({ workshops: data ?? [] });
});

/** Crea un taller en la organizacion activa (solo Owner) — RF-301. */
workshopRoutes.post('/', async (c) => {
  assertOwner(c);
  const orgId = c.get('orgId');
  const input = createWorkshopSchema.parse(await c.req.json());

  const { data, error } = await c.get('db')
    .from('workshops')
    .insert({
      organization_id: orgId,
      name: input.name,
      address: input.address ?? null,
      phone: input.phone ?? null,
    })
    .select(WORKSHOP_COLUMNS)
    .single();

  if (error) {
    // Unico (organization_id, name): no puede haber dos talleres con el mismo
    // nombre en una organizacion, pero si en organizaciones distintas.
    if (error.code === '23505') {
      throw conflict('workshop.duplicate_name', 'Ya existe un taller con ese nombre en la organizacion.');
    }
    throw internal(`workshops.insert: ${error.message}`);
  }

  return c.json({ workshop: data }, 201);
});

/** Detalle de un taller de la organizacion activa. */
workshopRoutes.get('/:workshopId', async (c) => {
  const workshopId = c.req.param('workshopId');
  await assertWorkshopInOrg(workshopId, c.get('orgId'));

  const { data, error } = await c.get('db')
    .from('workshops')
    .select(WORKSHOP_COLUMNS)
    .eq('id', workshopId)
    .maybeSingle();

  if (error) throw internal(`workshops.select: ${error.message}`);
  if (!data) throw notFound('workshop.not_found', 'Taller no encontrado.');

  return c.json({ workshop: data });
});

/** Edita un taller (solo Owner) — RF-301. */
workshopRoutes.patch('/:workshopId', async (c) => {
  assertOwner(c);
  const workshopId = c.req.param('workshopId');
  await assertWorkshopInOrg(workshopId, c.get('orgId'));
  const input = updateWorkshopSchema.parse(await c.req.json());

  const { data, error } = await c.get('db')
    .from('workshops')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', workshopId)
    .select(WORKSHOP_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw conflict('workshop.duplicate_name', 'Ya existe un taller con ese nombre en la organizacion.');
    }
    throw internal(`workshops.update: ${error.message}`);
  }
  if (!data) throw notFound('workshop.not_found', 'Taller no encontrado.');

  return c.json({ workshop: data });
});

/**
 * Baja logica del taller (solo Owner) — RF-305. Accion auditada (RF-703).
 *
 * Se expone como `POST /deactivate` y no como `PATCH`: es una transicion de
 * estado con consecuencias de auditoria, no la edicion de un campo (§2.6 del
 * contrato). No se borra: su historial —inventario, movimientos— debe seguir
 * siendo consultable.
 */
workshopRoutes.post('/:workshopId/deactivate', async (c) => {
  assertOwner(c);
  const orgId = c.get('orgId');
  const workshopId = c.req.param('workshopId');
  await assertWorkshopInOrg(workshopId, orgId);

  const { data, error } = await c.get('db')
    .from('workshops')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', workshopId)
    .select(WORKSHOP_COLUMNS)
    .maybeSingle();

  if (error) throw internal(`workshops.update: ${error.message}`);
  if (!data) throw notFound('workshop.not_found', 'Taller no encontrado.');

  await recordAudit({
    organizationId: orgId,
    workshopId,
    performedBy: c.get('userId'),
    action: 'workshop.deactivated',
    entity: 'workshop',
    entityId: workshopId,
  });

  return c.json({ workshop: data });
});

/** Miembros asignados al taller. La asignacion es operativa (RF-304). */
workshopRoutes.get('/:workshopId/assignments', async (c) => {
  const workshopId = c.req.param('workshopId');
  await assertWorkshopInOrg(workshopId, c.get('orgId'));

  const { data, error } = await c.get('db')
    .from('workshop_assignments')
    .select('id, workshop_id, memberships ( user_id, role, is_active )')
    .eq('workshop_id', workshopId);

  if (error) throw internal(`workshop_assignments.select: ${error.message}`);

  const assignments = (data ?? []).map((a: Record<string, unknown>) => {
    const m = a.memberships as { user_id: string; role: string; is_active: boolean } | null;
    return { id: a.id, userId: m?.user_id ?? null, role: m?.role ?? null, isActive: m?.is_active ?? null };
  });

  return c.json({ assignments });
});

/**
 * Asigna un miembro al taller (solo Owner) — RF-304.
 * La asignacion indica DONDE trabaja esa persona; no cambia lo que puede ver:
 * eso lo determina su rol en la organizacion (ADR-006).
 */
workshopRoutes.post('/:workshopId/assignments', async (c) => {
  assertOwner(c);
  const orgId = c.get('orgId');
  const workshopId = c.req.param('workshopId');
  await assertWorkshopInOrg(workshopId, orgId);
  const input = assignMemberSchema.parse(await c.req.json());

  const membershipId = await findMembershipId(orgId, input.userId);

  const { error } = await c.get('db')
    .from('workshop_assignments')
    .insert({ membership_id: membershipId, workshop_id: workshopId });

  if (error) {
    if (error.code === '23505') {
      throw conflict('member.already_active', 'El miembro ya esta asignado a este taller.');
    }
    throw internal(`workshop_assignments.insert: ${error.message}`);
  }

  return c.json({ workshopId, userId: input.userId }, 201);
});

/** Retira la asignacion de un miembro al taller (solo Owner) — RF-304. */
workshopRoutes.delete('/:workshopId/assignments/:userId', async (c) => {
  assertOwner(c);
  const orgId = c.get('orgId');
  const workshopId = c.req.param('workshopId');
  const targetUserId = c.req.param('userId');
  await assertWorkshopInOrg(workshopId, orgId);

  const membershipId = await findMembershipId(orgId, targetUserId);

  const { error } = await c.get('db')
    .from('workshop_assignments')
    .delete()
    .eq('membership_id', membershipId)
    .eq('workshop_id', workshopId);

  if (error) throw internal(`workshop_assignments.delete: ${error.message}`);

  return c.body(null, 204);
});

/**
 * Resuelve el identificador de la membresia, exigiendo que la cuenta sea
 * miembro. Consulta con clave de servicio a proposito: forma parte del control
 * de la aplicacion, y hacerlo depender de RLS colapsaria las dos capas en una
 * (ver `lib/supabase.ts`, excepcion 1).
 */
async function findMembershipId(orgId: string, userId: string): Promise<string> {
  const membership = await getMembership(orgId, userId);
  if (!membership) {
    throw notFound('member.not_found', 'La cuenta no es miembro de esta organizacion.');
  }

  const { data, error } = await serviceClient()
    .from('memberships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw internal(`memberships.select: ${error.message}`);
  if (!data) throw notFound('member.not_found', 'La cuenta no es miembro de esta organizacion.');
  return (data as { id: string }).id;
}

export type { Workshop };

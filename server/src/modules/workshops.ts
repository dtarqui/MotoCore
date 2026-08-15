import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';
import { requireMembership, requireOwner, getMembership } from '../lib/memberships.js';
import { assertWorkshopInOrg } from '../lib/workshop-context.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { createWorkshopSchema, updateWorkshopSchema, assignMemberSchema } from '../schemas.js';
import type { AppBindings, Workshop } from '../types.js';

/**
 * Sucursales de una empresa (ADR-006). Montado bajo
 * /api/organizations/:orgId/workshops — la ruta refleja que la sucursal solo
 * existe dentro de una empresa.
 *
 * Reglas de acceso: cualquier miembro LEE las sucursales de su empresa (no son
 * frontera de seguridad); solo el Owner las administra.
 */
export const workshopRoutes = new Hono<AppBindings>();

const WORKSHOP_COLUMNS = 'id, organization_id, name, address, phone, is_active, created_at, updated_at';

workshopRoutes.use('*', requireAuth);

/** Lista las sucursales de la empresa — RF-302. */
workshopRoutes.get('/', async (c) => {
  const orgId = c.req.param('orgId')!;
  await requireMembership(orgId, c.get('userId'));

  const { data, error } = await serviceClient()
    .from('workshops')
    .select(WORKSHOP_COLUMNS)
    .eq('organization_id', orgId)
    .order('name');

  if (error) throw badRequest('workshop.lookup_failed', error.message);
  return c.json({ workshops: data ?? [] });
});

/** Crea una sucursal en la empresa (solo Owner) — RF-301. */
workshopRoutes.post('/', async (c) => {
  const orgId = c.req.param('orgId')!;
  await requireOwner(orgId, c.get('userId'));
  const input = createWorkshopSchema.parse(await c.req.json());

  const { data, error } = await serviceClient()
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
    // Unico (organization_id, name): no puede haber dos sucursales con el
    // mismo nombre en una empresa, pero si en empresas distintas.
    if (error.code === '23505') {
      throw conflict('workshop.name_in_use', 'Ya existe una sucursal con ese nombre en la empresa.');
    }
    throw badRequest('workshop.create_failed', error.message);
  }

  return c.json({ workshop: data }, 201);
});

/** Detalle de una sucursal (requiere membership en su empresa). */
workshopRoutes.get('/:workshopId', async (c) => {
  const orgId = c.req.param('orgId')!;
  const workshopId = c.req.param('workshopId');
  await requireMembership(orgId, c.get('userId'));
  await assertWorkshopInOrg(workshopId, orgId);

  const { data, error } = await serviceClient()
    .from('workshops')
    .select(WORKSHOP_COLUMNS)
    .eq('id', workshopId)
    .maybeSingle();

  if (error) throw badRequest('workshop.lookup_failed', error.message);
  if (!data) throw notFound('workshop.not_found', 'Sucursal no encontrada.');

  return c.json({ workshop: data });
});

/** Edita una sucursal (solo Owner). */
workshopRoutes.patch('/:workshopId', async (c) => {
  const orgId = c.req.param('orgId')!;
  const workshopId = c.req.param('workshopId');
  await requireOwner(orgId, c.get('userId'));
  await assertWorkshopInOrg(workshopId, orgId);
  const input = updateWorkshopSchema.parse(await c.req.json());

  const { data, error } = await serviceClient()
    .from('workshops')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', workshopId)
    .select(WORKSHOP_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw conflict('workshop.name_in_use', 'Ya existe una sucursal con ese nombre en la empresa.');
    }
    throw badRequest('workshop.update_failed', error.message);
  }
  if (!data) throw notFound('workshop.not_found', 'Sucursal no encontrada.');

  return c.json({ workshop: data });
});

/**
 * Baja logica de la sucursal (solo Owner) — RF-305. No se borra: su historial
 * (inventario, movimientos) debe seguir siendo consultable.
 */
workshopRoutes.patch('/:workshopId/deactivate', async (c) => {
  const orgId = c.req.param('orgId')!;
  const workshopId = c.req.param('workshopId');
  await requireOwner(orgId, c.get('userId'));
  await assertWorkshopInOrg(workshopId, orgId);

  const { data, error } = await serviceClient()
    .from('workshops')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', workshopId)
    .select(WORKSHOP_COLUMNS)
    .maybeSingle();

  if (error) throw badRequest('workshop.update_failed', error.message);
  if (!data) throw notFound('workshop.not_found', 'Sucursal no encontrada.');

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

/** Miembros asignados a la sucursal. La asignacion es informativa (RF-304). */
workshopRoutes.get('/:workshopId/assignments', async (c) => {
  const orgId = c.req.param('orgId')!;
  const workshopId = c.req.param('workshopId');
  await requireMembership(orgId, c.get('userId'));
  await assertWorkshopInOrg(workshopId, orgId);

  const { data, error } = await serviceClient()
    .from('workshop_assignments')
    .select('id, workshop_id, memberships ( user_id, role, is_active )')
    .eq('workshop_id', workshopId);

  if (error) throw badRequest('workshop.lookup_failed', error.message);

  const assignments = (data ?? []).map((a: Record<string, unknown>) => {
    const m = a.memberships as { user_id: string; role: string; is_active: boolean } | null;
    return { id: a.id, userId: m?.user_id ?? null, role: m?.role ?? null, isActive: m?.is_active ?? null };
  });

  return c.json({ assignments });
});

/**
 * Asigna un miembro a la sucursal (solo Owner) — RF-304.
 * La asignacion indica DONDE trabaja esa persona; no cambia lo que puede ver:
 * eso lo determina su rol en la empresa (ADR-006).
 */
workshopRoutes.post('/:workshopId/assignments', async (c) => {
  const orgId = c.req.param('orgId')!;
  const workshopId = c.req.param('workshopId');
  await requireOwner(orgId, c.get('userId'));
  await assertWorkshopInOrg(workshopId, orgId);
  const input = assignMemberSchema.parse(await c.req.json());

  const membership = await getMembership(orgId, input.userId);
  if (!membership) {
    throw notFound('membership.not_found', 'El usuario no es miembro de esta organizacion.');
  }

  const { data: membershipRow, error: idErr } = await serviceClient()
    .from('memberships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', input.userId)
    .maybeSingle();

  if (idErr) throw badRequest('membership.lookup_failed', idErr.message);
  if (!membershipRow) throw notFound('membership.not_found', 'El usuario no es miembro de esta organizacion.');

  const { error } = await serviceClient()
    .from('workshop_assignments')
    .insert({ membership_id: (membershipRow as { id: string }).id, workshop_id: workshopId });

  if (error) {
    if (error.code === '23505') {
      throw conflict('workshop.already_assigned', 'El miembro ya esta asignado a esta sucursal.');
    }
    throw badRequest('workshop.assign_failed', error.message);
  }

  return c.json({ workshopId, userId: input.userId }, 201);
});

/** Quita la asignacion de un miembro a la sucursal (solo Owner). */
workshopRoutes.delete('/:workshopId/assignments/:userId', async (c) => {
  const orgId = c.req.param('orgId')!;
  const workshopId = c.req.param('workshopId');
  const targetUserId = c.req.param('userId');
  await requireOwner(orgId, c.get('userId'));
  await assertWorkshopInOrg(workshopId, orgId);

  const { data: membershipRow, error: idErr } = await serviceClient()
    .from('memberships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (idErr) throw badRequest('membership.lookup_failed', idErr.message);
  if (!membershipRow) throw notFound('membership.not_found', 'El usuario no es miembro de esta organizacion.');

  const { error } = await serviceClient()
    .from('workshop_assignments')
    .delete()
    .eq('membership_id', (membershipRow as { id: string }).id)
    .eq('workshop_id', workshopId);

  if (error) throw badRequest('workshop.unassign_failed', error.message);

  return c.body(null, 204);
});

export type { Workshop };

import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';
import { requireMembership, requireOwner, getMembership } from '../lib/memberships.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { createOrganizationSchema, inviteMemberSchema, updateRoleSchema } from '../schemas.js';
import type { AppBindings, Organization } from '../types.js';

export const organizationRoutes = new Hono<AppBindings>();

const ORG_COLUMNS = 'id, name, description, address, phone, email, owner_id, is_active, created_at, updated_at';

organizationRoutes.use('*', requireAuth);

/** Lista las organizaciones donde el usuario tiene una membership activa (no por ownership). */
organizationRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const { data, error } = await serviceClient()
    .from('memberships')
    .select(`role, organizations ( ${ORG_COLUMNS} )`)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw badRequest('membership.lookup_failed', error.message);

  const organizations = (data ?? [])
    .filter((m: Record<string, unknown>) => m.organizations)
    .map((m: Record<string, unknown>) => ({ role: m.role, organization: m.organizations }));

  return c.json({ organizations });
});

/** Crea una organizacion nueva y agrega al creador como Owner. */
organizationRoutes.post('/', async (c) => {
  const input = createOrganizationSchema.parse(await c.req.json());
  const userId = c.get('userId');
  const db = serviceClient();

  const { data: org, error: orgErr } = await db
    .from('organizations')
    .insert({
      name: input.name,
      description: input.description ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      owner_id: userId,
    })
    .select(ORG_COLUMNS)
    .single();

  if (orgErr || !org) throw badRequest('organization.create_failed', orgErr?.message ?? 'No se pudo crear.');

  const { error: memErr } = await db
    .from('memberships')
    .insert({ organization_id: (org as Organization).id, user_id: userId, role: 'owner' });

  if (memErr) throw badRequest('membership.create_failed', memErr.message);

  return c.json({ organization: org }, 201);
});

/** Detalle de una organizacion (requiere membership). */
organizationRoutes.get('/:orgId', async (c) => {
  const orgId = c.req.param('orgId');
  await requireMembership(orgId, c.get('userId'));

  const { data: org, error } = await serviceClient()
    .from('organizations')
    .select(ORG_COLUMNS)
    .eq('id', orgId)
    .maybeSingle();

  if (error) throw badRequest('organization.lookup_failed', error.message);
  if (!org) throw notFound('organization.not_found', 'Organizacion no encontrada.');

  return c.json({ organization: org });
});

/**
 * Cambiar de organizacion activa: valida la membership y devuelve org + rol.
 * El cliente guarda el orgId activo y lo envia como X-Org-Id en llamadas de
 * negocio (estilo QuickBooks/Zoho).
 */
organizationRoutes.post('/:orgId/switch', async (c) => {
  const orgId = c.req.param('orgId');
  const role = await requireMembership(orgId, c.get('userId'));

  const { data: org, error } = await serviceClient()
    .from('organizations')
    .select(ORG_COLUMNS)
    .eq('id', orgId)
    .maybeSingle();

  if (error) throw badRequest('organization.lookup_failed', error.message);
  if (!org) throw notFound('organization.not_found', 'Organizacion no encontrada.');

  return c.json({ organization: org, role });
});

/** Lista los miembros de la organizacion (requiere membership). */
organizationRoutes.get('/:orgId/members', async (c) => {
  const orgId = c.req.param('orgId');
  await requireMembership(orgId, c.get('userId'));
  const db = serviceClient();

  const { data: members, error } = await db
    .from('memberships')
    .select('user_id, role, is_active, joined_at')
    .eq('organization_id', orgId);

  if (error) throw badRequest('membership.lookup_failed', error.message);

  const userIds = (members ?? []).map((m: Record<string, unknown>) => m.user_id as string);
  const profilesById = new Map<string, Record<string, unknown>>();
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, email, first_name, last_name')
      .in('id', userIds);
    for (const p of profiles ?? []) profilesById.set((p as { id: string }).id, p as Record<string, unknown>);
  }

  const result = (members ?? []).map((m: Record<string, unknown>) => ({
    userId: m.user_id,
    role: m.role,
    isActive: m.is_active,
    joinedAt: m.joined_at,
    profile: profilesById.get(m.user_id as string) ?? null,
  }));

  return c.json({ members: result });
});

/** Invitar un usuario existente a la organizacion (solo Owner). */
organizationRoutes.post('/:orgId/members/invite', async (c) => {
  const orgId = c.req.param('orgId');
  await requireOwner(orgId, c.get('userId'));
  const input = inviteMemberSchema.parse(await c.req.json());
  const db = serviceClient();

  const { data: targetUserId, error: rpcErr } = await db.rpc('get_user_id_by_email', {
    p_email: input.email,
  });
  if (rpcErr) throw badRequest('membership.lookup_failed', rpcErr.message);
  if (!targetUserId) {
    throw notFound('membership.user_not_found', 'No existe una cuenta con ese email.');
  }

  const existing = await getMembership(orgId, targetUserId as string);
  if (existing) {
    if (existing.is_active) throw conflict('membership.already_member', 'El usuario ya es miembro.');
    // Reactivar una membership desactivada.
    const { error } = await db
      .from('memberships')
      .update({ role: input.role, is_active: true, updated_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId as string);
    if (error) throw badRequest('membership.update_failed', error.message);
    return c.json({ userId: targetUserId, role: input.role }, 201);
  }

  const { error } = await db
    .from('memberships')
    .insert({ organization_id: orgId, user_id: targetUserId as string, role: input.role });
  if (error) throw badRequest('membership.create_failed', error.message);

  return c.json({ userId: targetUserId, role: input.role }, 201);
});

/** Cambiar el rol de un miembro (solo Owner). No aplica al Owner de la organizacion. */
organizationRoutes.patch('/:orgId/members/:userId/role', async (c) => {
  const orgId = c.req.param('orgId');
  const targetUserId = c.req.param('userId');
  await requireOwner(orgId, c.get('userId'));
  const input = updateRoleSchema.parse(await c.req.json());
  const db = serviceClient();

  const org = await getOrganizationOwner(orgId);
  if (org.owner_id === targetUserId) {
    throw badRequest('membership.cannot_change_owner_role', 'No se puede cambiar el rol del Owner.');
  }

  const target = await getMembership(orgId, targetUserId);
  if (!target) throw notFound('membership.not_found', 'El usuario no es miembro de esta organizacion.');

  const { error } = await db
    .from('memberships')
    .update({ role: input.role, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId);
  if (error) throw badRequest('membership.update_failed', error.message);

  return c.json({ userId: targetUserId, role: input.role });
});

/** Quitar un miembro (solo Owner). No se puede quitar al Owner de la organizacion. */
organizationRoutes.delete('/:orgId/members/:userId', async (c) => {
  const orgId = c.req.param('orgId');
  const targetUserId = c.req.param('userId');
  await requireOwner(orgId, c.get('userId'));
  const db = serviceClient();

  const org = await getOrganizationOwner(orgId);
  if (org.owner_id === targetUserId) {
    throw badRequest('membership.cannot_remove_owner', 'No se puede quitar al Owner de la organizacion.');
  }

  const target = await getMembership(orgId, targetUserId);
  if (!target) throw notFound('membership.not_found', 'El usuario no es miembro de esta organizacion.');

  const { error } = await db
    .from('memberships')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId);
  if (error) throw badRequest('membership.delete_failed', error.message);

  return c.body(null, 204);
});

async function getOrganizationOwner(orgId: string): Promise<{ owner_id: string }> {
  const { data, error } = await serviceClient()
    .from('organizations')
    .select('owner_id')
    .eq('id', orgId)
    .maybeSingle();
  if (error) throw badRequest('organization.lookup_failed', error.message);
  if (!data) throw notFound('organization.not_found', 'Organizacion no encontrada.');
  return data as { owner_id: string };
}

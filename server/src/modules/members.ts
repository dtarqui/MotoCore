import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';
import { requireActiveOrg, type OrgBindings } from '../lib/org-context.js';
import { getMembership } from '../lib/memberships.js';
import { conflict, forbidden, internal, notFound } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { inviteMemberSchema, updateRoleSchema } from '../schemas.js';

/**
 * Miembros de la organizacion activa — RF-401..407.
 *
 * Montado en `/api/members`, sin el identificador de organizacion en la ruta:
 * la membresia es un recurso INTERIOR a la organizacion, y el §2.3 del contrato
 * reserva la ruta anidada solo para la organizacion misma. El contexto llega
 * por `X-Org-Id` y se valida en un unico punto (ADR-005).
 */
export const memberRoutes = new Hono<OrgBindings>();

memberRoutes.use('*', requireAuth, requireActiveOrg);

/**
 * Solo el Owner gestiona miembros (RF-406). El codigo nombra el modulo, no la
 * organizacion, tal como fija el §4 del contrato.
 */
function assertOwner(c: { get: (k: 'orgRole') => string }): void {
  if (c.get('orgRole') !== 'owner') {
    throw forbidden('member.insufficient_permissions', 'Solo el Owner puede gestionar miembros.');
  }
}

/**
 * RF-402: nadie se incorpora ni asciende directamente a `owner` — el Owner es
 * quien crea la organizacion.
 *
 * Se comprueba ANTES del esquema y con su codigo propio, `member.owner_role_forbidden`
 * (403), en lugar de dejar que el enum lo rechace como entrada mal formada: no
 * es que el valor sea invalido, es que la operacion no esta permitida. El
 * catalogo del contrato reserva un codigo justamente para distinguir ambos casos.
 */
function assertRoleNotOwner(body: unknown): void {
  const role = (body as { role?: unknown } | null)?.role;
  if (role === 'owner') {
    throw forbidden('member.owner_role_forbidden', 'No se puede asignar el rol Owner.');
  }
}

/** Lista los miembros de la organizacion activa con su rol y estado — RF-407. */
memberRoutes.get('/', async (c) => {
  const orgId = c.get('orgId');

  const { data: members, error } = await c.get('db')
    .from('mt_memberships')
    .select('user_id, role, is_active, joined_at')
    .eq('organization_id', orgId);

  if (error) throw internal(`memberships.select: ${error.message}`);

  // Los perfiles de los demas miembros exigen clave de servicio:
  // `profiles_select_own` solo deja leer el propio, y exponer el de un
  // co-miembro dentro de la organizacion es el privilegio acotado que sanciona
  // RF-407 (ver `lib/supabase.ts`, excepcion 4).
  const userIds = (members ?? []).map((m: Record<string, unknown>) => m.user_id as string);
  const profilesById = new Map<string, Record<string, unknown>>();
  if (userIds.length > 0) {
    const { data: profiles } = await serviceClient()
      .from('mt_profiles')
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

/**
 * Incorpora una cuenta EXISTENTE a la organizacion — RF-401, RF-402, RF-406.
 *
 * Si esa cuenta fue removida antes, se REACTIVA su membresia con el nuevo rol
 * en lugar de duplicarla (HU-09): la remocion es una baja logica, de modo que
 * la fila sigue ahi con `is_active = false`.
 */
memberRoutes.post('/invite', async (c) => {
  assertOwner(c);
  const orgId = c.get('orgId');
  const body = await c.req.json();
  assertRoleNotOwner(body);
  const input = inviteMemberSchema.parse(body);
  const db = c.get('db');

  // La busqueda por correo se concede solo a `service_role`: no se expone como
  // operacion consultable, para no ofrecer un mecanismo de enumeracion de
  // cuentas (RNF-106, excepcion 5).
  const { data: targetUserId, error: rpcErr } = await serviceClient().rpc('mt_get_user_id_by_email', {
    p_email: input.email,
  });
  if (rpcErr) throw internal(`get_user_id_by_email: ${rpcErr.message}`);
  if (!targetUserId) {
    throw notFound('member.not_found', 'No existe una cuenta con ese correo.');
  }

  const existing = await getMembership(orgId, targetUserId as string);
  if (existing?.is_active) {
    throw conflict('member.already_active', 'La cuenta ya es miembro activo de la organizacion.');
  }

  if (existing) {
    const { error } = await db
      .from('mt_memberships')
      .update({ role: input.role, is_active: true, updated_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId as string);
    if (error) throw internal(`memberships.update: ${error.message}`);
  } else {
    const { error } = await db
      .from('mt_memberships')
      .insert({ organization_id: orgId, user_id: targetUserId as string, role: input.role });
    if (error) throw internal(`memberships.insert: ${error.message}`);
  }

  await recordAudit({
    organizationId: orgId,
    performedBy: c.get('userId'),
    action: 'member.invited',
    entity: 'membership',
    entityId: targetUserId as string,
    details: { role: input.role, reactivated: Boolean(existing) },
  });

  return c.json({ userId: targetUserId, role: input.role }, 201);
});

/** Cambia el rol de un miembro — RF-403, RF-405. No aplica al Owner. */
memberRoutes.patch('/:userId/role', async (c) => {
  assertOwner(c);
  const orgId = c.get('orgId');
  const targetUserId = c.req.param('userId');
  const body = await c.req.json();
  assertRoleNotOwner(body);
  const input = updateRoleSchema.parse(body);
  const db = c.get('db');

  await assertNotOrganizationOwner(orgId, targetUserId, 'No se puede cambiar el rol del Owner.');

  const target = await getMembership(orgId, targetUserId);
  if (!target) throw notFound('member.not_found', 'La cuenta no es miembro de esta organizacion.');

  const { error } = await db
    .from('mt_memberships')
    .update({ role: input.role, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId);
  if (error) throw internal(`memberships.update: ${error.message}`);

  await recordAudit({
    organizationId: orgId,
    performedBy: c.get('userId'),
    action: 'member.role_changed',
    entity: 'membership',
    entityId: targetUserId,
    details: { from: target.role, to: input.role },
  });

  return c.json({ userId: targetUserId, role: input.role });
});

/**
 * Revoca la membresia — RF-404, RF-405. El acceso se pierde de inmediato.
 *
 * Es una BAJA LOGICA (`is_active = false`), no un borrado: el modelo de datos
 * exige conservar el historial de `memberships`, y es lo que permite que una
 * reincorporacion posterior reactive la fila en vez de duplicarla. Se expone
 * como `DELETE` porque lo que se revoca es el VINCULO entre cuenta y
 * organizacion, no el estado de un recurso propio (§2.6 del contrato).
 */
memberRoutes.delete('/:userId', async (c) => {
  assertOwner(c);
  const orgId = c.get('orgId');
  const targetUserId = c.req.param('userId');
  const db = c.get('db');

  await assertNotOrganizationOwner(orgId, targetUserId, 'No se puede remover al Owner de la organizacion.');

  const target = await getMembership(orgId, targetUserId);
  if (!target) throw notFound('member.not_found', 'La cuenta no es miembro de esta organizacion.');

  const { error } = await db
    .from('mt_memberships')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId);
  if (error) throw internal(`memberships.update: ${error.message}`);

  await recordAudit({
    organizationId: orgId,
    performedBy: c.get('userId'),
    action: 'member.removed',
    entity: 'membership',
    entityId: targetUserId,
    details: { role: target.role },
  });

  return c.body(null, 204);
});

/**
 * Regla de proteccion del propietario (RF-405): ni se le cambia el rol ni se le
 * remueve. Responde `403 member.owner_protected` — el recurso esta dentro de la
 * organizacion del solicitante, de modo que su existencia no es informacion
 * privilegiada; solo la operacion lo es (§5 del contrato).
 *
 * Consulta con clave de servicio: es una comprobacion de la capa de aplicacion,
 * y hacerla depender de RLS colapsaria las dos capas (excepcion 1).
 */
async function assertNotOrganizationOwner(orgId: string, userId: string, message: string): Promise<void> {
  const { data, error } = await serviceClient()
    .from('mt_organizations')
    .select('owner_id')
    .eq('id', orgId)
    .maybeSingle();

  if (error) throw internal(`organizations.select: ${error.message}`);
  if (!data) throw notFound('organization.not_found', 'Organizacion no encontrada.');
  if ((data as { owner_id: string }).owner_id === userId) {
    throw forbidden('member.owner_protected', message);
  }
}

import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';
import { requireMembership, requireOwner } from '../lib/memberships.js';
import { internal, notFound } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { createOrganizationSchema, updateOrganizationSchema } from '../schemas.js';
import type { AppBindings, Organization } from '../types.js';

/**
 * Organizaciones de la cuenta — RF-201..204.
 *
 * Es el UNICO modulo cuyo identificador de organizacion viaja en la ruta, y la
 * razon la fija el §2.3 del contrato: aqui la organizacion es el recurso, no el
 * contexto. Todo lo interior a ella —talleres, miembros, clientes, inventario,
 * auditoria— se resuelve por cabecera.
 */
export const organizationRoutes = new Hono<AppBindings>();

const ORG_COLUMNS = 'id, name, description, address, phone, email, owner_id, is_active, created_at, updated_at';

organizationRoutes.use('*', requireAuth);

/** Lista las organizaciones donde la cuenta tiene membresia activa (no por propiedad) — RF-202. */
organizationRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const { data, error } = await serviceClient()
    .from('memberships')
    .select(`role, organizations ( ${ORG_COLUMNS} )`)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw internal(`memberships.select: ${error.message}`);

  const organizations = (data ?? [])
    .filter((m: Record<string, unknown>) => m.organizations)
    .map((m: Record<string, unknown>) => ({ role: m.role, organization: m.organizations }));

  return c.json({ organizations });
});

/** Crea una organizacion nueva; el solicitante queda como Owner — RF-201. */
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

  if (orgErr || !org) throw internal(`organizations.insert: ${orgErr?.message ?? 'sin fila'}`);

  const { error: memErr } = await db
    .from('memberships')
    .insert({ organization_id: (org as Organization).id, user_id: userId, role: 'owner' });

  if (memErr) throw internal(`memberships.insert: ${memErr.message}`);

  return c.json({ organization: org }, 201);
});

/** Detalle de una organizacion (requiere membresia). */
organizationRoutes.get('/:orgId', async (c) => {
  const orgId = c.req.param('orgId');
  await requireMembership(orgId, c.get('userId'));

  const { data: org, error } = await serviceClient()
    .from('organizations')
    .select(ORG_COLUMNS)
    .eq('id', orgId)
    .maybeSingle();

  if (error) throw internal(`organizations.select: ${error.message}`);
  if (!org) throw notFound('organization.not_found', 'Organizacion no encontrada.');

  return c.json({ organization: org });
});

/**
 * Cambiar de organizacion activa — RF-203, ADR-005.
 *
 * No cambia estado en el servidor: no hay sesion que actualizar. VALIDA que la
 * cuenta pueda operar sobre esa organizacion y devuelve el rol, para que el
 * cliente guarde el contexto y lo envie como `X-Org-Id` en las llamadas
 * siguientes.
 */
organizationRoutes.post('/:orgId/switch', async (c) => {
  const orgId = c.req.param('orgId');
  const role = await requireMembership(orgId, c.get('userId'));

  const { data: org, error } = await serviceClient()
    .from('organizations')
    .select(ORG_COLUMNS)
    .eq('id', orgId)
    .maybeSingle();

  if (error) throw internal(`organizations.select: ${error.message}`);
  if (!org) throw notFound('organization.not_found', 'Organizacion no encontrada.');

  return c.json({ organization: org, role });
});

/** Edita los datos de la organizacion (solo Owner) — RF-204. Accion auditada (RF-703). */
organizationRoutes.patch('/:orgId', async (c) => {
  const orgId = c.req.param('orgId');
  await requireOwner(orgId, c.get('userId'), 'organization');
  const input = updateOrganizationSchema.parse(await c.req.json());

  const { data: org, error } = await serviceClient()
    .from('organizations')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', orgId)
    .select(ORG_COLUMNS)
    .maybeSingle();

  if (error) throw internal(`organizations.update: ${error.message}`);
  if (!org) throw notFound('organization.not_found', 'Organizacion no encontrada.');

  await recordAudit({
    organizationId: orgId,
    performedBy: c.get('userId'),
    action: 'organization.updated',
    entity: 'organization',
    entityId: orgId,
    details: { fields: Object.keys(input) },
  });

  return c.json({ organization: org });
});

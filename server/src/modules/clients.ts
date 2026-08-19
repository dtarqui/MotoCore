import { Hono } from 'hono';
import { requireAuth } from '../lib/auth.js';
import { requireActiveOrg, type OrgBindings } from '../lib/org-context.js';
import { conflict, forbidden, internal, notFound } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { createClientSchema, updateClientSchema } from '../schemas.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Role } from '../types.js';

/**
 * Clientes — entidad de NIVEL ORGANIZACION (RF-501..505).
 *
 * Solo exige la organizacion activa, no el taller: esa ausencia es deliberada
 * y es lo que demuestra RF-502. Un cliente registrado operando con un taller
 * se ve igual operando con cualquier otro de la misma organizacion.
 */
export const clientRoutes = new Hono<OrgBindings>();

const CLIENT_COLUMNS =
  'id, organization_id, first_name, last_name, email, phone, document_id, address, notes, is_active, created_at, updated_at';

/** RF-505: el Mechanic consulta clientes, pero no los crea ni los edita. */
const WRITE_ROLES: readonly Role[] = ['owner', 'receptionist'];

function assertCanWrite(role: Role): void {
  if (!WRITE_ROLES.includes(role)) {
    throw forbidden('client.insufficient_permissions', 'Tu rol no permite modificar clientes.');
  }
}

clientRoutes.use('*', requireAuth, requireActiveOrg);

/** Lista los clientes de la organizacion activa, con busqueda opcional — RF-502, RF-504. */
clientRoutes.get('/', async (c) => {
  const orgId = c.get('orgId');
  const search = c.req.query('search')?.trim();
  const includeInactive = c.req.query('includeInactive') === 'true';

  let query = c.get('db').from('clients').select(CLIENT_COLUMNS).eq('organization_id', orgId);

  if (!includeInactive) query = query.eq('is_active', true);
  if (search) {
    const like = `%${search}%`;
    query = query.or(
      `first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},document_id.ilike.${like}`,
    );
  }

  const { data, error } = await query.order('last_name').order('first_name');
  if (error) throw internal(`clients.select: ${error.message}`);

  return c.json({ clients: data ?? [] });
});

/** Registra un cliente en la organizacion activa — RF-501. */
clientRoutes.post('/', async (c) => {
  assertCanWrite(c.get('orgRole'));
  const orgId = c.get('orgId');
  const input = createClientSchema.parse(await c.req.json());

  const { data, error } = await c.get('db')
    .from('clients')
    .insert({
      organization_id: orgId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      document_id: input.documentId ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
    })
    .select(CLIENT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw conflict('client.duplicate_email', 'Ya existe un cliente con ese correo en la organizacion.');
    }
    throw internal(`clients.insert: ${error.message}`);
  }

  return c.json({ client: data }, 201);
});

/** Detalle de un cliente de la organizacion activa. */
clientRoutes.get('/:clientId', async (c) => {
  const client = await findInOrg(c.get('db'), c.req.param('clientId'), c.get('orgId'));
  return c.json({ client });
});

/** Edita un cliente — RF-504. */
clientRoutes.patch('/:clientId', async (c) => {
  assertCanWrite(c.get('orgRole'));
  const clientId = c.req.param('clientId');
  const orgId = c.get('orgId');
  await findInOrg(c.get('db'), clientId, orgId);
  const input = updateClientSchema.parse(await c.req.json());

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.email !== undefined) patch.email = input.email;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.documentId !== undefined) patch.document_id = input.documentId;
  if (input.address !== undefined) patch.address = input.address;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await c.get('db')
    .from('clients')
    .update(patch)
    .eq('id', clientId)
    .eq('organization_id', orgId)
    .select(CLIENT_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw conflict('client.duplicate_email', 'Ya existe un cliente con ese correo en la organizacion.');
    }
    throw internal(`clients.update: ${error.message}`);
  }
  if (!data) throw notFound('client.not_found', 'Cliente no encontrado.');

  return c.json({ client: data });
});

/**
 * Baja logica del cliente — RF-504. Accion auditada (RF-703).
 *
 * Se expone como `POST /deactivate` y no como `PATCH`: es una transicion de
 * estado con consecuencias de auditoria, no la edicion de un campo (§2.6 del
 * contrato). El registro se conserva y solo sale de los listados activos.
 */
clientRoutes.post('/:clientId/deactivate', async (c) => {
  assertCanWrite(c.get('orgRole'));
  const clientId = c.req.param('clientId');
  const orgId = c.get('orgId');
  await findInOrg(c.get('db'), clientId, orgId);

  const { data, error } = await c.get('db')
    .from('clients')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', clientId)
    .eq('organization_id', orgId)
    .select(CLIENT_COLUMNS)
    .maybeSingle();

  if (error) throw internal(`clients.update: ${error.message}`);
  if (!data) throw notFound('client.not_found', 'Cliente no encontrado.');

  await recordAudit({
    organizationId: orgId,
    performedBy: c.get('userId'),
    action: 'client.deactivated',
    entity: 'client',
    entityId: clientId,
  });

  return c.json({ client: data });
});

/**
 * Recupera el cliente exigiendo que sea de la organizacion activa. Un cliente
 * de otra organizacion devuelve "no encontrado", no "prohibido" (RNF-105):
 * distinguir ambos casos revelaria que ese identificador existe en otra parte.
 */
async function findInOrg(
  db: SupabaseClient,
  clientId: string,
  orgId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await db
    .from('clients')
    .select(CLIENT_COLUMNS)
    .eq('id', clientId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) throw internal(`clients.select: ${error.message}`);
  if (!data) throw notFound('client.not_found', 'Cliente no encontrado.');
  return data as Record<string, unknown>;
}

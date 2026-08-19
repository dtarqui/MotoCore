import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';
import { AppError, conflict, internal } from '../lib/errors.js';
import { getEnv } from '../lib/env.js';
import { registerSchema } from '../schemas.js';
import type { AppBindings } from '../types.js';

export const authRoutes = new Hono<AppBindings>();

/**
 * Registro (RF-101): crea la cuenta y, en un mismo acto, su primera
 * organizacion, su primer taller y la membresia Owner.
 *
 * Los tres ultimos pasos ocurren dentro de la funcion `register_account`, que
 * es una sola transaccion en Postgres (ADR-007). La cuenta en auth.users es lo
 * unico que queda fuera —solo la API de administracion puede crearla—, asi que
 * si la transaccion falla, se elimina la cuenta para no dejarla huerfana.
 *
 * El login NO se hace aqui: lo hace el cliente con Supabase Auth
 * (signInWithPassword). Esta API solo verifica el token que recibe (ADR-004).
 */
authRoutes.post('/register', async (c) => {
  const input = registerSchema.parse(await c.req.json());
  const db = serviceClient();

  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: getEnv().autoConfirmEmail,
    user_metadata: { first_name: input.firstName, last_name: input.lastName },
  });

  if (createErr || !created.user) {
    const msg = (createErr?.message ?? '').toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      throw conflict('auth.email_already_registered', 'Ya existe una cuenta con ese correo.');
    }
    // El registro no pudo completarse y no quedo nada aplicado. No es 409: no
    // contradice ninguna regla de negocio sobre el estado actual, sino que la
    // operacion fallo del lado del servidor (§2.6 y §4 del contrato).
    throw registrationFailed(createErr?.message ?? 'createUser sin usuario devuelto');
  }

  const userId = created.user.id;

  // El trigger on_auth_user_created ya crea el profile; upsert por robustez.
  await db.from('profiles').upsert({
    id: userId,
    email: input.email,
    first_name: input.firstName,
    last_name: input.lastName,
  });

  // Organizacion + taller + membresia Owner, en una sola transaccion.
  const { data: created2, error: rpcErr } = await db.rpc('register_account', {
    p_user_id: userId,
    p_org_name: input.organizationName,
    p_workshop_name: input.workshopName ?? input.organizationName,
  });

  const provisioned = Array.isArray(created2) ? created2[0] : created2;

  if (rpcErr || !provisioned) {
    // La transaccion no dejo nada a medias; solo queda revertir la cuenta,
    // para que el registro entero sea atomico de cara al cliente (ADR-007).
    await db.auth.admin.deleteUser(userId).catch(() => undefined);
    throw registrationFailed(rpcErr?.message ?? 'register_account sin fila devuelta');
  }

  const { organization_id: orgId, workshop_id: workshopId } = provisioned as {
    organization_id: string;
    workshop_id: string;
  };

  const { data: org } = await db
    .from('organizations')
    .select('id, name, description, address, phone, email, owner_id, is_active, created_at, updated_at')
    .eq('id', orgId)
    .maybeSingle();

  const { data: workshop } = await db
    .from('workshops')
    .select('id, organization_id, name, address, phone, is_active, created_at, updated_at')
    .eq('id', workshopId)
    .maybeSingle();

  return c.json({ userId, organization: org, workshop }, 201);
});

/**
 * `auth.registration_failed` con estado 500: el registro atomico se interrumpio
 * y no dejo nada aplicado. La causa se registra en consola, no se devuelve.
 */
function registrationFailed(cause: string): AppError {
  console.error('[auth.registration_failed]', cause);
  return new AppError(
    'auth.registration_failed',
    'No se pudo completar el registro. No se creo ninguna cuenta.',
    500,
  );
}

/** Perfil + organizaciones (con rol) de la cuenta autenticada. Alimenta el selector de organizacion. */
authRoutes.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const db = serviceClient();

  const { data: profile } = await db
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('id', userId)
    .maybeSingle();

  const { data: memberships, error } = await db
    .from('memberships')
    .select('role, is_active, organizations ( id, name, is_active )')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw internal(`memberships.select: ${error.message}`);

  const organizations = (memberships ?? []).map((m: Record<string, unknown>) => ({
    role: m.role,
    organization: m.organizations,
  }));

  return c.json({ userId, email: c.get('userEmail'), profile: profile ?? null, organizations });
});

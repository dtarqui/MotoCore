import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';
import { badRequest, conflict } from '../lib/errors.js';
import { getEnv } from '../lib/env.js';
import { registerSchema } from '../schemas.js';
import type { AppBindings } from '../types.js';

export const authRoutes = new Hono<AppBindings>();

/**
 * Registro: crea la cuenta (Supabase Auth), su primera organizacion y la
 * membership Owner, de forma atomica-a-nivel-de-aplicacion (mismo contrato que
 * el backend .NET). El login se hace desde el cliente con Supabase Auth
 * (signInWithPassword), no aqui.
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
      throw conflict('auth.email_in_use', 'Ya existe una cuenta con ese email.');
    }
    throw badRequest('auth.register_failed', createErr?.message ?? 'No se pudo crear la cuenta.');
  }

  const userId = created.user.id;

  // El trigger on_auth_user_created ya crea el profile; upsert por robustez.
  await db.from('profiles').upsert({
    id: userId,
    email: input.email,
    first_name: input.firstName,
    last_name: input.lastName,
  });

  const { data: org, error: orgErr } = await db
    .from('organizations')
    .insert({ name: input.organizationName, owner_id: userId })
    .select('id, name, description, address, phone, email, owner_id, is_active, created_at, updated_at')
    .single();

  if (orgErr || !org) {
    // Evita cuenta huerfana si falla la creacion de la organizacion.
    await db.auth.admin.deleteUser(userId).catch(() => undefined);
    throw badRequest('organization.create_failed', orgErr?.message ?? 'No se pudo crear la organizacion.');
  }

  const { error: memErr } = await db
    .from('memberships')
    .insert({ organization_id: org.id, user_id: userId, role: 'owner' });

  if (memErr) {
    throw badRequest('membership.create_failed', memErr.message);
  }

  return c.json({ userId, organization: org }, 201);
});

/** Perfil + organizaciones (con rol) del usuario autenticado. Alimenta el selector de organizacion. */
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

  if (error) throw badRequest('membership.lookup_failed', error.message);

  const organizations = (memberships ?? []).map((m: Record<string, unknown>) => ({
    role: m.role,
    organization: m.organizations,
  }));

  return c.json({ userId, email: c.get('userEmail'), profile: profile ?? null, organizations });
});

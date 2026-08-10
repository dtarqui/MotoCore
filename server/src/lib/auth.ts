import type { MiddlewareHandler } from 'hono';
import { serviceClient } from './supabase.js';
import { unauthorized } from './errors.js';
import type { AppBindings } from '../types.js';

/**
 * Verifica el access token de Supabase (Authorization: Bearer <jwt>) y deja
 * userId/userEmail/userToken en el contexto. La emision/refresh de tokens la
 * maneja Supabase Auth en el cliente; aqui solo validamos.
 */
export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    throw unauthorized('auth.unauthorized', 'Falta el token de acceso.');
  }

  const { data, error } = await serviceClient().auth.getUser(token);
  if (error || !data.user) {
    throw unauthorized('auth.invalid_token', 'Token invalido o expirado.');
  }

  c.set('userId', data.user.id);
  c.set('userEmail', data.user.email ?? '');
  c.set('userToken', token);
  await next();
};

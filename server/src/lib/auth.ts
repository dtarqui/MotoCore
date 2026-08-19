import type { MiddlewareHandler } from 'hono';
import { serviceClient, userClient } from './supabase.js';
import { unauthorized } from './errors.js';
import type { AppBindings } from '../types.js';

/**
 * Verifica el access token de Supabase (Authorization: Bearer <jwt>) y deja la
 * identidad y el cliente de datos de la peticion en el contexto. La emision y
 * la renovacion de tokens las maneja Supabase Auth en el cliente; aqui solo se
 * verifica (ADR-004).
 *
 * El `db` que deja en el contexto esta atado a esa credencial, de modo que
 * toda consulta de negocio se evalue contra las politicas RLS con la identidad
 * real de quien llama.
 */
export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    throw unauthorized('auth.missing_token', 'Falta la credencial de sesion.');
  }

  const { data, error } = await serviceClient().auth.getUser(token);
  if (error || !data.user) {
    throw unauthorized('auth.invalid_token', 'Credencial invalida, expirada o revocada.');
  }

  c.set('userId', data.user.id);
  c.set('userEmail', data.user.email ?? '');
  c.set('userToken', token);
  // Un solo cliente por peticion: crearlo por consulta multiplicaria el coste
  // de arranque en una funcion efimera.
  c.set('db', userClient(token));
  await next();
};

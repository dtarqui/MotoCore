import type { MiddlewareHandler } from 'hono';
import type { AccessGateway } from './access.js';
import { unauthorized } from './errors.js';
import type { AuthEnv } from '../types.js';

/**
 * Verifica la credencial de sesión (`Authorization: Bearer <jwt>`) y deja en el
 * contexto la identidad y el cliente de datos de la petición (RF-103).
 *
 * La emisión y la renovación de credenciales ocurren contra el proveedor de
 * identidad, en el cliente; aquí solo se verifica (ADR-004). El cliente de
 * datos se construye **una sola vez**, en este punto, para que la decisión de
 * con qué identidad se consulta la base esté concentrada (ADR-008).
 */
export function requireAuth(access: AccessGateway): MiddlewareHandler<AuthEnv> {
  return async (c, next) => {
    const header = c.req.header('Authorization') ?? '';
    // El esquema no distingue mayúsculas (RFC 9110 §11.1).
    const token = /^Bearer\s+(\S+)\s*$/i.exec(header)?.[1] ?? '';
    if (!token) {
      throw unauthorized('auth.missing_token', 'Falta la credencial de sesión.');
    }

    const identity = await access.verifyToken(token);
    if (!identity) {
      throw unauthorized('auth.invalid_token', 'Credencial inválida, expirada o revocada.');
    }

    c.set('identity', identity);
    c.set('db', access.requestClient(token));
    await next();
  };
}

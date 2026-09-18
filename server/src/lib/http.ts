import type { Context } from 'hono';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Un identificador mal formado se trata como uno inexistente.
 *
 * Sin esta comprobación, el motor rechaza la consulta con un error de sintaxis
 * y la respuesta sería `500`, distinta del `404` de un recurso inexistente: un
 * detalle que rompería la regla de no divulgación (RNF-105) y que, además, no
 * es un fallo del servidor.
 */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}

/** Marca de un cuerpo que no es JSON legible. */
export const MALFORMED_BODY: unique symbol = Symbol('cuerpo-mal-formado');

/**
 * Cuerpo JSON de la petición, sin lanzar.
 *
 * Un cuerpo ilegible es entrada inválida (400), pero **no se rechaza aquí**: el
 * servicio lo rechaza al validarlo, después de comprobar la membresía y el rol.
 * Así una cuenta sin permiso recibe siempre su `403`, y no un `400` que le
 * confirmaría detalles de la operación que no puede ejecutar.
 */
export async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return MALFORMED_BODY;
  }
}

/** Parámetro de consulta booleano: solo `true` activa el filtro (§2.5 del contrato). */
export function queryFlag(value: string | undefined): boolean {
  return value === 'true';
}

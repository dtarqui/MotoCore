import { z, type ZodTypeAny } from 'zod';
import { invalidBody } from './errors.js';
import { MALFORMED_BODY } from './http.js';

/**
 * Piezas comunes de los esquemas de entrada (los DTO de cada módulo).
 *
 * Los campos opcionales de texto convierten la cadena vacía en `null`: un
 * formulario que deja un campo en blanco quiere decir «sin dato», no guardar
 * una cadena vacía que después habría que distinguir de la ausencia.
 */

const blankToNull = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value);

/** Texto obligatorio, recortado y no vacío. */
export const requiredText = (max: number) => z.string().trim().min(1, 'Es obligatorio.').max(max);

/** Texto opcional: `undefined` no lo toca, `null` o vacío lo deja sin dato. */
export const optionalText = (max: number) =>
  z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());

/** Correo opcional, con las mismas reglas que el texto opcional. */
export const optionalEmail = () =>
  z.preprocess(blankToNull, z.string().trim().email('Correo inválido.').max(254).nullable().optional());

/** Una actualización parcial debe traer al menos un campo. */
export const atLeastOneField = (value: Record<string, unknown>) => Object.values(value).some((v) => v !== undefined);

export const AT_LEAST_ONE_FIELD = 'Debe indicar al menos un campo a modificar.';

/** El cuerpo no es JSON legible: se rechaza con el mismo código que cualquier entrada inválida. */
export function assertReadableBody(body: unknown): void {
  if (body === MALFORMED_BODY) {
    throw invalidBody({ _: ['El cuerpo de la petición no es JSON válido.'] });
  }
}

/** Valida el cuerpo contra su esquema (RNF-205). Se llama después de las comprobaciones de acceso. */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  assertReadableBody(body);
  return schema.parse(body);
}

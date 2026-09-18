import type { PostgrestError } from '@supabase/supabase-js';
import { internal } from './errors.js';

/**
 * Señales que los repositorios levantan hacia los servicios.
 *
 * Los repositorios hablan el idioma del motor; los servicios, el del contrato.
 * Estas dos clases son la frontera: el repositorio dice *qué* regla se violó,
 * y el servicio decide con qué código `modulo.razon` y qué estado se responde.
 * Así el servicio no depende del proveedor de datos (ADR-009, riesgo R3).
 */

/** Violación de una restricción de unicidad: un duplicado, no un fallo del servidor. */
export class UniqueViolation extends Error {
  constructor(operation: string) {
    super(`${operation}: unicidad`);
    this.name = 'UniqueViolation';
  }
}

/**
 * Regla de negocio levantada por una función del motor con
 * `raise exception '<modulo.razon>'` (ADR-007). `code` es ya un código del
 * catálogo del contrato.
 */
export class RuleViolation extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'RuleViolation';
  }
}

/** Traduce un error del motor: la unicidad es regla de negocio; lo demás, `server.error`. */
export function fromDb(operation: string, error: PostgrestError): Error {
  if (error.code === '23505') return new UniqueViolation(operation);
  return internal(`${operation}: ${error.message}`);
}

/**
 * Traduce el error de una función atómica. Solo los códigos que la operación
 * declara conocer pasan como regla de negocio; cualquier otro mensaje del motor
 * es un fallo del servidor y no se reinterpreta.
 */
export function fromRpc(operation: string, error: PostgrestError, known: readonly string[]): Error {
  const code = known.find((k) => error.message === k);
  return code ? new RuleViolation(code) : internal(`${operation}: ${error.message}`);
}

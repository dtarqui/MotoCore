import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

/**
 * Error de negocio con código `modulo.razon` y el estado HTTP asociado. Se
 * serializa como Problem Details (RFC 9457) para cumplir RNF-204: formato
 * uniforme y códigos estables en todas las respuestas de error.
 *
 * Los códigos que puede emitir la API son EXACTAMENTE los del §4 del contrato
 * de la interfaz. Un fallo que no corresponda a ninguno de ellos no inventa un
 * código nuevo: se propaga como `server.error` (500) a través de `internal()`.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: ContentfulStatusCode,
    /** Causa real de un fallo del servidor. Se registra; nunca viaja al cliente. */
    public readonly internalCause?: string,
    /** Detalle por campo de un error de validación (RNF-205). */
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (code: string, message: string) => new AppError(code, message, 400);
export const unauthorized = (code: string, message: string) => new AppError(code, message, 401);
export const forbidden = (code: string, message: string) => new AppError(code, message, 403);
export const notFound = (code: string, message: string) => new AppError(code, message, 404);
export const conflict = (code: string, message: string) => new AppError(code, message, 409);

/** Entrada que no satisface el esquema, con el campo culpable señalado (RNF-205). */
export function invalidBody(fieldErrors: Record<string, string[]>): AppError {
  return new AppError('validation.invalid_body', 'Uno o más campos son inválidos.', 400, undefined, fieldErrors);
}

/**
 * Fallo del lado del servidor: la operación no se completó y no dejó nada
 * aplicado (§2.6 del contrato). Es lo que corresponde a un error inesperado de
 * la base de datos, que no contradice ninguna regla de negocio.
 */
export function internal(cause: string, message = 'No se pudo completar la operación.'): AppError {
  return new AppError('server.error', message, 500, cause);
}

/** Problem Details for HTTP APIs (RFC 9457). `title` transporta el código `modulo.razon`. */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, string[]>;
}

/**
 * RFC 9457 §4.2.1: cuando no se dispone de una URI que documente el tipo de
 * problema, se usa "about:blank" y el código viaja en `title`.
 */
function problem(status: number, title: string, detail: string, errors?: Record<string, string[]>): ProblemDetails {
  return errors
    ? { type: 'about:blank', title, status, detail, errors }
    : { type: 'about:blank', title, status, detail };
}

/**
 * Registro operativo de un fallo del servidor (Arquitectura, sección 15): la
 * causa, el código devuelto, la ruta y el identificador de la organización
 * activa. Nunca la cabecera `Authorization`, contraseñas ni el contenido de
 * filas de negocio.
 */
function logServerError(c: Context, code: string, cause: unknown): void {
  console.error('[server.error]', {
    method: c.req.method,
    path: c.req.path,
    org: c.req.header('X-Org-Id') ?? null,
    code,
    cause: cause instanceof Error ? (cause.stack ?? cause.message) : cause,
  });
}

/**
 * Respuesta de error con el tipo de medio que fija RFC 9457 §3:
 * `application/problem+json`, no `application/json` a secas. Es lo que permite
 * a un consumidor distinguir un problema de una respuesta de negocio sin mirar
 * el estado.
 */
function problemResponse(c: Context, details: ProblemDetails): Response {
  return c.json(details, details.status as ContentfulStatusCode, {
    'Content-Type': 'application/problem+json',
  });
}

/** Manejador central de errores: AppError, ZodError y fallos inesperados, todos como Problem Details. */
export function handleError(err: unknown, c: Context): Response {
  if (err instanceof AppError) {
    if (err.status >= 500) logServerError(c, err.code, err.internalCause ?? err.message);
    return problemResponse(c, problem(err.status, err.code, err.message, err.fieldErrors));
  }
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return problemResponse(c, problem(400, 'validation.invalid_body', 'Uno o más campos son inválidos.', fieldErrors));
  }
  logServerError(c, 'server.error', err);
  return problemResponse(c, problem(500, 'server.error', 'Ocurrió un error inesperado.'));
}

/**
 * Ruta desconocida.
 *
 * Una ruta que no existe **dentro de un módulo** se responde con el `404` de
 * ese módulo: para quien llama es indistinguible de un recurso inexistente, que
 * es justo lo que exige la regla de no divulgación (RNF-105). Así toda respuesta
 * de error de la interfaz sigue Problem Details con un código del catálogo
 * (RNF-204), sin inventar uno nuevo para el caso.
 *
 * Lo que queda fuera de `/api` no es interfaz: ahí se responde un `404` desnudo.
 */
const MODULE_NOT_FOUND: Array<[string, string]> = [
  ['/api/organizations', 'organization.not_found'],
  ['/api/workshops', 'workshop.not_found'],
  ['/api/members', 'member.not_found'],
  ['/api/clients', 'client.not_found'],
  ['/api/inventory', 'inventory.part_not_found'],
];

export function handleNotFound(c: Context): Response {
  const match = MODULE_NOT_FOUND.find(([prefix]) => c.req.path.startsWith(prefix));
  if (!match) return c.text('404 Not Found', 404);
  return problemResponse(c, problem(404, match[1], 'Recurso no encontrado.'));
}

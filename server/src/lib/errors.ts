import type { Context } from 'hono';
import { ZodError } from 'zod';

/**
 * Error de negocio con codigo `modulo.razon` y un status HTTP asociado.
 * Se serializa como Problem Details (RFC 9457) para cumplir RNF-204: formato
 * uniforme y codigos estables en todas las respuestas de error.
 *
 * Los codigos que puede emitir la API son EXACTAMENTE los del §4 del contrato
 * de la interfaz. Un fallo que no corresponda a ninguno de ellos no inventa un
 * codigo nuevo: se propaga como `server.error` (500) a traves de `internal()`.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
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

/**
 * Fallo del lado del servidor: la operacion no se completo y no dejo nada
 * aplicado (§2.6 del contrato). Es lo que corresponde a un error inesperado de
 * la base de datos, que no contradice ninguna regla de negocio.
 *
 * `cause` no viaja al cliente —revelaria detalle interno—, pero se registra en
 * consola para poder diagnosticar el fallo.
 */
export function internal(cause: string, message = 'No se pudo completar la operacion.'): AppError {
  console.error('[server.error]', cause);
  return new AppError('server.error', message, 500);
}

/** Problem Details for HTTP APIs (RFC 9457). `title` transporta el codigo `modulo.razon`. */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, string[]>;
}

/**
 * RFC 9457 §4.2.1: cuando no se dispone de una URI que documente el tipo de
 * problema, se usa "about:blank" y el codigo viaja en `title`.
 */
function problem(status: number, title: string, detail: string, errors?: Record<string, string[]>): ProblemDetails {
  return { type: 'about:blank', title, status, detail, errors };
}

/**
 * Handler central de errores para Hono. Mapea AppError, ZodError y fallos
 * inesperados a Problem Details.
 */
export function handleError(err: unknown, c: Context): Response {
  if (err instanceof AppError) {
    return c.json(problem(err.status, err.code, err.message), err.status as 400);
  }
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return c.json(
      problem(400, 'validation.invalid_body', 'Uno o mas campos son invalidos.', fieldErrors),
      400,
    );
  }
  console.error('[unhandled]', err);
  return c.json(problem(500, 'server.error', 'Ocurrio un error inesperado.'), 500);
}

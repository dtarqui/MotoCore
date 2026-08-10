import type { Context } from 'hono';
import { ZodError } from 'zod';

/**
 * Error de negocio con codigo `modulo.razon` (mismo catalogo que el backend
 * .NET original) y un status HTTP asociado. Se serializa como ProblemDetails
 * (RFC 7807) para que el api-client del frontend lo maneje sin cambios.
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

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, string[]>;
}

function problem(status: number, title: string, detail: string, errors?: Record<string, string[]>): ProblemDetails {
  return { type: `https://httpstatuses.com/${status}`, title, status, detail, errors };
}

/**
 * Handler central de errores para Hono. Mapea AppError, ZodError y fallos
 * inesperados a ProblemDetails.
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
      problem(400, 'validation.failed', 'Uno o mas campos son invalidos.', fieldErrors),
      400,
    );
  }
  console.error('[unhandled]', err);
  return c.json(problem(500, 'server.error', 'Ocurrio un error inesperado.'), 500);
}

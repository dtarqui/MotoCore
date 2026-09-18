import type { MiddlewareHandler } from 'hono';

/**
 * Registro de invocaciones (Arquitectura, sección 15): ruta, método, código de
 * estado, duración y el identificador de la organización activa.
 *
 * El identificador de la organización se registra desde el principio porque es
 * lo que permite **prorratear el consumo entre organizaciones** al medir el
 * costo operativo (objetivo complementario 6, mitigación del riesgo R10). Sin
 * él, el panel del proveedor da un total y no se puede imputar a nadie.
 *
 * QUÉ NO ENTRA AQUÍ, NUNCA: contraseñas, la cabecera `Authorization`,
 * credenciales del proveedor ni contenido de filas de negocio. De la
 * organización y del taller se registra su **identificador**, no su nombre.
 *
 * En las pruebas no se emite nada: la salida del ejecutor es evidencia, y
 * mezclarla con una línea por petición la haría ilegible.
 */
const silencioso = Boolean(process.env.VITEST) || process.env.NODE_ENV === 'test';

export function requestLog(): MiddlewareHandler {
  return async (c, next) => {
    const inicio = Date.now();
    await next();
    if (silencioso) return;

    console.log(
      JSON.stringify({
        at: new Date().toISOString(),
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ms: Date.now() - inicio,
        org: c.req.header('X-Org-Id') ?? null,
        workshop: c.req.header('X-Workshop-Id') ?? null,
      }),
    );
  };
}

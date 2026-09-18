import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { buildOpenApiDocument, ERROR_CATALOG } from '../../src/openapi.js';

/**
 * LA DESCRIPCIÓN OPENAPI NO SE DESINCRONIZA — §7 del contrato.
 *
 * La descripción deriva del contrato y describe lo que la interfaz hace. Estas
 * pruebas son las que impiden que se quede atrás: si se añade una ruta, si se
 * cambia un esquema de entrada o si se emite un código de error nuevo sin
 * regenerar el documento, el pipeline falla aquí.
 */
const raiz = fileURLToPath(new URL('../../', import.meta.url));

const documento = buildOpenApiDocument() as {
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, unknown> };
};

/** Rutas que la aplicación monta de verdad, en la grafía de OpenAPI. */
function rutasDeLaAplicacion(): Set<string> {
  const rutas = new Set<string>();
  for (const { method, path: ruta } of createApp().routes) {
    // `ALL` son los middlewares montados con `use`, no operaciones.
    if (method === 'ALL') continue;
    rutas.add(`${method.toLowerCase()} ${ruta.replace(/:([A-Za-z]+)/g, '{$1}')}`);
  }
  return rutas;
}

function operacionesDelDocumento(): Set<string> {
  const operaciones = new Set<string>();
  for (const [ruta, item] of Object.entries(documento.paths)) {
    for (const metodo of Object.keys(item)) {
      if (metodo === 'parameters') continue;
      operaciones.add(`${metodo} ${ruta}`);
    }
  }
  return operaciones;
}

/** Todos los archivos `.ts` de `src/`, para leer los códigos que el código emite. */
function fuentes(dir = path.join(raiz, 'src')): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return fuentes(completo);
    return entrada.name.endsWith('.ts') && entrada.name !== 'openapi.ts' ? [completo] : [];
  });
}

describe('descripción OpenAPI 3.1 (§7 del contrato)', () => {
  it('el archivo publicado coincide con lo que genera el código', () => {
    const publicado = fs.readFileSync(path.join(raiz, 'openapi.json'), 'utf8');
    expect(JSON.parse(publicado), 'openapi.json quedó desactualizado: ejecuta `npm run openapi`').toEqual(documento);
  });

  it('describe exactamente las operaciones que la interfaz monta, sin faltar ni sobrar', () => {
    const app = rutasDeLaAplicacion();
    const doc = operacionesDelDocumento();

    expect([...app].filter((r) => !doc.has(r)).sort(), 'operaciones sin describir').toEqual([]);
    expect([...doc].filter((r) => !app.has(r)).sort(), 'operaciones descritas que no existen').toEqual([]);
  });

  it('el catálogo de errores es cerrado: todo código que el código emite está descrito', () => {
    // Los códigos viajan como primer argumento de los constructores de error.
    const constructor =
      /\b(?:badRequest|unauthorized|forbidden|notFound|conflict|new AppError)\(\s*'([a-z]+\.[a-z_]+)'/g;
    const emitidos = new Set<string>();
    for (const archivo of fuentes()) {
      const contenido = fs.readFileSync(archivo, 'utf8');
      for (const [, codigo] of contenido.matchAll(constructor)) {
        if (codigo) emitidos.add(codigo);
      }
    }

    // `server.error` lo emite `internal()`, y los de inventario los levanta el
    // motor y los traduce el servicio a partir de su tabla de reglas.
    emitidos.add('server.error');

    expect([...emitidos].filter((codigo) => !(codigo in ERROR_CATALOG)).sort()).toEqual([]);
    expect(Object.keys(ERROR_CATALOG).length).toBeGreaterThanOrEqual(emitidos.size);
  });

  it('toda operación autenticada declara su respuesta de credencial ausente o inválida', () => {
    for (const [ruta, item] of Object.entries(documento.paths)) {
      for (const [metodo, operacion] of Object.entries(item)) {
        if (metodo === 'parameters') continue;
        const op = operacion as { security?: unknown[]; responses: Record<string, unknown> };
        // Las dos operaciones públicas declaran `security: []`.
        if (op.security?.length === 0) continue;
        expect(Object.keys(op.responses), `${metodo} ${ruta}`).toContain('401');
      }
    }
  });

  it('toda operación de nivel taller exige las dos cabeceras de contexto', () => {
    for (const [ruta, item] of Object.entries(documento.paths)) {
      if (!ruta.startsWith('/api/inventory')) continue;
      const parametros = (item.parameters ?? []) as Array<{ $ref?: string }>;
      const refs = parametros.map((p) => p.$ref);
      expect(refs, ruta).toContain('#/components/parameters/OrgId');
      expect(refs, ruta).toContain('#/components/parameters/WorkshopId');
    }
  });

  it('ninguna operación de clientes exige el taller activo: es la evidencia de RF-502', () => {
    for (const [ruta, item] of Object.entries(documento.paths)) {
      if (!ruta.startsWith('/api/clients')) continue;
      const refs = ((item.parameters ?? []) as Array<{ $ref?: string }>).map((p) => p.$ref);
      expect(refs, ruta).not.toContain('#/components/parameters/WorkshopId');
    }
  });
});

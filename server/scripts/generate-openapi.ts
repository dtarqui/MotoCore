import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildOpenApiDocument } from '../src/openapi.js';

/**
 * Escribe `server/openapi.json`, la descripción OpenAPI 3.1 que el §7 del
 * contrato exige publicar.
 *
 * El archivo se versiona junto al código y **no** se sirve como ruta: la
 * superficie pública de la interfaz son el registro y la comprobación de
 * disponibilidad, y publicar aquí la descripción la ampliaría sin necesidad.
 *
 * Una prueba de contrato comprueba que lo publicado coincide con lo que genera
 * `src/openapi.ts`, de modo que un cambio en un esquema o en una ruta que no se
 * regenere aquí rompe el pipeline en lugar de pasar inadvertido.
 */
const destino = fileURLToPath(new URL('../openapi.json', import.meta.url));

fs.writeFileSync(destino, `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`, 'utf8');
console.log(`Descripción OpenAPI escrita en ${destino}`);

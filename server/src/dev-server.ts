import { serve } from '@hono/node-server';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

/**
 * Carga `server/.env` en el entorno del proceso.
 *
 * Ocurre **solo aqui**, que es el arranque de desarrollo: en Vercel las
 * variables las entrega la plataforma y `api/index.ts` no debe leer ningun
 * archivo del disco. Las pruebas resuelven lo mismo por su lado, en
 * `vitest.config.ts`, y este arranque se habia quedado sin equivalente.
 *
 * Sin esto el servidor levanta igual —`getEnv()` se evalua de forma perezosa,
 * en la primera peticion que necesita Supabase— y falla recien al registrar,
 * con tres `Required` que no delatan que el archivo nunca se leyo.
 *
 * Lo que ya venga en el entorno **no se pisa**: `loadEnvFile` respeta las
 * variables previas, de modo que `SUPABASE_URL=... npm run dev` sigue mandando
 * sobre el archivo.
 */
const rutaEnv = fileURLToPath(new URL('../.env', import.meta.url));
if (fs.existsSync(rutaEnv)) {
  process.loadEnvFile(rutaEnv);
} else {
  console.warn(`Aviso: no existe ${rutaEnv}; las variables deben venir del entorno.`);
}

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: createApp().fetch, port }, (info) => {
  console.log(`MotoCore API escuchando en http://localhost:${info.port}`);
});

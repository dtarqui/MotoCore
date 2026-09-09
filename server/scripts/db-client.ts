import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

/**
 * Carga `server/.env` para los scripts de mantenimiento de la base.
 *
 * Mismo patrón que `src/dev-server.ts`: solo se ejecuta aquí, en herramientas
 * locales — Vercel nunca corre estos scripts, y las variables que ya estén en
 * el entorno no se pisan.
 */
function cargarEnv(): void {
  const rutaEnv = fileURLToPath(new URL('../.env', import.meta.url));
  if (fs.existsSync(rutaEnv)) {
    process.loadEnvFile(rutaEnv);
  } else {
    console.warn(`Aviso: no existe ${rutaEnv}; las variables deben venir del entorno.`);
  }
}

/**
 * Conexión directa a Postgres para migraciones y comprobaciones de esquema.
 *
 * Deliberadamente NO usa `@supabase/supabase-js`: ese cliente habla con
 * PostgREST, que solo expone `select`/`insert`/`update`/`delete` sobre tablas
 * y RPCs ya creadas — no puede ejecutar DDL (`create table`, `create policy`,
 * etc.). Migrar el esquema exige una conexión SQL directa, que es justamente
 * lo que da `DATABASE_URL` (Project Settings → Database → Connection string).
 *
 * `rejectUnauthorized: false` es el ajuste que Supabase documenta para
 * clientes `pg`: la conexión sigue cifrada por TLS, pero no se valida la
 * cadena de certificados contra la CA del sistema.
 */
export function conectar(): Client {
  cargarEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('<') || databaseUrl.includes('>')) {
    throw new Error(
      'Falta DATABASE_URL (o conserva el marcador del .env.example). ' +
        'Está en Project Settings → Database → Connection string → URI, en el proyecto de Supabase.',
    );
  }

  return new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
}

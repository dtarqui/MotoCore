import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conectar } from './db-client.js';

/**
 * Aplica `supabase/migrations/*.sql` en orden, contra `DATABASE_URL`.
 *
 * Alternativa a pegar cada archivo a mano en el SQL Editor (el método que
 * documenta `server/README.md`): mismo resultado, ejecutado desde la terminal.
 * NUNCA toca `reset.sql` — ese archivo vive fuera de `migrations/` y es
 * destructivo a propósito; esta herramienta ni lo lista ni lo ejecuta.
 *
 * Cada archivo corre en su propia transacción. Las migraciones del proyecto
 * son idempotentes (`if not exists`, `or replace`, `drop ... if exists`), así
 * que repetir una ya aplicada no hace nada — corresponde con lo que exige
 * RNF-304: reconstruir el esquema desde las migraciones debe ser reproducible.
 * Si una fallara, el script se detiene ahí: las siguientes pueden depender de
 * lo que esa dejó a medias.
 */
async function principal() {
  const dirMigraciones = fileURLToPath(new URL('../supabase/migrations', import.meta.url));
  const archivos = fs
    .readdirSync(dirMigraciones)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (archivos.length === 0) {
    throw new Error(`No hay archivos .sql en ${dirMigraciones}`);
  }

  const cliente = conectar();
  await cliente.connect();

  const { rows } = await cliente.query<{ db: string; usuario: string }>(
    'select current_database() as db, current_user as usuario',
  );
  console.log(`Conectado a "${rows[0]!.db}" como "${rows[0]!.usuario}".`);
  console.log(`Aplicando ${archivos.length} migraciones desde ${path.basename(dirMigraciones)}/...\n`);

  try {
    for (const archivo of archivos) {
      const ruta = path.join(dirMigraciones, archivo);
      const sql = fs.readFileSync(ruta, 'utf8');

      process.stdout.write(`  ${archivo} ... `);
      try {
        await cliente.query('begin');
        await cliente.query(sql);
        await cliente.query('commit');
        console.log('OK');
      } catch (error) {
        await cliente.query('rollback');
        console.log('FALLÓ');
        throw error;
      }
    }
    console.log('\nTodas las migraciones se aplicaron correctamente.');
    console.log('Siguiente paso: npm run db:verify');
  } finally {
    await cliente.end();
  }
}

principal().catch((error: unknown) => {
  console.error('\nMigración detenida:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

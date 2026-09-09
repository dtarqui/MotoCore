import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { conectar } from './db-client.js';

/**
 * Corre `supabase/verify.sql` contra `DATABASE_URL` e imprime sus filas.
 *
 * Es de solo lectura: no modifica nada (lo declara el propio `verify.sql`).
 * Once filas deben decir "OK" tras aplicar `migrations/0001…0011`.
 */
async function principal() {
  const rutaVerify = fileURLToPath(new URL('../supabase/verify.sql', import.meta.url));
  const sql = fs.readFileSync(rutaVerify, 'utf8');

  const cliente = conectar();
  await cliente.connect();

  try {
    const { rows } = await cliente.query<{
      orden: number;
      comprobacion: string;
      esperado: string;
      obtenido: string;
      estado: string;
    }>(sql);

    const anchoComprobacion = Math.max(...rows.map((r) => r.comprobacion.length));
    let fallas = 0;

    for (const fila of rows) {
      const marca = fila.estado === 'OK' ? '✓' : '✗';
      if (fila.estado !== 'OK') fallas++;
      console.log(
        `${marca} ${fila.orden.toString().padStart(2)}. ${fila.comprobacion.padEnd(anchoComprobacion)}  ` +
          `esperado=${fila.esperado}  obtenido=${fila.obtenido}  [${fila.estado}]`,
      );
    }

    console.log(
      fallas === 0
        ? `\n${rows.length} comprobaciones, todas OK.`
        : `\n${fallas} de ${rows.length} comprobaciones necesitan atención (ver arriba).`,
    );
    process.exitCode = fallas === 0 ? 0 : 1;
  } finally {
    await cliente.end();
  }
}

principal().catch((error: unknown) => {
  console.error('Verificación fallida:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

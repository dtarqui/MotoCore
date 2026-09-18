import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * EJECUTA UN CICLO DE VALIDACIÓN DEL AISLAMIENTO Y CONSERVA SU EVIDENCIA
 * (Plan de pruebas, §6.5 y §6.6).
 *
 *     npm run evidencia -- --corrida 1
 *
 * Corre las cuatro condiciones en el orden que fija el plan —primero la línea
 * base, después las otras tres— y deja en `evidencia/corrida-N/` exactamente
 * los seis elementos que la tabla del §6.6 enumera: escenario, resultados por
 * condición, versión ejecutada, resumen y sumas de verificación.
 *
 * La evidencia **la produce este script**, no una transcripción a mano: las
 * pruebas anotan lo que observan (`test/support/evidencia.ts`) y aquí se
 * consolida.
 *
 * DOS REGLAS QUE EL PLAN IMPONE Y QUE EL SCRIPT RESPETA:
 *
 *  1. **Una corrida se conserva completa aunque falle.** Descartarla sesgaría
 *     el resultado, así que un fallo no interrumpe la recolección: se registra
 *     y se sigue.
 *  2. **C0 solo existe en el proyecto desechable.** La línea base se salta a
 *     menos que `MOTOCORE_BASELINE_URL` nombre el mismo proyecto que
 *     `SUPABASE_URL`, y tras ejecutarla hay que reconstruir el esquema desde
 *     las migraciones antes de C1, C2 y C3 — el script lo recuerda y lo hace.
 */

const raiz = fileURLToPath(new URL('../', import.meta.url));
const repo = path.resolve(raiz, '..');

interface Condicion {
  id: 'C0' | 'C1' | 'C2' | 'C3';
  nombre: string;
  archivo: string;
}

/** Las cuatro condiciones, con el montaje que produce cada una (§6.6). */
const CONDICIONES: Condicion[] = [
  { id: 'C0', nombre: 'Línea base: sin políticas y sin verificación', archivo: 'test/baseline.test.ts' },
  { id: 'C1', nombre: 'Arquitectura completa, por la interfaz', archivo: 'test/integration.test.ts' },
  { id: 'C2', nombre: 'Sin la verificación de la capa de aplicación', archivo: 'test/defense-in-depth.test.ts' },
  { id: 'C3', nombre: 'Acceso directo al motor', archivo: 'test/rls.test.ts' },
];

function argumento(nombre: string, porDefecto: string): string {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? (process.argv[i + 1] ?? porDefecto) : porDefecto;
}

function comando(cmd: string, args: string[], env: NodeJS.ProcessEnv = {}): { ok: boolean; salida: string } {
  // La orden va como una sola cadena: los argumentos son literales de este
  // archivo, nunca entrada externa.
  const resultado = spawnSync([cmd, ...args].join(' '), {
    cwd: raiz,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    shell: true,
  });
  return { ok: resultado.status === 0, salida: `${resultado.stdout ?? ''}${resultado.stderr ?? ''}` };
}

function leerJsonl<T>(archivo: string): T[] {
  if (!fs.existsSync(archivo)) return [];
  return fs
    .readFileSync(archivo, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((linea) => JSON.parse(linea) as T);
}

interface Medida {
  condicion: string;
  via: string;
  objetivo: string;
  filas_ajenas: number;
}

function ultimaMigracion(): string {
  const migraciones = fs.readdirSync(path.join(raiz, 'supabase/migrations')).filter((f) => f.endsWith('.sql'));
  return migraciones.sort().at(-1) ?? '(ninguna)';
}

function resumen(
  medidas: Medida[],
  ejecutadas: Array<{ condicion: Condicion; ok: boolean; omitida: boolean }>,
  inicio: Date,
): string {
  const lineas: string[] = [
    '# Resumen de la corrida',
    '',
    `Inicio: ${inicio.toISOString()}  ·  Fin: ${new Date().toISOString()}`,
    '',
    '## Condiciones ejecutadas',
    '',
    '| Condición | Montaje | Resultado |',
    '|---|---|---|',
  ];
  for (const { condicion, ok, omitida } of ejecutadas) {
    const estado = omitida ? 'omitida — no se ejecutó, no cubre su requisito' : ok ? 'en verde' : 'con fallos';
    lineas.push(`| ${condicion.id} | ${condicion.nombre} | ${estado} |`);
  }

  lineas.push('', '## Filas ajenas por condición', '');
  if (medidas.length === 0) {
    lineas.push('No se registró ninguna medición: ninguna condición llegó a consultar.');
  } else {
    lineas.push('| Condición | Vía | Tabla u operación | Filas ajenas |', '|---|---|---|---|');
    for (const m of medidas) {
      lineas.push(`| ${m.condicion} | ${m.via} | \`${m.objetivo}\` | ${m.filas_ajenas} |`);
    }

    lineas.push('', '## Lectura del resultado', '');
    for (const id of ['C0', 'C1', 'C2', 'C3']) {
      const delGrupo = medidas.filter((m) => m.condicion === id);
      if (delGrupo.length === 0) continue;
      const total = delGrupo.reduce((suma, m) => suma + m.filas_ajenas, 0);
      const esperado =
        id === 'C0' ? 'debe ser mayor que cero: la línea base tiene que mostrar la fuga' : 'debe ser cero';
      const cumple = id === 'C0' ? total > 0 : total === 0;
      lineas.push(
        `- **${id}**: ${total} filas ajenas en ${delGrupo.length} consultas — ${esperado}. ${cumple ? 'Cumple.' : '**NO cumple.**'}`,
      );
    }
  }

  lineas.push(
    '',
    '> Una corrida se conserva completa aunque falle: descartarla sesgaría el resultado.',
    '> Un caso omitido **no** cubre su requisito (Plan de pruebas, §7.2).',
    '',
  );
  return lineas.join('\n');
}

function sumasSha256(directorio: string): string {
  return fs
    .readdirSync(directorio)
    .filter((f) => f !== 'sha256.txt')
    .sort()
    .map((f) => {
      const hash = crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(directorio, f)))
        .digest('hex');
      return `${hash}  ${f}`;
    })
    .join('\n');
}

async function principal(): Promise<void> {
  const corrida = argumento('corrida', '1');
  const destino = path.join(repo, 'evidencia', `corrida-${corrida}`);
  fs.mkdirSync(destino, { recursive: true });
  for (const previo of fs.readdirSync(destino)) fs.rmSync(path.join(destino, previo));

  const inicio = new Date();
  const baseline =
    Boolean(process.env.MOTOCORE_BASELINE_URL) && process.env.MOTOCORE_BASELINE_URL === process.env.SUPABASE_URL;

  console.log(`Corrida ${corrida} → ${destino}`);
  console.log(
    baseline
      ? 'Línea base HABILITADA sobre el proyecto desechable.'
      : 'Línea base omitida: falta MOTOCORE_BASELINE_URL.',
  );

  const ejecutadas: Array<{ condicion: Condicion; ok: boolean; omitida: boolean }> = [];

  for (const condicion of CONDICIONES) {
    const omitida = condicion.id === 'C0' && !baseline;
    if (omitida) {
      ejecutadas.push({ condicion, ok: false, omitida });
      continue;
    }

    console.log(`\n· ${condicion.id} — ${condicion.nombre}`);
    const salidaJson = path.join(destino, `resultados-${condicion.id.toLowerCase()}.json`);
    const { ok, salida } = comando(
      'npx',
      ['vitest', 'run', condicion.archivo, '--reporter=json', `--outputFile=${salidaJson}`],
      { MOTOCORE_EVIDENCIA_DIR: destino },
    );
    ejecutadas.push({ condicion, ok, omitida: false });
    console.log(ok ? '  en verde' : `  con fallos\n${salida.slice(-2000)}`);

    // Tras la línea base, el esquema se reconstruye desde las migraciones antes
    // de medir las demás condiciones (§6.1).
    if (condicion.id === 'C0') {
      console.log('· Reconstruyendo el esquema desde las migraciones tras C0');
      const migracion = comando('npx', ['tsx', 'scripts/run-migrations.ts']);
      if (!migracion.ok) console.log(`  la reconstrucción falló\n${migracion.salida.slice(-1000)}`);
    }
  }

  const medidas = leerJsonl<Medida>(path.join(destino, 'medidas.jsonl'));
  const escenario = leerJsonl<Record<string, unknown>>(path.join(destino, 'escenario.jsonl'));

  fs.writeFileSync(path.join(destino, 'escenario.json'), `${JSON.stringify(escenario, null, 2)}\n`, 'utf8');
  fs.rmSync(path.join(destino, 'escenario.jsonl'), { force: true });

  const commit = comando('git', ['rev-parse', 'HEAD']).salida.trim();
  fs.writeFileSync(
    path.join(destino, 'version.txt'),
    [
      `commit: ${commit}`,
      `ultima_migracion: ${ultimaMigracion()}`,
      `node: ${process.version}`,
      `fecha: ${inicio.toISOString()}`,
      '',
    ].join('\n'),
    'utf8',
  );

  fs.writeFileSync(path.join(destino, 'resumen.md'), resumen(medidas, ejecutadas, inicio), 'utf8');
  fs.rmSync(path.join(destino, 'medidas.jsonl'), { force: true });
  fs.writeFileSync(path.join(destino, 'sha256.txt'), `${sumasSha256(destino)}\n`, 'utf8');

  console.log(`\nEvidencia conservada en ${destino}`);
  console.log(fs.readdirSync(destino).join('  '));
}

principal().catch((error: unknown) => {
  console.error('La corrida no pudo completarse:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

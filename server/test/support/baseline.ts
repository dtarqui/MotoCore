import { Client } from 'pg';

/**
 * CONDICIÓN C0 — LÍNEA BASE (Plan de pruebas, §6.1).
 *
 * Reproduce el aislamiento resuelto **solo en la capa de aplicación, cuando su
 * filtro falla**: se deshabilitan las políticas del motor en las siete tablas
 * de negocio y se omite la verificación de membresía. Debe **mostrar la fuga**
 * que las otras condiciones impiden; si no la muestra, la línea base no
 * discrimina y el resultado de la validación no es concluyente.
 *
 * DÓNDE PUEDE EXISTIR. Solo en el proyecto de validación desechable. Nunca en
 * *staging* ni en producción, y por eso no basta con una variable de entorno:
 * hay que **nombrar el proyecto** en `MOTOCORE_BASELINE_URL` y que coincida
 * exactamente con `SUPABASE_URL`. Un despiste de configuración no alcanza para
 * dejar una base sin políticas.
 *
 * Tras la corrida, `restaurarPoliticas` las vuelve a habilitar; además, el
 * plan exige reconstruir el esquema desde las migraciones antes de ejecutar
 * C1, C2 y C3.
 */
export const TABLAS_DE_NEGOCIO = [
  'mt_workshops',
  'mt_memberships',
  'mt_workshop_assignments',
  'mt_clients',
  'mt_parts',
  'mt_part_movements',
  'mt_audit_log',
] as const;

/** La condición C0 solo se ejecuta si el proyecto desechable se nombra explícitamente. */
export const baselineHabilitada =
  Boolean(process.env.MOTOCORE_BASELINE_URL) &&
  process.env.MOTOCORE_BASELINE_URL === process.env.SUPABASE_URL &&
  Boolean(process.env.DATABASE_URL);

async function conectar(): Promise<Client> {
  if (!baselineHabilitada) {
    throw new Error('La condición C0 exige MOTOCORE_BASELINE_URL igual a SUPABASE_URL y DATABASE_URL.');
  }
  const cliente = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await cliente.connect();
  return cliente;
}

async function cambiarPoliticas(accion: 'disable' | 'enable'): Promise<void> {
  const cliente = await conectar();
  try {
    for (const tabla of TABLAS_DE_NEGOCIO) {
      await cliente.query(`alter table public.${tabla} ${accion} row level security`);
    }
  } finally {
    await cliente.end();
  }
}

export const deshabilitarPoliticas = () => cambiarPoliticas('disable');
export const restaurarPoliticas = () => cambiarPoliticas('enable');

/** Comprueba, sin suposiciones, en qué estado quedaron las políticas. */
export async function politicasActivas(): Promise<Record<string, boolean>> {
  const cliente = await conectar();
  try {
    const { rows } = await cliente.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = any($1)`,
      [[...TABLAS_DE_NEGOCIO]],
    );
    return Object.fromEntries(rows.map((r) => [r.relname, r.relrowsecurity]));
  } finally {
    await cliente.end();
  }
}

import fs from 'node:fs';
import path from 'node:path';

/**
 * Evidencia de la validación del aislamiento (Plan de pruebas, §6.6).
 *
 * «La evidencia se define antes de generarla, y la produce el propio script de
 * ejecución, nunca una transcripción manual.» Estas funciones son el puente:
 * las pruebas anotan lo que observan —qué escenario montaron y cuántas filas
 * ajenas obtuvo cada consulta— y `scripts/evidencia.ts` lo consolida en
 * `evidencia/corrida-N/`.
 *
 * Fuera de una corrida de evidencia **no hacen nada**: sin
 * `MOTOCORE_EVIDENCIA_DIR`, las pruebas corren igual y no escriben archivos.
 */
const destino = process.env.MOTOCORE_EVIDENCIA_DIR;

function anexar(archivo: string, linea: unknown): void {
  if (!destino) return;
  fs.mkdirSync(destino, { recursive: true });
  fs.appendFileSync(path.join(destino, archivo), `${JSON.stringify(linea)}\n`, 'utf8');
}

/** Cuenta, organización o taller creados por el escenario, con su identificador y la hora. */
export interface AnotacionEscenario {
  cuenta: string;
  user_id: string;
  organization_id: string;
  workshop_id: string | null;
}

export function anotarEscenario(entrada: AnotacionEscenario): void {
  anexar('escenario.jsonl', { ...entrada, at: new Date().toISOString() });
}

/**
 * Una medición del indicador de la variable dependiente: **filas ajenas
 * obtenidas** por una consulta, bajo una condición y sobre una tabla u
 * operación. Cero es el resultado esperado en C1, C2 y C3; en C0 debe ser
 * mayor que cero, o la línea base no discrimina.
 */
export interface Medida {
  condicion: 'C0' | 'C1' | 'C2' | 'C3';
  via: 'interfaz' | 'base de datos';
  objetivo: string;
  filas_ajenas: number;
}

export function anotarMedida(medida: Medida): void {
  anexar('medidas.jsonl', { ...medida, at: new Date().toISOString() });
}

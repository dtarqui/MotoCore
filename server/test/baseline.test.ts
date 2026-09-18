import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import {
  baselineHabilitada,
  deshabilitarPoliticas,
  politicasActivas,
  restaurarPoliticas,
  TABLAS_DE_NEGOCIO,
} from './support/baseline.js';
import { anotarMedida } from './support/evidencia.js';
import { type Account, clientAs, hasEnv, registerAccount, request, unique } from './support/scenario.js';

/**
 * CP-LB1 y CP-LB2 — CONDICIÓN C0, LA LÍNEA BASE (Plan de pruebas, §5.7 y §6.1).
 *
 * Es el único caso del proyecto que **debe fallar en aislar**: reproduce lo que
 * hace hoy la oferta relevada —la separación resuelta solo en la capa de
 * aplicación— y la ejecuta con esa capa omitida. Si no mostrara la fuga, la
 * comparación no discriminaría y el resultado de la validación se declararía no
 * concluyente.
 *
 * Se ejecuta **solo en el proyecto de validación desechable**, nombrándolo en
 * `MOTOCORE_BASELINE_URL`; después hay que reconstruir el esquema desde las
 * migraciones antes de correr C1, C2 y C3.
 *
 * Las dos vías del §6:
 *   · CP-LB1 — acceso directo al motor, sin políticas.
 *   · CP-LB2 — por la interfaz, con la verificación de membresía sustituida.
 */
describe.skipIf(!hasEnv || !baselineHabilitada)('N4 — C0: la línea base muestra la fuga', () => {
  /** Con la verificación de membresía omitida: el «filtro de la aplicación que falla». */
  const sinControl = createApp({ findMembership: async () => ({ role: 'owner', is_active: true }) });

  let A: Account;
  let B: Account;

  beforeAll(async () => {
    // El escenario se monta ANTES de deshabilitar las políticas: se quiere medir
    // la fuga, no un montaje que las políticas hubieran impedido.
    A = await registerAccount(sinControl, 'lb_a', `Organizacion A ${unique()}`);
    B = await registerAccount(sinControl, 'lb_b', `Organizacion B ${unique()}`);
    const ctxA = { token: A.token, org: A.orgId, workshop: A.workshopId };

    await request(sinControl, '/api/clients', {
      ...ctxA,
      method: 'POST',
      body: { first_name: 'Cliente', last_name: `Reservado ${unique()}` },
    });
    await request(sinControl, '/api/inventory/parts', {
      ...ctxA,
      method: 'POST',
      body: { part_number: `LB-${unique()}`, name: 'Reservado', initial_stock: 4 },
    });
    await request(sinControl, '/api/members/invite', {
      ...ctxA,
      method: 'POST',
      body: { email: B.email, role: 'mechanic' },
    });
    await request(sinControl, `/api/workshops/${A.workshopId}/assignments`, {
      ...ctxA,
      method: 'POST',
      body: { user_id: B.userId },
    });
    // Deja una entrada de auditoría y devuelve a B a su sitio: sin membresía en A.
    await request(sinControl, `/api/members/${B.userId}`, { ...ctxA, method: 'DELETE' });

    await deshabilitarPoliticas();
    expect(Object.values(await politicasActivas()).every((activa) => !activa)).toBe(true);
  });

  afterAll(async () => {
    // Que una prueba falle no puede dejar la base sin políticas.
    await restaurarPoliticas();
  });

  it('CP-LB1 — sin políticas, la consulta directa con identidad ajena devuelve filas ajenas en las 7 tablas', async () => {
    const asB = clientAs(B.token);
    const recuento: Record<string, number> = {};

    for (const tabla of TABLAS_DE_NEGOCIO) {
      const { data, error } = await asB.from(tabla).select('id').eq('organization_id', A.orgId);
      expect(error, tabla).toBeNull();
      recuento[tabla] = (data ?? []).length;
      anotarMedida({ condicion: 'C0', via: 'base de datos', objetivo: tabla, filas_ajenas: recuento[tabla]! });
    }

    // La fuga tiene que aparecer en TODAS: una tabla en cero aquí significaría
    // que el escenario no dejó dato, no que el aislamiento funcionó.
    for (const tabla of TABLAS_DE_NEGOCIO) {
      expect(recuento[tabla], `${tabla} no muestra la fuga esperada`).toBeGreaterThan(0);
    }
  });

  it('CP-LB2 — sin políticas y sin verificación, la interfaz entrega datos de la organización ajena', async () => {
    const intruso = { token: B.token, org: A.orgId, workshop: A.workshopId };
    const operaciones: Array<[string, string, string?]> = [
      ['/api/clients', 'clients'],
      ['/api/workshops', 'workshops'],
      ['/api/members', 'members'],
      ['/api/audit', 'entries'],
      ['/api/inventory/parts', 'parts', A.workshopId],
    ];

    for (const [ruta, clave, taller] of operaciones) {
      const reply = await request<Record<string, unknown[]>>(sinControl, ruta, {
        ...intruso,
        workshop: taller ?? intruso.workshop,
      });
      expect(reply.status, ruta).toBe(200);
      const filas = (reply.body[clave] ?? []).length;
      anotarMedida({ condicion: 'C0', via: 'interfaz', objetivo: ruta, filas_ajenas: filas });
      expect(filas, `${ruta} no muestra la fuga esperada`).toBeGreaterThan(0);
    }
  });

  it('las políticas quedan restauradas al terminar', async () => {
    await restaurarPoliticas();
    expect(Object.values(await politicasActivas()).every(Boolean)).toBe(true);
  });
});

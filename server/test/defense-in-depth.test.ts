import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { anotarMedida } from './support/evidencia.js';
import { type Account, hasEnv, registerAccount, request, unique } from './support/scenario.js';

/**
 * CP-N102 — CONDICIÓN C2: LA PRUEBA QUE SOSTIENE LA INMUTABILIDAD (RNF-102,
 * Plan de pruebas §6.4).
 *
 * RNF-102 no pide demostrar que las dos capas existen, sino que son
 * **independientes**: que si la de la aplicación falla, la del motor sostiene.
 *
 * CÓMO SE ANULA LA CAPA DE APLICACIÓN. No existe —ni debe existir— un
 * interruptor en el código de producción que apague la verificación de
 * membresía: sería una vía de escalada esperando a que alguien la active por
 * error. Se anula aquí, en el banco de pruebas, construyendo la aplicación con
 * una verificación que **concede sin comprobar** (`findMembership`). El resto
 * del sistema —credencial real, cliente de datos real, políticas reales— queda
 * intacto.
 *
 * QUÉ DEBE OCURRIR. La petición atraviesa la capa de aplicación como si el
 * intruso fuera propietario, llega a la consulta… y no obtiene nada, porque el
 * cliente de datos está atado a SU credencial y las políticas se evalúan sobre
 * su identidad real.
 */
describe.skipIf(!hasEnv)('N4 — CP-N102: el aislamiento se sostiene sin la capa de aplicación (condición C2)', () => {
  /** Arquitectura completa, para montar el escenario y como control positivo. */
  const app = createApp();
  /** Capa de aplicación anulada: toda cuenta es propietaria activa de cualquier organización. */
  const breached = createApp({ findMembership: async () => ({ role: 'owner', is_active: true }) });

  let A: Account;
  let B: Account;
  let clientId = '';
  let partId = '';

  const intruder = (workshop?: string) => ({ token: B.token, org: A.orgId, workshop });

  beforeAll(async () => {
    A = await registerAccount(app, 'dd_a', `Organizacion A ${unique()}`);
    B = await registerAccount(app, 'dd_b', `Organizacion B ${unique()}`);
    const ctxA = { token: A.token, org: A.orgId, workshop: A.workshopId };

    const client = await request<{ client: { id: string } }>(app, '/api/clients', {
      ...ctxA,
      method: 'POST',
      body: { first_name: 'Cliente', last_name: `Reservado ${unique()}` },
    });
    clientId = client.body.client.id;

    const part = await request<{ part: { id: string } }>(app, '/api/inventory/parts', {
      ...ctxA,
      method: 'POST',
      body: { part_number: `P-${unique()}`, name: 'Reservado', initial_stock: 5 },
    });
    partId = part.body.part.id;

    await request(app, '/api/organizations/' + A.orgId, {
      token: A.token,
      method: 'PATCH',
      body: { description: 'Con auditoría' },
    });
  });

  it('control del montaje — la capa de aplicación está efectivamente anulada', async () => {
    // Con la arquitectura completa, B recibe 403. Con la capa anulada, pasa: si
    // no pasara, el resto de los casos no probaría nada.
    expect((await request(app, '/api/clients', intruder())).status).toBe(403);
    expect((await request(breached, '/api/clients', intruder())).status).toBe(200);
  });

  it('B no LEE los datos de A en ninguna colección, aunque la aplicación lo deje pasar', async () => {
    const collections: Array<[string, string, string?]> = [
      ['/api/clients?includeInactive=true', 'clients'],
      ['/api/workshops?includeInactive=true', 'workshops'],
      ['/api/members?includeInactive=true', 'members'],
      ['/api/audit', 'entries'],
      ['/api/inventory/parts?includeInactive=true', 'parts', A.workshopId],
    ];
    for (const [path, key, workshop] of collections) {
      const reply = await request<Record<string, unknown[]>>(breached, path, intruder(workshop));
      expect(reply.status, path).toBe(200);
      // Cero filas ajenas: el indicador de la variable dependiente.
      anotarMedida({ condicion: 'C2', via: 'interfaz', objetivo: path, filas_ajenas: (reply.body[key] ?? []).length });
      expect(reply.body[key], path).toEqual([]);
    }
  });

  it('B no accede a un recurso de A referenciándolo por identificador', async () => {
    expect((await request(breached, `/api/clients/${clientId}`, intruder())).status).toBe(404);
    expect((await request(breached, `/api/workshops/${A.workshopId}`, intruder())).status).toBe(404);
    expect((await request(breached, `/api/inventory/parts/${partId}`, intruder(A.workshopId))).status).toBe(404);
    expect((await request(breached, `/api/inventory/parts/${partId}/movements`, intruder(A.workshopId))).status).toBe(
      404,
    );
    expect((await request(breached, `/api/organizations/${A.orgId}`, { token: B.token })).status).toBe(404);
  });

  it('B tampoco ESCRIBE en la organización de A', async () => {
    const attempts: Array<[string, string, unknown, string?]> = [
      ['POST', '/api/clients', { first_name: 'Intruso', last_name: 'Inyectado' }],
      ['PATCH', `/api/clients/${clientId}`, { first_name: 'Alterado' }],
      ['POST', `/api/clients/${clientId}/deactivate`, undefined],
      ['POST', '/api/workshops', { name: `Intruso ${unique()}` }],
      ['PATCH', `/api/organizations/${A.orgId}`, { name: 'Tomada' }],
      ['POST', '/api/inventory/parts', { part_number: `IN-${unique()}`, name: 'Intruso' }, A.workshopId],
      ['POST', `/api/inventory/parts/${partId}/movements`, { movement_type: 'venta', quantity: 5 }, A.workshopId],
    ];
    for (const [method, path, body, workshop] of attempts) {
      const reply = await request(breached, path, {
        ...(path.startsWith('/api/organizations') ? { token: B.token } : intruder(workshop)),
        method,
        body,
      });
      // Lo que importa no es con qué código se rechaza —la aplicación ya no está
      // ahí para traducirlo—, sino que no se aplicó.
      expect([200, 201, 204], `${method} ${path}`).not.toContain(reply.status);
    }

    // Comprobado con la arquitectura completa y la identidad de A: nada cambió.
    const ctxA = { token: A.token, org: A.orgId };
    const clients = await request<{ clients: Array<{ id: string; first_name: string; is_active: boolean }> }>(
      app,
      '/api/clients?includeInactive=true',
      ctxA,
    );
    expect(clients.body.clients).toEqual([
      expect.objectContaining({ id: clientId, first_name: 'Cliente', is_active: true }),
    ]);

    const workshops = await request<{ workshops: unknown[] }>(app, '/api/workshops?includeInactive=true', ctxA);
    expect(workshops.body.workshops).toHaveLength(1);

    const organization = await request<{ organization: { name: string } }>(app, `/api/organizations/${A.orgId}`, {
      token: A.token,
    });
    expect(organization.body.organization.name).not.toBe('Tomada');

    const part = await request<{ part: { current_stock: number } }>(app, `/api/inventory/parts/${partId}`, {
      ...ctxA,
      workshop: A.workshopId,
    });
    expect(part.body.part.current_stock).toBe(5);
  });

  it('control negativo — A sigue viendo sus datos por la misma aplicación anulada', async () => {
    // Si también devolviera vacío, los casos anteriores no probarían aislamiento
    // sino que las políticas bloquean a todo el mundo.
    const reply = await request<{ clients: Array<{ id: string }> }>(breached, '/api/clients', {
      token: A.token,
      org: A.orgId,
    });
    expect(reply.body.clients.map((c) => c.id)).toEqual([clientId]);
  });
});

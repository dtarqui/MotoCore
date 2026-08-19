import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * CP-N102 — LA PRUEBA QUE JUSTIFICA LA REDUNDANCIA (RNF-102, ADR-002).
 *
 * RNF-102 no pide demostrar que las dos capas existen, sino que son
 * **independientes**: que si una falla, la otra sostiene. Es la condicion C2
 * del diseno experimental (anteproyecto §15.2) y la segunda clausula de la
 * hipotesis H1 — «sostuvo esa separacion aun con la verificacion de la capa de
 * aplicacion deshabilitada».
 *
 * COMO SE DESHABILITA. No existe —ni debe existir— un interruptor en el codigo
 * de produccion que apague la comprobacion de membresia: seria una via de
 * escalada esperando a que alguien la active por error. La capa se anula aqui,
 * en el banco de pruebas, sustituyendo `requireMembership` y `requireOwner` por
 * versiones que conceden acceso sin comprobar nada. El resto del sistema queda
 * intacto.
 *
 * QUE DEBE OCURRIR ENTONCES. La peticion atraviesa la capa de aplicacion como
 * si el solicitante fuera miembro, llega a la consulta... y no devuelve nada,
 * porque el cliente de datos esta atado a SU credencial y las politicas del
 * motor se evaluan sobre su identidad real. RLS filtra lo que la aplicacion
 * dejo pasar.
 *
 * Sin este caso, la defensa en profundidad de ADR-002 seria una afirmacion de
 * diseno; con el, es un hecho verificado.
 */

// El mock se eleva por encima de los imports: `org-context.ts` recibe estas
// versiones en lugar de las reales.
vi.mock('../src/lib/memberships.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/lib/memberships.js')>();
  return {
    ...real,
    /** Capa de aplicacion deshabilitada: concede sin comprobar. */
    requireMembership: async () => 'owner',
    requireOwner: async () => undefined,
  };
});

const { createApp } = await import('../src/app.js');

const hasEnv = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const rnd = () => Math.random().toString(36).slice(2, 10);

describe.skipIf(!hasEnv)('CP-N102 — el aislamiento se sostiene sin la capa de aplicacion', () => {
  const app = createApp();
  let anon: SupabaseClient;

  const cuentaA = { email: `dd_a_${rnd()}@motocore.test`, password: 'supersecret1' };
  const cuentaB = { email: `dd_b_${rnd()}@motocore.test`, password: 'supersecret1' };
  let orgAId = '';
  let clienteAId = '';
  let tokenA = '';
  let tokenB = '';

  const ctx = (token: string, orgId?: string): Record<string, string> => {
    const h: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (orgId) h['X-Org-Id'] = orgId;
    return h;
  };

  beforeAll(async () => {
    anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const registrar = (cuenta: { email: string; password: string }, organizationName: string) =>
      app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cuenta,
          firstName: 'Defensa',
          lastName: 'Profunda',
          organizationName,
        }),
      });

    const resA = await registrar(cuentaA, `Organizacion A ${rnd()}`);
    expect(resA.status).toBe(201);
    orgAId = ((await resA.json()) as { organization: { id: string } }).organization.id;

    expect((await registrar(cuentaB, `Organizacion B ${rnd()}`)).status).toBe(201);

    const iniciar = async (cuenta: { email: string; password: string }) => {
      const { data, error } = await anon.auth.signInWithPassword(cuenta);
      if (error) throw error;
      return data.session!.access_token;
    };
    tokenA = await iniciar(cuentaA);
    tokenB = await iniciar(cuentaB);

    // A deja un dato reservado en su organizacion.
    const cliente = await app.request('/api/clients', {
      method: 'POST',
      headers: ctx(tokenA, orgAId),
      body: JSON.stringify({ firstName: 'Cliente', lastName: `Reservado${rnd()}` }),
    });
    expect(cliente.status).toBe(201);
    clienteAId = ((await cliente.json()) as { client: { id: string } }).client.id;
  });

  it('la capa de aplicacion esta efectivamente deshabilitada en este archivo', async () => {
    // Control del montaje: sin el mock, esta peticion responderia
    // `403 organization.access_denied` y el resto de los casos no probarian
    // nada. Que devuelva 200 es lo que confirma que la capa fue anulada.
    const res = await app.request('/api/clients', { headers: ctx(tokenB, orgAId) });
    expect(res.status).toBe(200);
  });

  it('B no LEE los clientes de A aunque la aplicacion le deje pasar', async () => {
    const res = await app.request('/api/clients', { headers: ctx(tokenB, orgAId) });
    expect(res.status).toBe(200);

    // Cero filas ajenas: es el indicador de la variable dependiente (§12.1).
    const body = (await res.json()) as { clients: Array<{ id: string }> };
    expect(body.clients).toEqual([]);
  });

  it('B no accede al cliente de A ni referenciandolo por identificador', async () => {
    const res = await app.request(`/api/clients/${clienteAId}`, { headers: ctx(tokenB, orgAId) });
    // Las politicas filtran la fila, de modo que el handler no la encuentra.
    expect(res.status).toBe(404);
  });

  it('B tampoco ESCRIBE en la organizacion de A', async () => {
    const res = await app.request('/api/clients', {
      method: 'POST',
      headers: ctx(tokenB, orgAId),
      body: JSON.stringify({ firstName: 'Intruso', lastName: 'Inyectado' }),
    });
    // El aislamiento no es solo de lectura: la politica de insercion exige
    // membresia activa. Lo que importa no es el codigo exacto con que se
    // rechaza —la aplicacion ya no esta ahi para traducirlo—, sino que NO se
    // haya creado.
    expect(res.status).not.toBe(201);

    const listaDeA = await app.request('/api/clients', { headers: ctx(tokenA, orgAId) });
    const body = (await listaDeA.json()) as { clients: Array<{ last_name: string }> };
    expect(body.clients.some((x) => x.last_name === 'Inyectado')).toBe(false);
  });

  it('el registro de auditoria de A sigue fuera del alcance de B', async () => {
    const res = await app.request('/api/audit', { headers: ctx(tokenB, orgAId) });
    // `audit_log_select_owner` (migracion 0007) exige el rol en el motor, no
    // solo en el handler que el mock acaba de anular.
    const body = res.status === 200 ? ((await res.json()) as { audit: unknown[] }) : { audit: [] };
    expect(body.audit).toEqual([]);
  });

  it('A sigue viendo sus propios datos: el control es negativo, no un bloqueo total', async () => {
    // Si esta consulta tambien devolviera vacio, los casos anteriores no
    // probarian aislamiento sino que RLS bloquea a todo el mundo.
    const res = await app.request('/api/clients', { headers: ctx(tokenA, orgAId) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { clients: Array<{ id: string }> };
    expect(body.clients.some((x) => x.id === clienteAId)).toBe(true);
  });
});

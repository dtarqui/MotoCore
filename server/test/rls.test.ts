import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';

/**
 * PRUEBA DE AISLAMIENTO POR ACCESO DIRECTO A LA BASE DE DATOS — RF-702.
 *
 * Es el entregable del objetivo especifico 8, y la unica prueba que demuestra
 * la premisa central del proyecto: que el aislamiento entre empresas se
 * sostiene AUNQUE la capa de aplicacion omita sus controles.
 *
 * La diferencia con integration.test.ts es deliberada y esencial: alli las
 * peticiones pasan por la API, que verifica la membresia antes de consultar.
 * Aqui se PRESCINDE de la API. Se usa un cliente de Supabase autenticado con
 * el token del usuario B y se consultan directamente las tablas de la empresa
 * de A. Si las politicas RLS fallaran, estas consultas devolverian datos — y
 * ninguna verificacion de la aplicacion estaria ahi para impedirlo.
 *
 * Lo que se espera de una politica correcta: la consulta NO falla con error de
 * permisos, simplemente devuelve CERO filas. RLS filtra, no rechaza.
 *
 * IMPORTANTE: nunca debe usarse `serviceClient()` en este archivo. La clave de
 * servicio salta RLS por diseño, asi que la prueba pasaria siempre y no
 * demostraria nada.
 *
 * Requiere un Supabase real con las migraciones 0001..0006 aplicadas.
 */
const hasEnv = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const rnd = () => Math.random().toString(36).slice(2, 10);

describe.skipIf(!hasEnv)('aislamiento a nivel de base de datos (RLS sin pasar por la API)', () => {
  const app = createApp();

  const userA = { email: `rls_a_${rnd()}@motocore.test`, password: 'supersecret1' };
  const userB = { email: `rls_b_${rnd()}@motocore.test`, password: 'supersecret1' };

  let orgAId = '';
  let workshopAId = '';
  let clientAId = '';
  let partAId = '';

  /** Cliente de Supabase con la identidad del usuario B — el atacante. */
  let dbAsB: SupabaseClient;

  async function register(email: string, password: string, organizationName: string) {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName: 'RLS', lastName: 'Test', organizationName }),
    });
    expect(res.status).toBe(201);
    return (await res.json()) as { organization: { id: string }; workshop: { id: string } };
  }

  beforeAll(async () => {
    const url = process.env.SUPABASE_URL!;
    const anonKey = process.env.SUPABASE_ANON_KEY!;
    const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const provisioned = await register(userA.email, userA.password, `Empresa A ${rnd()}`);
    orgAId = provisioned.organization.id;
    workshopAId = provisioned.workshop.id;

    await register(userB.email, userB.password, `Empresa B ${rnd()}`);

    // La empresa A crea datos en los dos niveles de la jerarquia.
    const sessionA = await anon.auth.signInWithPassword(userA);
    if (sessionA.error) throw sessionA.error;
    const tokenA = sessionA.data.session!.access_token;

    const headersA = {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json',
      'X-Org-Id': orgAId,
      'X-Workshop-Id': workshopAId,
    };

    const clientRes = await app.request('/api/clients', {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ firstName: 'Cliente', lastName: 'Reservado' }),
    });
    expect(clientRes.status).toBe(201);
    clientAId = ((await clientRes.json()) as { client: { id: string } }).client.id;

    const partRes = await app.request('/api/inventory/parts', {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ partNumber: `P-${rnd()}`, name: 'Filtro reservado', initialStock: 10 }),
    });
    expect(partRes.status).toBe(201);
    partAId = ((await partRes.json()) as { part: { id: string } }).part.id;

    // A partir de aqui, todo ocurre con la identidad de B y SIN la API.
    const sessionB = await createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }).auth.signInWithPassword(userB);
    if (sessionB.error) throw sessionB.error;

    dbAsB = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${sessionB.data.session!.access_token}` } },
    });
  });

  it('B no puede leer la empresa de A', async () => {
    const { data, error } = await dbAsB.from('organizations').select('id, name').eq('id', orgAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('B no puede leer las sucursales de A', async () => {
    const { data, error } = await dbAsB.from('workshops').select('id, name').eq('organization_id', orgAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('B no puede leer las membresias de A', async () => {
    const { data, error } = await dbAsB.from('memberships').select('user_id, role').eq('organization_id', orgAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('B no puede leer los clientes de A (nivel empresa)', async () => {
    const { data, error } = await dbAsB.from('clients').select('id, first_name').eq('organization_id', orgAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);

    // Tampoco apuntando al identificador exacto, que es el caso realista:
    // el atacante ya conoce el id porque lo vio en otro contexto.
    const direct = await dbAsB.from('clients').select('id').eq('id', clientAId);
    expect(direct.error).toBeNull();
    expect(direct.data).toEqual([]);
  });

  it('B no puede leer el inventario de A (nivel sucursal)', async () => {
    const { data, error } = await dbAsB.from('parts').select('id, part_number').eq('id', partAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('B no puede leer los movimientos de existencias de A', async () => {
    const { data, error } = await dbAsB.from('part_movements').select('id').eq('part_id', partAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('B no puede ESCRIBIR en la empresa de A', async () => {
    // El aislamiento no es solo de lectura: la politica de insert exige
    // membresia activa, asi que la escritura debe ser rechazada.
    const { error } = await dbAsB
      .from('clients')
      .insert({ organization_id: orgAId, first_name: 'Intruso', last_name: 'Inyectado' });
    expect(error).not.toBeNull();
  });

  it('B no puede modificar los datos de A', async () => {
    const { data, error } = await dbAsB
      .from('clients')
      .update({ first_name: 'Alterado' })
      .eq('id', clientAId)
      .select('id');
    // La politica de update filtra la fila: no hay error, pero no altera nada.
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it('B no puede borrar el historial inmutable de A', async () => {
    const { data, error } = await dbAsB.from('part_movements').delete().eq('part_id', partAId).select('id');
    // part_movements no tiene politica de delete: nada se borra.
    expect(data ?? []).toEqual([]);
    if (error) expect(error).toBeTruthy();
  });

  it('B sigue viendo con normalidad sus propios datos', async () => {
    // Control negativo: si estas consultas tambien devolvieran vacio, las
    // pruebas anteriores no probarian aislamiento, sino que RLS bloquea todo.
    const { data, error } = await dbAsB.from('organizations').select('id, name');
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('la funcion de busqueda por email no es invocable por un usuario autenticado', async () => {
    // RNF-106: evita usar la invitacion como mecanismo de enumeracion de cuentas.
    const { error } = await dbAsB.rpc('get_user_id_by_email', { p_email: userA.email });
    expect(error).not.toBeNull();
  });
});

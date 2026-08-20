import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';

/**
 * PRUEBA DE AISLAMIENTO POR ACCESO DIRECTO A LA BASE DE DATOS — RF-702.
 *
 * Es el entregable del objetivo especifico 4 —validar el aislamiento con
 * evidencia reproducible—, y la unica prueba que demuestra la premisa central
 * Cubre CP-702 (una fila por tabla de negocio), CP-N101 (escritura y borrado)
 * y CP-N106. La comprobacion complementaria —el aislamiento por la interfaz,
 * CP-701— vive en integration.test.ts, y la de las dos capas independientes
 * —CP-N102— en defense-in-depth.test.ts.
 *
 * del proyecto: que el aislamiento entre organizaciones se sostiene AUNQUE la capa
 * de aplicacion omita sus controles.
 *
 * La diferencia con integration.test.ts es deliberada y esencial: alli las
 * peticiones pasan por la API, que verifica la membresia antes de consultar.
 * Aqui se PRESCINDE de la API. Se usa un cliente de Supabase autenticado con
 * la credencial de la cuenta B y se consultan directamente las tablas de la organizacion
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
 * Requiere un Supabase real con las migraciones 0001..0007 aplicadas.
 */
const hasEnv = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SECRET_KEY,
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
    const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const anon = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const provisioned = await register(userA.email, userA.password, `Organizacion A ${rnd()}`);
    orgAId = provisioned.organization.id;
    workshopAId = provisioned.workshop.id;

    await register(userB.email, userB.password, `Organizacion B ${rnd()}`);

    // La organizacion A crea datos en los dos niveles de la jerarquia.
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
    const sessionB = await createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }).auth.signInWithPassword(userB);
    if (sessionB.error) throw sessionB.error;

    dbAsB = createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${sessionB.data.session!.access_token}` } },
    });
  });

  it('CP-702 · organizations — B no puede leer la organizacion de A', async () => {
    const { data, error } = await dbAsB.from('organizations').select('id, name').eq('id', orgAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('CP-702 · workshops — B no puede leer los talleres de A', async () => {
    const { data, error } = await dbAsB.from('workshops').select('id, name').eq('organization_id', orgAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('CP-702 · memberships — B no puede leer las membresias de A', async () => {
    const { data, error } = await dbAsB.from('memberships').select('user_id, role').eq('organization_id', orgAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('CP-702 · clients — B no puede leer los clientes de A (nivel organizacion)', async () => {
    const { data, error } = await dbAsB.from('clients').select('id, first_name').eq('organization_id', orgAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);

    // Tampoco apuntando al identificador exacto, que es el caso realista:
    // el atacante ya conoce el id porque lo vio en otro contexto.
    const direct = await dbAsB.from('clients').select('id').eq('id', clientAId);
    expect(direct.error).toBeNull();
    expect(direct.data).toEqual([]);
  });

  it('CP-702 · parts — B no puede leer el inventario de A (nivel taller)', async () => {
    const { data, error } = await dbAsB.from('parts').select('id, part_number').eq('id', partAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('CP-702 · part_movements — B no puede leer los movimientos de A', async () => {
    const { data, error } = await dbAsB.from('part_movements').select('id').eq('part_id', partAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('CP-702 · audit_log — B no puede leer la auditoria de A', async () => {
    const { data, error } = await dbAsB.from('audit_log').select('id, action').eq('organization_id', orgAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('CP-N101 — B no puede ESCRIBIR en la organizacion de A', async () => {
    // El aislamiento no es solo de lectura: la politica de insert exige
    // membresia activa, asi que la escritura debe ser rechazada.
    const { error } = await dbAsB
      .from('clients')
      .insert({ organization_id: orgAId, first_name: 'Intruso', last_name: 'Inyectado' });
    expect(error).not.toBeNull();
  });

  it('CP-N101 — B no puede modificar los datos de A', async () => {
    const { data, error } = await dbAsB
      .from('clients')
      .update({ first_name: 'Alterado' })
      .eq('id', clientAId)
      .select('id');
    // La politica de update filtra la fila: no hay error, pero no altera nada.
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it('CP-N101 — B no puede borrar el historial inmutable de A', async () => {
    const { data, error } = await dbAsB.from('part_movements').delete().eq('part_id', partAId).select('id');
    // part_movements no tiene politica de delete: nada se borra.
    expect(data ?? []).toEqual([]);
    if (error) expect(error).toBeTruthy();
  });

  it('control negativo — B sigue viendo con normalidad sus propios datos', async () => {
    // Control negativo: si estas consultas tambien devolvieran vacio, las
    // pruebas anteriores no probarian aislamiento, sino que RLS bloquea todo.
    const { data, error } = await dbAsB.from('organizations').select('id, name');
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('CP-N106 — la busqueda por correo no es invocable por una cuenta autenticada', async () => {
    // RNF-106: evita usar la invitacion como mecanismo de enumeracion de cuentas.
    const { error } = await dbAsB.rpc('get_user_id_by_email', { p_email: userA.email });
    expect(error).not.toBeNull();
  });
});

/**
 * CP-704 — LA AUDITORIA ES LA UNICA LECTURA RESERVADA A UN ROL.
 *
 * Las pruebas anteriores contrastan organizaciones distintas. Esta es diferente y
 * mas exigente: la cuenta SI es miembro activo de la organizacion, con membresia
 * legitima, pero su rol no es propietario. Para todas las demas tablas eso le
 * basta para leer; para audit_log no (RF-704).
 *
 * Se comprueba por las dos vias, porque el requisito exige ambas:
 *   - via API      -> 403 audit.insufficient_permissions   (CP-704.1)
 *   - via base de datos, sin pasar por la API -> cero filas (CP-704.2)
 *
 * Sin la migracion 0007 el segundo caso falla: la politica original usaba
 * is_org_member y devolvia el registro completo a cualquier miembro.
 */
describe.skipIf(!hasEnv)('auditoria reservada al Owner (RF-704)', () => {
  const app = createApp();

  const owner = { email: `audit_owner_${rnd()}@motocore.test`, password: 'supersecret1' };
  const mecanico = { email: `audit_mech_${rnd()}@motocore.test`, password: 'supersecret1' };

  let orgId = '';
  let tokenMecanico = '';
  let dbComoMecanico: SupabaseClient;

  beforeAll(async () => {
    const url = process.env.SUPABASE_URL!;
    const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const anon = () =>
      createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });

    async function registrar(cuenta: { email: string; password: string }, organizacion: string) {
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cuenta, firstName: 'Audit', lastName: 'Test', organizationName: organizacion }),
      });
      expect(res.status).toBe(201);
      return (await res.json()) as { organization: { id: string } };
    }

    orgId = (await registrar(owner, `Organizacion auditada ${rnd()}`)).organization.id;
    await registrar(mecanico, `Organizacion del mecanico ${rnd()}`);

    const sesionOwner = await anon().auth.signInWithPassword(owner);
    if (sesionOwner.error) throw sesionOwner.error;
    const tokenOwner = sesionOwner.data.session!.access_token;

    // El Owner invita al mecanico: esta invitacion genera, ademas, la primera
    // entrada de auditoria con la que se prueba la lectura.
    const invitacion = await app.request('/api/members/invite', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOwner}`,
        'Content-Type': 'application/json',
        'X-Org-Id': orgId,
      },
      body: JSON.stringify({ email: mecanico.email, role: 'mechanic' }),
    });
    expect(invitacion.status).toBe(201);

    const sesionMecanico = await anon().auth.signInWithPassword(mecanico);
    if (sesionMecanico.error) throw sesionMecanico.error;
    tokenMecanico = sesionMecanico.data.session!.access_token;

    dbComoMecanico = createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${tokenMecanico}` } },
    });
  });

  it('el Owner consulta la auditoria de su organizacion', async () => {
    const url = process.env.SUPABASE_URL!;
    const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sesion = await createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }).auth.signInWithPassword(owner);
    if (sesion.error) throw sesion.error;

    const res = await app.request('/api/audit', {
      headers: { Authorization: `Bearer ${sesion.data.session!.access_token}`, 'X-Org-Id': orgId },
    });
    expect(res.status).toBe(200);

    const { audit } = (await res.json()) as { audit: Array<{ action: string }> };
    // La invitacion del beforeAll debe estar registrada (RF-703).
    expect(audit.some((e) => e.action === 'member.invited')).toBe(true);
  });

  it('CP-704.1 — un miembro no propietario recibe 403 al consultar por la API', async () => {
    const res = await app.request('/api/audit', {
      headers: { Authorization: `Bearer ${tokenMecanico}`, 'X-Org-Id': orgId },
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { title: string }).title).toBe('audit.insufficient_permissions');
  });

  it('CP-704.2 — un miembro no propietario no lee la auditoria por acceso directo', async () => {
    // Es el caso que la migracion 0007 corrige. El mecanico es miembro activo,
    // asi que la consulta no falla por permisos: simplemente no devuelve filas.
    const { data, error } = await dbComoMecanico
      .from('audit_log')
      .select('id, action')
      .eq('organization_id', orgId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('el mecanico si lee las demas tablas de su organizacion', async () => {
    // Control negativo: confirma que su membresia es valida y que lo anterior
    // se debe a la politica de audit_log, no a que RLS le bloquee todo.
    const { data, error } = await dbComoMecanico.from('workshops').select('id').eq('organization_id', orgId);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { MISSING, ORG, OTHER_ORG, OTHER_WORKSHOP, WORKSHOP } from '../support/fixtures.js';
import { contractPlatform, TOKENS } from '../support/platform.js';

/**
 * NIVEL N2 — CONTRATO HTTP (Plan de pruebas, §1.2).
 *
 * La interfaz completa —rutas, middlewares, servicios y manejador de errores—
 * en memoria y **sin base de datos**: la verificación de la credencial y de la
 * membresía se sustituye por una plataforma simulada, y cualquier intento de
 * consultar la base hace fallar el caso. Verifica lo que ocurre antes de tocar
 * la base: credencial, contexto obligatorio, rol, forma del error y validación
 * de la entrada.
 */
const app = createApp(contractPlatform());

interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, string[]>;
}

function call(
  path: string,
  {
    token,
    org,
    workshop,
    method = 'GET',
    body,
  }: { token?: string; org?: string; workshop?: string; method?: string; body?: unknown } = {},
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (org) headers['X-Org-Id'] = org;
  if (workshop) headers['X-Workshop-Id'] = workshop;
  return app.request(path, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function expectProblem(response: Response, status: number, code: string): Promise<Problem> {
  const problem = (await response.json()) as Problem;
  expect({ status: response.status, code: problem.title }).toEqual({ status, code });
  return problem;
}

const owner = { token: TOKENS.owner, org: ORG };
const mechanic = { token: TOKENS.mechanic, org: ORG };

describe('N2 — disponibilidad y credencial (RF-103)', () => {
  it('GET /health es público y no toca la base', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('CP-103.1 — sin credencial: 401 auth.missing_token, en todos los recursos protegidos', async () => {
    for (const path of [
      '/api/auth/me',
      '/api/organizations',
      '/api/workshops',
      '/api/members',
      '/api/clients',
      '/api/inventory/parts',
      '/api/audit',
    ]) {
      await expectProblem(await call(path), 401, 'auth.missing_token');
    }
  });

  it('CP-103.1 — un esquema distinto de Bearer cuenta como credencial ausente', async () => {
    const res = await app.request('/api/organizations', { headers: { Authorization: 'Basic abc' } });
    await expectProblem(res, 401, 'auth.missing_token');
  });

  it('CP-103.2 — credencial inválida: 401 auth.invalid_token', async () => {
    await expectProblem(await call('/api/organizations', { token: 'caducada' }), 401, 'auth.invalid_token');
  });

  it('la credencial se evalúa antes que el contexto activo', async () => {
    await expectProblem(
      await call('/api/inventory/parts', { org: ORG, workshop: WORKSHOP }),
      401,
      'auth.missing_token',
    );
  });
});

describe('N2 — contexto activo (ADR-005, §2.2 del contrato)', () => {
  it('sin X-Org-Id: 400 organization.missing_active_org, sin elegir una por defecto', async () => {
    for (const path of ['/api/workshops', '/api/members', '/api/clients', '/api/audit', '/api/inventory/parts']) {
      await expectProblem(await call(path, { token: TOKENS.owner }), 400, 'organization.missing_active_org');
    }
  });

  it('CP-303.1 — nivel taller sin X-Workshop-Id: 400 workshop.missing_active_workshop', async () => {
    await expectProblem(await call('/api/inventory/parts', owner), 400, 'workshop.missing_active_workshop');
  });

  it('la ausencia de cabeceras se rechaza antes de comprobar la membresía', async () => {
    // Una cuenta sin membresía recibe igualmente el 400: la regla 1 no consulta nada.
    await expectProblem(
      await call('/api/inventory/parts', { token: TOKENS.stranger, org: OTHER_ORG }),
      400,
      'workshop.missing_active_workshop',
    );
  });

  it('CP-203.2 y RF-701 — sin membresía en la organización declarada: 403 organization.access_denied', async () => {
    await expectProblem(
      await call('/api/clients', { token: TOKENS.stranger, org: ORG }),
      403,
      'organization.access_denied',
    );
    await expectProblem(
      await call('/api/inventory/parts', { token: TOKENS.stranger, org: ORG, workshop: WORKSHOP }),
      403,
      'organization.access_denied',
    );
    await expectProblem(
      await call(`/api/organizations/${ORG}/switch`, { token: TOKENS.stranger, method: 'POST' }),
      403,
      'organization.access_denied',
    );
  });

  it('RNF-105 — una organización inexistente o mal formada responde igual que una ajena', async () => {
    const ajena = await expectProblem(
      await call('/api/clients', { token: TOKENS.owner, org: OTHER_ORG }),
      403,
      'organization.access_denied',
    );
    const malFormada = await expectProblem(
      await call('/api/clients', { token: TOKENS.owner, org: 'x' }),
      403,
      'organization.access_denied',
    );
    expect(malFormada).toEqual(ajena);
  });

  it('CP-303.2 — un taller de otra organización, inexistente o mal formado: 404 workshop.not_found idéntico', async () => {
    const ajeno = await expectProblem(
      await call('/api/inventory/parts', { ...owner, workshop: 'ajeno-0000' }),
      404,
      'workshop.not_found',
    );
    const inexistente = await expectProblem(
      await call('/api/inventory/parts', { ...owner, workshop: MISSING }),
      404,
      'workshop.not_found',
    );
    expect(inexistente).toEqual(ajeno);
  });
});

describe('N2 — rol (se evalúa antes que la entrada)', () => {
  it('CP-505 — el Mechanic no crea clientes', async () => {
    await expectProblem(
      await call('/api/clients', { ...mechanic, method: 'POST', body: { first_name: 'A', last_name: 'B' } }),
      403,
      'client.insufficient_permissions',
    );
  });

  it('CP-406 — el Mechanic no invita', async () => {
    await expectProblem(
      await call('/api/members/invite', {
        ...mechanic,
        method: 'POST',
        body: { email: 'x@correo.bo', role: 'mechanic' },
      }),
      403,
      'member.insufficient_permissions',
    );
  });

  it('CP-301.2 — el Mechanic no crea talleres', async () => {
    await expectProblem(
      await call('/api/workshops', { ...mechanic, method: 'POST', body: { name: 'X' } }),
      403,
      'workshop.insufficient_permissions',
    );
  });

  it('CP-704.1 — el Mechanic no consulta la auditoría', async () => {
    await expectProblem(await call('/api/audit', mechanic), 403, 'audit.insufficient_permissions');
  });

  it('CP-609 — el Mechanic no registra repuestos', async () => {
    await expectProblem(
      await call('/api/inventory/parts', {
        ...mechanic,
        workshop: WORKSHOP,
        method: 'POST',
        body: { part_number: 'X', name: 'X' },
      }),
      403,
      'inventory.insufficient_permissions',
    );
  });

  it('un rol insuficiente con un cuerpo ilegible sigue siendo 403, no 400', async () => {
    await expectProblem(
      await call('/api/clients', { ...mechanic, method: 'POST', body: '{ no es json' }),
      403,
      'client.insufficient_permissions',
    );
  });

  it('CP-402.1 — invitar como owner se rechaza con member.owner_role_forbidden', async () => {
    await expectProblem(
      await call('/api/members/invite', { ...owner, method: 'POST', body: { email: 'x@correo.bo', role: 'owner' } }),
      403,
      'member.owner_role_forbidden',
    );
    await expectProblem(
      await call(`/api/members/${MISSING}/role`, { ...owner, method: 'PATCH', body: { role: 'owner' } }),
      403,
      'member.owner_role_forbidden',
    );
  });
});

describe('N2 — entrada y forma del error (RNF-204, RNF-205)', () => {
  it('CP-101.4 — contraseña corta: 400 con el campo señalado', async () => {
    const res = await call('/api/auth/register', {
      method: 'POST',
      body: {
        email: 'duena@correo.bo',
        password: '1234567',
        first_name: 'Ana',
        last_name: 'Q',
        organization_name: 'Motos',
      },
    });
    const problem = await expectProblem(res, 400, 'validation.invalid_body');
    expect(Object.keys(problem.errors ?? {})).toEqual(['password']);
  });

  it('CP-N205 — cuerpo inválido: 400 con detalle por campo, sin llegar a la base', async () => {
    const res = await call('/api/clients', {
      ...owner,
      method: 'POST',
      body: { first_name: '', email: 'no-es-correo' },
    });
    const problem = await expectProblem(res, 400, 'validation.invalid_body');
    expect(Object.keys(problem.errors ?? {}).sort()).toEqual(['email', 'first_name', 'last_name']);
  });

  it('un JSON ilegible es entrada inválida, no un fallo del servidor', async () => {
    const problem = await expectProblem(
      await call('/api/auth/register', { method: 'POST', body: '{ no es json' }),
      400,
      'validation.invalid_body',
    );
    expect(problem.errors).toHaveProperty('_');
  });

  it('CP-604.2 — el tipo transferencia enviado directamente: 400 inventory.invalid_movement_type', async () => {
    await expectProblem(
      await call(`/api/inventory/parts/${MISSING}/movements`, {
        ...owner,
        workshop: WORKSHOP,
        method: 'POST',
        body: { movement_type: 'transferencia', quantity: 1 },
      }),
      400,
      'inventory.invalid_movement_type',
    );
  });

  it('cantidad negativa: 400 inventory.invalid_quantity', async () => {
    await expectProblem(
      await call(`/api/inventory/parts/${MISSING}/movements`, {
        ...mechanic,
        workshop: WORKSHOP,
        method: 'POST',
        body: { movement_type: 'venta', quantity: -3 },
      }),
      400,
      'inventory.invalid_quantity',
    );
  });

  it('transferencia al mismo taller: 400 inventory.same_workshop_transfer', async () => {
    await expectProblem(
      await call(`/api/inventory/parts/${MISSING}/transfer`, {
        ...owner,
        workshop: WORKSHOP,
        method: 'POST',
        body: { to_workshop_id: WORKSHOP, quantity: 1 },
      }),
      400,
      'inventory.same_workshop_transfer',
    );
  });

  it('CP-N204 — todo error es Problem Details con código modulo.razon', async () => {
    const responses = [
      await call('/api/clients'),
      await call('/api/clients', { token: TOKENS.owner }),
      await call('/api/clients', { token: TOKENS.stranger, org: ORG }),
      await call('/api/clients', { ...owner, method: 'POST', body: {} }),
    ];
    for (const res of responses) {
      // RFC 9457 §3: el tipo de medio de un problema es `application/problem+json`.
      expect(res.headers.get('content-type')).toContain('application/problem+json');
      const problem = (await res.json()) as Problem;
      expect(problem.type).toBe('about:blank');
      expect(problem.status).toBe(res.status);
      expect(problem.title).toMatch(/^[a-z]+\.[a-z_]+$/);
      expect(problem.detail).toBeTruthy();
    }
  });
});

describe('N2 — regla de rutas y superficie (§2.3, §2.6, §3.7)', () => {
  it('los recursos interiores no se anidan bajo la organización', async () => {
    for (const nested of ['clients', 'workshops', 'members', 'inventory/parts', 'audit']) {
      const res = await call(`/api/organizations/${ORG}/${nested}`, { token: TOKENS.owner });
      expect(res.status, nested).toBe(404);
    }
  });

  it('la auditoría no expone escritura: el registro es de solo inserción', async () => {
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      const res = await call('/api/audit', { ...owner, method });
      expect(res.status, method).toBe(404);
    }
  });

  it('no hay rutas de inicio ni renovación de sesión: ocurren contra el proveedor (ADR-004)', async () => {
    for (const path of ['/api/auth/login', '/api/auth/refresh']) {
      expect((await call(path, { method: 'POST', body: {} })).status, path).toBe(404);
    }
  });

  it('RNF-105 y RNF-204 — una ruta inexistente dentro de un módulo responde el 404 de ese módulo', async () => {
    // Indistinguible de un recurso inexistente, y con el formato de error
    // uniforme: la interfaz no inventa un código fuera del catálogo.
    const casos: Array<[string, string]> = [
      [`/api/clients/${MISSING}/inventado`, 'client.not_found'],
      [`/api/workshops/${MISSING}/inventado`, 'workshop.not_found'],
      [`/api/members/${MISSING}/inventado`, 'member.not_found'],
      [`/api/inventory/inventado`, 'inventory.part_not_found'],
      [`/api/organizations/${ORG}/inventado`, 'organization.not_found'],
    ];
    for (const [path, code] of casos) {
      const res = await call(path, { ...owner, workshop: WORKSHOP });
      await expectProblem(res, 404, code);
      expect(res.headers.get('content-type'), path).toContain('application/problem+json');
    }
  });

  it('las bajas lógicas son POST /deactivate: el PATCH no cambia el estado', async () => {
    // Un PATCH con is_active no es una baja: el esquema lo descarta y exige un campo real.
    await expectProblem(
      await call(`/api/clients/${MISSING}`, { ...owner, method: 'PATCH', body: { is_active: false } }),
      400,
      'validation.invalid_body',
    );
  });
});

describe('N2 — orígenes permitidos (Requisitos, sección 5)', () => {
  it('responde la política CORS solo al origen del cliente web', async () => {
    const allowed = await app.request('/api/clients', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'GET' },
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(allowed.headers.get('access-control-allow-headers')).toContain('X-Workshop-Id');

    const denied = await app.request('/api/clients', {
      method: 'OPTIONS',
      headers: { Origin: 'https://sitio-ajeno.example', 'Access-Control-Request-Method': 'GET' },
    });
    expect(denied.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('el taller distinto del activo existe en la organización (control del montaje)', async () => {
    // Sin este control, CP-303.2 podría pasar porque ningún taller es válido:
    // con un taller de la organización, la petición supera el contexto y la
    // rechaza la validación del cuerpo, antes de tocar la base.
    const res = await call(`/api/inventory/parts/${MISSING}/movements`, {
      ...mechanic,
      workshop: OTHER_WORKSHOP,
      method: 'POST',
      body: { movement_type: 'regalo', quantity: 1 },
    });
    await expectProblem(res, 400, 'inventory.invalid_movement_type');
  });
});

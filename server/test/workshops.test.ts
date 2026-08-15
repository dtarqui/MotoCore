import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { createApp } from '../src/app.js';
import {
  createWorkshopSchema,
  updateWorkshopSchema,
  assignMemberSchema,
  updateOrganizationSchema,
} from '../src/schemas.js';

const ORG = '00000000-0000-0000-0000-000000000000';

describe('rutas de sucursales', () => {
  const app = createApp();

  it('listar sucursales sin token responde 401', async () => {
    const res = await app.request(`/api/organizations/${ORG}/workshops`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { title: string };
    expect(body.title).toBe('auth.unauthorized');
  });

  it('crear sucursal sin token responde 401', async () => {
    const res = await app.request(`/api/organizations/${ORG}/workshops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sucursal Centro' }),
    });
    expect(res.status).toBe(401);
  });

  it('asignar miembro sin token responde 401 (ruta anidada de dos niveles)', async () => {
    const res = await app.request(`/api/organizations/${ORG}/workshops/${ORG}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: ORG }),
    });
    expect(res.status).toBe(401);
  });

  it('las sucursales no capturan las rutas de miembros de la empresa', async () => {
    // Regresion: montar /api/organizations/:orgId/workshops no debe romper
    // /api/organizations/:orgId/members, que vive en otro sub-app.
    const res = await app.request(`/api/organizations/${ORG}/members`);
    expect(res.status).toBe(401);
  });
});

describe('propagacion del parametro del prefijo montado', () => {
  // El modulo de sucursales lee c.req.param('orgId'), que proviene del prefijo
  // con el que se monta el sub-app. Si Hono dejara de propagarlo, todas las
  // comprobaciones de pertenencia a la empresa se harian contra undefined.
  it('un sub-app montado bajo :orgId recibe el parametro', async () => {
    const sub = new Hono();
    sub.get('/', (c) => c.json({ orgId: c.req.param('orgId') ?? null }));

    const parent = new Hono();
    parent.route('/api/organizations/:orgId/workshops', sub);

    const res = await parent.request('/api/organizations/abc-123/workshops');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orgId: 'abc-123' });
  });
});

describe('esquemas de sucursal', () => {
  it('acepta una sucursal con solo el nombre', () => {
    expect(createWorkshopSchema.parse({ name: 'Centro' })).toEqual({ name: 'Centro' });
  });

  it('rechaza el nombre vacio', () => {
    expect(createWorkshopSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('rechaza una actualizacion sin ningun campo', () => {
    expect(updateWorkshopSchema.safeParse({}).success).toBe(false);
    expect(updateOrganizationSchema.safeParse({}).success).toBe(false);
  });

  it('acepta una actualizacion parcial', () => {
    expect(updateWorkshopSchema.safeParse({ phone: '77712345' }).success).toBe(true);
  });

  it('la asignacion exige un identificador de usuario valido', () => {
    expect(assignMemberSchema.safeParse({ userId: 'no-es-uuid' }).success).toBe(false);
    expect(assignMemberSchema.safeParse({ userId: ORG }).success).toBe(true);
  });
});

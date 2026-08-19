import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';
import {
  createWorkshopSchema,
  updateWorkshopSchema,
  assignMemberSchema,
  updateOrganizationSchema,
} from '../src/schemas.js';

const UUID = '00000000-0000-0000-0000-000000000000';

describe('rutas de talleres y miembros', () => {
  const app = createApp();

  it('listar talleres sin credencial responde 401', async () => {
    const res = await app.request('/api/workshops');
    expect(res.status).toBe(401);
    expect(((await res.json()) as { title: string }).title).toBe('auth.missing_token');
  });

  it('crear taller sin credencial responde 401', async () => {
    const res = await app.request('/api/workshops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Taller Centro' }),
    });
    expect(res.status).toBe(401);
  });

  it('asignar miembro a un taller sin credencial responde 401', async () => {
    const res = await app.request(`/api/workshops/${UUID}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: UUID }),
    });
    expect(res.status).toBe(401);
  });

  it('cambiar el rol de un miembro sin credencial responde 401', async () => {
    const res = await app.request(`/api/members/${UUID}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mechanic' }),
    });
    expect(res.status).toBe(401);
  });
});

/**
 * Regla de rutas del §2.3 del contrato. Se comprueba como REGRESION: la
 * organizacion aparece en la ruta solo cuando es el recurso; todo lo interior a
 * ella se resuelve por cabecera. Admitir las dos formas dejaria dos mecanismos
 * de contexto conviviendo y la validacion dejaria de estar en un punto unico.
 */
describe('regla de rutas: el contexto viaja por cabecera', () => {
  const app = createApp();

  it('los recursos interiores se montan en la raiz de /api, no bajo la organizacion', async () => {
    // Estan montados y protegidos: responden 401, no 404.
    for (const ruta of ['/api/workshops', '/api/members', '/api/clients', '/api/inventory/parts']) {
      expect((await app.request(ruta)).status, ruta).toBe(401);
    }
  });

  // Que las rutas anidadas hayan DESAPARECIDO no puede comprobarse en este
  // nivel: `organizationRoutes` aplica requireAuth a todo `/api/organizations/*`,
  // de modo que sin credencial la respuesta es 401 tanto si hay handler como si
  // no. La regresion se verifica en N3 —con credencial valida— en
  // integration.test.ts, donde el 404 si distingue ambos casos.

  it('la organizacion sigue siendo un recurso con identificador en la ruta', async () => {
    // Lo que SI conserva la ruta anidada es la organizacion misma y su cambio
    // de contexto: ahi la organizacion es el recurso, no el contexto.
    expect((await app.request(`/api/organizations/${UUID}`)).status).toBe(401);
    expect((await app.request(`/api/organizations/${UUID}/switch`, { method: 'POST' })).status).toBe(401);
  });
});

describe('esquemas de taller y organizacion', () => {
  it('acepta un taller con solo el nombre', () => {
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

  it('la asignacion exige un identificador de cuenta valido', () => {
    expect(assignMemberSchema.safeParse({ userId: 'no-es-uuid' }).success).toBe(false);
    expect(assignMemberSchema.safeParse({ userId: UUID }).success).toBe(true);
  });
});

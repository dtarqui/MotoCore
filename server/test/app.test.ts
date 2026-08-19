import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';

// Nivel N2 del plan de pruebas: pipeline HTTP real (rutas, auth, validacion,
// mapeo de errores) SIN necesidad de Supabase. Cubre los caminos que fallan
// antes de tocar la base: 401 sin credencial, 400 por validacion.
describe('superficie HTTP', () => {
  const app = createApp();
  const codeOf = async (res: Response) => ((await res.json()) as { title: string }).title;

  it('GET /health responde 200', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('CP-103.1 — peticion sin credencial responde 401 auth.missing_token', async () => {
    const res = await app.request('/api/organizations');
    expect(res.status).toBe(401);
    expect(await codeOf(res)).toBe('auth.missing_token');
  });

  it('CP-103.2 — una credencial mal formada tambien se rechaza con 401', async () => {
    const res = await app.request('/api/organizations', { headers: { Authorization: 'Basic abc' } });
    expect(res.status).toBe(401);
    expect(await codeOf(res)).toBe('auth.missing_token');
  });

  it('CP-101.4 — body invalido responde 400 validation.invalid_body con detalle por campo', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'no-es-email', password: '123' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { title: string; errors?: Record<string, string[]> };
    expect(body.title).toBe('validation.invalid_body');
    expect(body.errors).toBeTruthy();
    expect(Object.keys(body.errors ?? {}).length).toBeGreaterThan(0);
  });

  it('CP-N204 — el error se serializa como Problem Details (RFC 9457)', async () => {
    const res = await app.request('/api/clients');
    const body = (await res.json()) as { type: string; title: string; status: number; detail: string };
    expect(body.type).toBe('about:blank');
    expect(body.status).toBe(res.status);
    expect(body.title).toMatch(/^[a-z]+\.[a-z_]+$/);
    expect(body.detail).toBeTruthy();
  });

  it('los modulos interiores exigen credencial antes que cualquier otra cosa', async () => {
    // §2.3: talleres, miembros, clientes, inventario y auditoria se resuelven
    // por cabecera, no por ruta anidada. Todos ellos exigen credencial.
    for (const ruta of ['/api/workshops', '/api/members', '/api/clients', '/api/inventory/parts', '/api/audit']) {
      expect((await app.request(ruta)).status, ruta).toBe(401);
    }
  });
});

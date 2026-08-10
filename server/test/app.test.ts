import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';

// Estos tests ejercen el pipeline HTTP real (rutas, auth, validacion, mapeo de
// errores) SIN necesidad de Supabase: cubren los caminos que fallan antes de
// tocar la base (401 sin token, 400 por validacion).
describe('superficie HTTP', () => {
  const app = createApp();

  it('GET /health responde 200', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('GET /api/organizations sin token responde 401', async () => {
    const res = await app.request('/api/organizations');
    expect(res.status).toBe(401);
    const body = (await res.json()) as { title: string };
    expect(body.title).toBe('auth.unauthorized');
  });

  it('POST /api/auth/register con body invalido responde 400 con errores por campo', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'no-es-email', password: '123' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { title: string; errors?: Record<string, string[]> };
    expect(body.title).toBe('validation.failed');
    expect(body.errors).toBeTruthy();
    expect(Object.keys(body.errors ?? {}).length).toBeGreaterThan(0);
  });

  it('PATCH de rol sin token responde 401 (ruta anidada protegida)', async () => {
    const res = await app.request('/api/organizations/00000000-0000-0000-0000-000000000000/members/x/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mechanic' }),
    });
    expect(res.status).toBe(401);
  });
});

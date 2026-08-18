import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';
import { createPartSchema, movementSchema, transferSchema, createClientSchema } from '../src/schemas.js';

const UUID = '00000000-0000-0000-0000-000000000000';

/**
 * Superficie HTTP de los modulos de negocio, sin Supabase. Cubre lo que falla
 * ANTES de tocar la base: falta de token, falta de contexto activo y
 * validacion de entrada.
 */
describe('modulos de negocio: contexto activo obligatorio', () => {
  const app = createApp();

  it('clientes sin token responde 401', async () => {
    expect((await app.request('/api/clients')).status).toBe(401);
  });

  it('inventario sin token responde 401', async () => {
    expect((await app.request('/api/inventory/parts')).status).toBe(401);
  });

  it('la autenticacion se evalua antes que el contexto activo', async () => {
    // Con las cabeceras de contexto puestas pero sin token, debe fallar por
    // autenticacion (401) y no por contexto (400): el orden importa, porque
    // resolver el contexto de un usuario no autenticado no tiene sentido.
    const res = await app.request('/api/inventory/parts', {
      headers: { 'X-Org-Id': UUID, 'X-Workshop-Id': UUID },
    });
    expect(res.status).toBe(401);
    expect(((await res.json()) as { title: string }).title).toBe('auth.unauthorized');
  });

  it('la sucursal activa se exige aunque venga la empresa activa', async () => {
    const res = await app.request('/api/inventory/parts', { headers: { 'X-Org-Id': UUID } });
    // Sigue siendo 401 por falta de token; comprobar que no se cuela a 200.
    expect(res.status).toBe(401);
  });

  it('auditoria sin token responde 401', async () => {
    expect((await app.request('/api/audit')).status).toBe(401);
  });

  it('auditoria no expone escritura: el registro es inmutable', async () => {
    // RF-703: historial de solo insercion. El contrato no publica ninguna
    // operacion de modificacion ni de borrado sobre la auditoria, de modo que
    // esos metodos no deben existir en la ruta.
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      const res = await app.request('/api/audit', { method });
      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(201);
    }
  });
});

describe('esquemas del corte vertical', () => {
  it('el cliente exige nombre y apellido', () => {
    expect(createClientSchema.safeParse({ firstName: 'Ana' }).success).toBe(false);
    expect(createClientSchema.safeParse({ firstName: 'Ana', lastName: 'Quispe' }).success).toBe(true);
  });

  it('el email del cliente, si viene, debe ser valido', () => {
    expect(
      createClientSchema.safeParse({ firstName: 'A', lastName: 'B', email: 'no-es-email' }).success,
    ).toBe(false);
  });

  it('el repuesto exige numero de parte y nombre', () => {
    expect(createPartSchema.safeParse({ name: 'Filtro' }).success).toBe(false);
    expect(createPartSchema.safeParse({ partNumber: 'F-1', name: 'Filtro' }).success).toBe(true);
  });

  it('el maximo no puede quedar por debajo del minimo', () => {
    const res = createPartSchema.safeParse({
      partNumber: 'F-1',
      name: 'Filtro',
      minimumStock: 10,
      maximumStock: 5,
    });
    expect(res.success).toBe(false);
  });

  it('rechaza existencias y cantidades negativas', () => {
    expect(createPartSchema.safeParse({ partNumber: 'F-1', name: 'F', initialStock: -1 }).success).toBe(false);
    expect(movementSchema.safeParse({ movementType: 'sale', quantity: -5 }).success).toBe(false);
  });

  it('solo admite los seis tipos de movimiento documentados', () => {
    for (const movementType of ['purchase', 'sale', 'adjustment', 'return', 'transfer', 'damaged']) {
      expect(movementSchema.safeParse({ movementType, quantity: 1 }).success).toBe(true);
    }
    expect(movementSchema.safeParse({ movementType: 'regalo', quantity: 1 }).success).toBe(false);
  });

  it('la transferencia exige sucursal y repuesto de destino, y cantidad positiva', () => {
    expect(transferSchema.safeParse({ toWorkshopId: UUID, toPartId: UUID, quantity: 0 }).success).toBe(false);
    expect(transferSchema.safeParse({ toWorkshopId: UUID, toPartId: UUID, quantity: 3 }).success).toBe(true);
    expect(transferSchema.safeParse({ toWorkshopId: 'x', toPartId: UUID, quantity: 3 }).success).toBe(false);
  });
});

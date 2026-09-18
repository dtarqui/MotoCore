import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { RuleViolation, UniqueViolation } from '../../src/lib/db.js';
import { AppError } from '../../src/lib/errors.js';
import { MALFORMED_BODY } from '../../src/lib/http.js';
import type {
  InventoryRepository,
  MovementRow,
  NewMovement,
  NewTransfer,
  PartRow,
} from '../../src/modules/inventory/inventory.repository.js';
import { createInventoryService } from '../../src/modules/inventory/inventory.service.js';
import {
  expectAppError,
  MISSING,
  NOW,
  ORG,
  OTHER_WORKSHOP,
  OWNER,
  WORKSHOP,
  workshopCtx,
} from '../support/fixtures.js';

const PART = '55555555-5555-4555-8555-555555555555';

const part = (overrides: Partial<PartRow> = {}): PartRow => ({
  id: PART,
  organization_id: ORG,
  workshop_id: WORKSHOP,
  part_number: 'F-100',
  name: 'Filtro de aceite',
  description: null,
  brand: null,
  category: null,
  current_stock: 10,
  minimum_stock: 2,
  maximum_stock: null,
  unit_cost: null,
  is_active: true,
  created_at: NOW,
  updated_at: null,
  ...overrides,
});

const movement = (input: Partial<MovementRow>): MovementRow => ({
  id: MISSING,
  organization_id: ORG,
  workshop_id: WORKSHOP,
  part_id: PART,
  movement_type: 'compra',
  quantity: 1,
  previous_stock: 0,
  new_stock: 1,
  unit_cost: null,
  total_cost: null,
  reference: null,
  notes: null,
  transfer_id: null,
  performed_by: OWNER,
  created_at: NOW,
  ...input,
});

/**
 * Nivel N1: inventario con un repositorio en memoria. Las funciones atómicas
 * del motor se sustituyen por registros de llamada y, cuando el caso lo exige,
 * por la regla que el motor levantaría: el cálculo de la existencia vive en el
 * motor (ADR-007) y se verifica en N3.
 */
function memoryInventory(seed: PartRow[] = [part()]) {
  const parts = [...seed];
  const movements: NewMovement[] = [];
  const transfers: NewTransfer[] = [];
  let rule: string | null = null;

  const repo: InventoryRepository = {
    async listParts(orgId, workshopId, { includeInactive }) {
      return parts.filter(
        (p) => p.organization_id === orgId && p.workshop_id === workshopId && (includeInactive || p.is_active),
      );
    },
    async findPart(orgId, workshopId, id) {
      return parts.find((p) => p.organization_id === orgId && p.workshop_id === workshopId && p.id === id) ?? null;
    },
    async insertPart(input) {
      if (parts.some((p) => p.workshop_id === input.workshop_id && p.part_number === input.part_number)) {
        throw new UniqueViolation('parts.insert');
      }
      const row = part({ ...input, id: MISSING, current_stock: 0 });
      parts.push(row);
      return row;
    },
    async updatePart(orgId, workshopId, id, patch) {
      const row = parts.find((p) => p.organization_id === orgId && p.workshop_id === workshopId && p.id === id);
      if (!row) return null;
      Object.assign(row, patch);
      return row;
    },
    async listMovements() {
      return [movement({})];
    },
    async registerMovement(input) {
      if (rule) throw new RuleViolation(rule);
      movements.push(input);
      const row = parts.find((p) => p.id === input.part_id)!;
      row.current_stock += input.quantity;
      return movement({ movement_type: input.movement_type, quantity: input.quantity });
    },
    async transfer(input) {
      if (rule) throw new RuleViolation(rule);
      transfers.push(input);
      return [movement({ movement_type: 'transferencia' }), movement({ movement_type: 'transferencia' })];
    },
  };
  return { repo, parts, movements, transfers, engineRaises: (code: string) => (rule = code) };
}

describe('servicio de inventario — nivel taller', () => {
  it('CP-607 — con lowStock devuelve solo los que están en o por debajo del mínimo', async () => {
    const service = createInventoryService({
      repo: memoryInventory([
        part(),
        part({ id: 'a', name: 'En el mínimo', current_stock: 2 }),
        part({ id: 'b', name: 'Bajo el mínimo', current_stock: 1 }),
        part({ id: 'c', name: 'Otro taller', current_stock: 0, workshop_id: OTHER_WORKSHOP }),
      ]).repo,
    });
    const low = await service.listParts(workshopCtx('mechanic'), {
      lowStock: true,
      includeInactive: false,
      search: ' ',
    });
    expect(low.map((p) => p.name)).toEqual(['En el mínimo', 'Bajo el mínimo']);
    expect(await service.listParts(workshopCtx('mechanic'), { lowStock: false, includeInactive: false })).toHaveLength(
      3,
    );
  });

  it('CP-601 y HU-16 — registra el repuesto en el taller activo y genera la entrada de su existencia inicial', async () => {
    const fake = memoryInventory([]);
    const service = createInventoryService({ repo: fake.repo });

    const created = await service.createPart(workshopCtx('receptionist'), {
      part_number: 'B-1',
      name: 'Bujía',
      unit_cost: 25,
      initial_stock: 6,
    });

    expect(created).toMatchObject({ workshop_id: WORKSHOP, organization_id: ORG, current_stock: 6 });
    expect(fake.movements).toEqual([
      expect.objectContaining({ movement_type: 'compra', quantity: 6, unit_cost: 25, reference: 'existencia-inicial' }),
    ]);
  });

  it('RN-12 — sin existencia inicial no se genera ningún movimiento', async () => {
    const fake = memoryInventory([]);
    const service = createInventoryService({ repo: fake.repo });
    expect(
      await service.createPart(workshopCtx(), { part_number: 'B-2', name: 'Bujía', initial_stock: 0 }),
    ).toMatchObject({
      current_stock: 0,
    });
    expect(fake.movements).toHaveLength(0);
  });

  it('CP-603.1 — el número de parte repetido en el taller responde 409', async () => {
    const service = createInventoryService({ repo: memoryInventory().repo });
    await expectAppError(
      service.createPart(workshopCtx(), { part_number: 'F-100', name: 'Duplicado' }),
      'inventory.duplicate_part_number',
      409,
    );
  });

  it('CP-609 — el Mechanic no administra el catálogo ni transfiere; el Receptionist no transfiere', async () => {
    const service = createInventoryService({ repo: memoryInventory().repo });
    const code = 'inventory.insufficient_permissions';
    await expectAppError(service.createPart(workshopCtx('mechanic'), { part_number: 'X', name: 'X' }), code, 403);
    await expectAppError(service.updatePart(workshopCtx('mechanic'), PART, { name: 'X' }), code, 403);
    await expectAppError(
      service.transfer(workshopCtx('receptionist'), PART, { to_workshop_id: OTHER_WORKSHOP, quantity: 1 }),
      code,
      403,
    );
  });

  it('CP-609 — el Mechanic sí registra movimientos', async () => {
    const service = createInventoryService({ repo: memoryInventory().repo });
    const registered = await service.registerMovement(workshopCtx('mechanic', OWNER), PART, {
      movement_type: 'venta',
      quantity: 1,
    });
    expect(registered.movement_type).toBe('venta');
  });

  it('el rango de existencias se valida al crear y contra el estado resultante al editar', async () => {
    const service = createInventoryService({ repo: memoryInventory([part({ minimum_stock: 5 })]).repo });

    await expect(
      service.createPart(workshopCtx(), { part_number: 'R', name: 'R', minimum_stock: 10, maximum_stock: 3 }),
    ).rejects.toBeInstanceOf(ZodError);

    const error = await expectAppError(
      service.updatePart(workshopCtx(), PART, { maximum_stock: 4 }),
      'validation.invalid_body',
      400,
    );
    expect(error.fieldErrors).toHaveProperty('maximum_stock');

    expect(await service.updatePart(workshopCtx(), PART, { maximum_stock: 8, name: 'Filtro' })).toMatchObject({
      maximum_stock: 8,
      name: 'Filtro',
    });
  });

  it('CP-602 — un repuesto de otro taller no existe desde el taller activo', async () => {
    const service = createInventoryService({ repo: memoryInventory([part({ workshop_id: OTHER_WORKSHOP })]).repo });
    await expectAppError(service.getPart(workshopCtx(), PART), 'inventory.part_not_found', 404);
    await expectAppError(service.listMovements(workshopCtx(), PART), 'inventory.part_not_found', 404);
    await expectAppError(service.updatePart(workshopCtx(), PART, { name: 'X' }), 'inventory.part_not_found', 404);
    await expectAppError(service.getPart(workshopCtx(), 'no-es-uuid'), 'inventory.part_not_found', 404);
  });

  it('RF-604 — el historial del repuesto se lee desde el taller activo', async () => {
    const service = createInventoryService({ repo: memoryInventory().repo });
    expect(await service.listMovements(workshopCtx('mechanic'), PART)).toHaveLength(1);
  });

  describe('CP-604.2 — tipo y cantidad del movimiento, con sus códigos propios', () => {
    const service = () => createInventoryService({ repo: memoryInventory().repo });

    it.each([
      ['transferencia', 'inventory.invalid_movement_type'],
      ['regalo', 'inventory.invalid_movement_type'],
      [undefined, 'inventory.invalid_movement_type'],
    ])('tipo %s → %s', async (movement_type, code) => {
      await expectAppError(service().registerMovement(workshopCtx(), PART, { movement_type, quantity: 1 }), code, 400);
    });

    it.each([
      [{ movement_type: 'compra' }],
      [{ movement_type: 'compra', quantity: null }],
      [{ movement_type: 'venta', quantity: -1 }],
      [{ movement_type: 'venta', quantity: 1.5 }],
      [{ movement_type: 'merma', quantity: 0 }],
    ])('cantidad inválida %j', async (body) => {
      await expectAppError(service().registerMovement(workshopCtx(), PART, body), 'inventory.invalid_quantity', 400);
    });

    it('el ajuste admite cero: fija la existencia en ese valor', async () => {
      const registered = await service().registerMovement(workshopCtx(), PART, {
        movement_type: 'ajuste',
        quantity: 0,
      });
      expect(registered.movement_type).toBe('ajuste');
    });

    it('un cuerpo ilegible es entrada inválida', async () => {
      await expectAppError(
        service().registerMovement(workshopCtx(), PART, MALFORMED_BODY),
        'validation.invalid_body',
        400,
      );
      await expectAppError(service().transfer(workshopCtx(), PART, MALFORMED_BODY), 'validation.invalid_body', 400);
    });
  });

  it('CP-606 — la regla de existencia insuficiente del motor responde 409', async () => {
    const fake = memoryInventory();
    fake.engineRaises('inventory.insufficient_stock');
    const service = createInventoryService({ repo: fake.repo });
    await expectAppError(
      service.registerMovement(workshopCtx(), PART, { movement_type: 'venta', quantity: 99 }),
      'inventory.insufficient_stock',
      409,
    );
  });

  it('un error del motor que no es una regla conocida no se reinterpreta', async () => {
    const fake = memoryInventory();
    fake.engineRaises('otra.cosa');
    const service = createInventoryService({ repo: fake.repo });
    const error = await service
      .registerMovement(workshopCtx(), PART, { movement_type: 'compra', quantity: 1 })
      .catch((e) => e);
    expect(error).toBeInstanceOf(RuleViolation);
    expect(error).not.toBeInstanceOf(AppError);
  });

  describe('CP-608 — transferencia entre talleres', () => {
    it('transfiere desde el taller activo al de destino', async () => {
      const fake = memoryInventory();
      const service = createInventoryService({ repo: fake.repo });
      const result = await service.transfer(workshopCtx(), PART, {
        to_workshop_id: OTHER_WORKSHOP,
        quantity: 3,
        notes: 'Reposición',
      });

      expect(result).toHaveLength(2);
      expect(fake.transfers).toEqual([
        { from_part_id: PART, to_workshop_id: OTHER_WORKSHOP, quantity: 3, notes: 'Reposición', performed_by: OWNER },
      ]);
    });

    it('origen y destino iguales responden 400 inventory.same_workshop_transfer', async () => {
      const service = createInventoryService({ repo: memoryInventory().repo });
      await expectAppError(
        service.transfer(workshopCtx(), PART, { to_workshop_id: WORKSHOP, quantity: 1 }),
        'inventory.same_workshop_transfer',
        400,
      );
    });

    it('la cantidad debe ser un entero positivo', async () => {
      const service = createInventoryService({ repo: memoryInventory().repo });
      for (const quantity of [0, -2, 1.5, undefined]) {
        await expectAppError(
          service.transfer(workshopCtx(), PART, { to_workshop_id: OTHER_WORKSHOP, quantity }),
          'inventory.invalid_quantity',
          400,
        );
      }
    });

    it.each([
      ['inventory.cross_organization_transfer', 403],
      ['inventory.part_not_found', 404],
      ['inventory.insufficient_stock', 409],
    ])('la regla %s del motor responde %i', async (code, status) => {
      const fake = memoryInventory();
      fake.engineRaises(code);
      const service = createInventoryService({ repo: fake.repo });
      await expectAppError(
        service.transfer(workshopCtx(), PART, { to_workshop_id: OTHER_WORKSHOP, quantity: 1 }),
        code,
        status,
      );
    });
  });
});

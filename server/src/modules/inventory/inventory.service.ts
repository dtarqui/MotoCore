import { RuleViolation, UniqueViolation } from '../../lib/db.js';
import { AppError, badRequest, conflict, forbidden, invalidBody, notFound } from '../../lib/errors.js';
import { isUuid } from '../../lib/http.js';
import { assertReadableBody, parseBody } from '../../lib/validation.js';
import type { Role, WorkshopContext } from '../../types.js';
import type { InventoryRepository, MovementRow, PartRow } from './inventory.repository.js';
import {
  createPartSchema,
  DIRECT_MOVEMENT_TYPES,
  movementSchema,
  STOCK_RANGE_MESSAGE,
  stockRangeIsValid,
  transferSchema,
  updatePartSchema,
} from './inventory.schemas.js';

export interface InventoryDeps {
  repo: InventoryRepository;
}

/**
 * RF-609: el Mechanic consume repuestos —consulta el inventario y registra
 * movimientos— pero no administra el catálogo. La transferencia entre locales
 * queda reservada al Owner.
 */
const CATALOG_ROLES: readonly Role[] = ['owner', 'receptionist'];

function assertCanManageCatalog(ctx: WorkshopContext): void {
  if (!CATALOG_ROLES.includes(ctx.role)) {
    throw forbidden('inventory.insufficient_permissions', 'Tu rol no permite administrar el catálogo de repuestos.');
  }
}

function assertCanTransfer(ctx: WorkshopContext): void {
  if (ctx.role !== 'owner') {
    throw forbidden('inventory.insufficient_permissions', 'Solo el Owner puede transferir existencias.');
  }
}

const partNotFound = () => notFound('inventory.part_not_found', 'Repuesto no encontrado.');
const invalidMovementType = () =>
  badRequest('inventory.invalid_movement_type', 'Tipo de movimiento no registrable directamente.');
const invalidQuantity = () =>
  badRequest('inventory.invalid_quantity', 'La cantidad es obligatoria y no puede ser negativa.');

/** Estado y mensaje de cada regla que puede levantar el motor. El código ya es el del contrato. */
const RULES: Record<string, () => AppError> = {
  'inventory.part_not_found': partNotFound,
  'inventory.invalid_movement_type': invalidMovementType,
  'inventory.invalid_quantity': invalidQuantity,
  'inventory.insufficient_stock': () =>
    conflict('inventory.insufficient_stock', 'La existencia es insuficiente para esta operación.'),
  // 403 y no 400: es una frontera de autorización, no una entrada mal formada.
  'inventory.cross_organization_transfer': () =>
    forbidden('inventory.cross_organization_transfer', 'El taller de destino no pertenece a la organización.'),
  'inventory.same_workshop_transfer': () =>
    badRequest('inventory.same_workshop_transfer', 'El origen y el destino son el mismo taller.'),
};

function translate(error: unknown): never {
  if (error instanceof RuleViolation) {
    const rule = RULES[error.code];
    if (rule) throw rule();
  }
  if (error instanceof UniqueViolation) {
    throw conflict('inventory.duplicate_part_number', 'Ya existe un repuesto con ese número en este taller.');
  }
  throw error;
}

const field = (body: unknown, name: string): unknown =>
  body !== null && typeof body === 'object' ? (body as Record<string, unknown>)[name] : undefined;

/**
 * Tipo y cantidad, con los códigos que el contrato les reserva (§4), antes del
 * resto del esquema. Cero solo vale para el ajuste, que fija la existencia en
 * ese valor.
 */
function assertMovementTypeAndQuantity(body: unknown): void {
  assertReadableBody(body);
  const type = field(body, 'movement_type');
  if (typeof type !== 'string' || !(DIRECT_MOVEMENT_TYPES as readonly string[]).includes(type)) {
    throw invalidMovementType();
  }
  const quantity = field(body, 'quantity');
  if (
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    (quantity === 0 && type !== 'ajuste')
  ) {
    throw invalidQuantity();
  }
}

function assertTransferQuantity(body: unknown): void {
  assertReadableBody(body);
  const quantity = field(body, 'quantity');
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    throw invalidQuantity();
  }
}

/**
 * Inventario — entidad de **nivel taller** (RF-601 a RF-609).
 *
 * A diferencia de clientes, todo aquí se acota al taller activo: las
 * existencias son físicas y pertenecen a un local. Un repuesto de otro taller
 * de la misma organización no existe desde este (RF-602).
 */
export function createInventoryService({ repo }: InventoryDeps) {
  async function load(ctx: WorkshopContext, partId: string): Promise<PartRow> {
    const part = isUuid(partId) ? await repo.findPart(ctx.orgId, ctx.workshopId, partId) : null;
    if (!part) throw partNotFound();
    return part;
  }

  return {
    /** RF-602; con `lowStock`, solo los que están en o por debajo del mínimo (RF-607). */
    async listParts(
      ctx: WorkshopContext,
      options: { search?: string; lowStock: boolean; includeInactive: boolean },
    ): Promise<PartRow[]> {
      const parts = await repo.listParts(ctx.orgId, ctx.workshopId, {
        search: options.search?.trim() || undefined,
        includeInactive: options.includeInactive,
      });
      // Se filtra aquí porque el filtro de PostgREST no compara dos columnas.
      return options.lowStock ? parts.filter((p) => p.current_stock <= p.minimum_stock) : parts;
    },

    getPart: load,

    /**
     * RF-601, RF-603. Con existencia inicial mayor que cero se genera su
     * movimiento de entrada (RN-12): ninguna existencia aparece sin un
     * movimiento que la explique.
     */
    async createPart(ctx: WorkshopContext, body: unknown): Promise<PartRow> {
      assertCanManageCatalog(ctx);
      const { initial_stock: initialStock, ...input } = parseBody(createPartSchema, body);

      let part: PartRow;
      try {
        part = await repo.insertPart({
          organization_id: ctx.orgId,
          workshop_id: ctx.workshopId,
          part_number: input.part_number,
          name: input.name,
          description: input.description ?? null,
          brand: input.brand ?? null,
          category: input.category ?? null,
          minimum_stock: input.minimum_stock ?? 0,
          maximum_stock: input.maximum_stock ?? null,
          unit_cost: input.unit_cost ?? null,
        });
      } catch (error) {
        return translate(error);
      }

      if (!initialStock) return part;

      try {
        await repo.registerMovement({
          part_id: part.id,
          movement_type: 'compra',
          quantity: initialStock,
          unit_cost: input.unit_cost ?? null,
          reference: 'existencia-inicial',
          notes: 'Existencia inicial del repuesto',
          performed_by: ctx.userId,
        });
      } catch (error) {
        return translate(error);
      }
      return load(ctx, part.id);
    },

    /** RF-601, RF-609: el catálogo, nunca la existencia. */
    async updatePart(ctx: WorkshopContext, partId: string, body: unknown): Promise<PartRow> {
      assertCanManageCatalog(ctx);
      const input = parseBody(updatePartSchema, body);
      const current = await load(ctx, partId);

      // El rango se valida contra el estado resultante: el mínimo o el máximo
      // que no vienen en la petición son los que ya tiene el repuesto.
      const minimum = input.minimum_stock ?? current.minimum_stock;
      const maximum = input.maximum_stock === undefined ? current.maximum_stock : input.maximum_stock;
      if (!stockRangeIsValid(minimum, maximum)) {
        throw invalidBody({ maximum_stock: [STOCK_RANGE_MESSAGE] });
      }

      const part = await repo.updatePart(ctx.orgId, ctx.workshopId, partId, {
        ...input,
        updated_at: new Date().toISOString(),
      });
      if (!part) throw partNotFound();
      return part;
    },

    /** RF-604: historial del repuesto, del más reciente al más antiguo. */
    async listMovements(ctx: WorkshopContext, partId: string): Promise<MovementRow[]> {
      await load(ctx, partId);
      return repo.listMovements(ctx.orgId, ctx.workshopId, partId);
    },

    /**
     * RF-604 a RF-606: cualquier miembro. El cálculo y la actualización de la
     * existencia ocurren en el motor, en una sola transacción (ADR-007).
     */
    async registerMovement(ctx: WorkshopContext, partId: string, body: unknown): Promise<MovementRow> {
      assertMovementTypeAndQuantity(body);
      const input = parseBody(movementSchema, body);
      await load(ctx, partId);
      try {
        return await repo.registerMovement({ ...input, part_id: partId, performed_by: ctx.userId });
      } catch (error) {
        return translate(error);
      }
    },

    /**
     * RF-608, solo Owner (RF-609). Salida en el taller activo y entrada en el
     * de destino, vinculadas y en una sola transacción (RN-13).
     */
    async transfer(ctx: WorkshopContext, partId: string, body: unknown): Promise<MovementRow[]> {
      assertCanTransfer(ctx);
      assertTransferQuantity(body);
      const input = parseBody(transferSchema, body);
      if (input.to_workshop_id === ctx.workshopId) throw RULES['inventory.same_workshop_transfer']!();
      await load(ctx, partId);

      try {
        return await repo.transfer({
          from_part_id: partId,
          to_workshop_id: input.to_workshop_id,
          quantity: input.quantity,
          notes: input.notes ?? null,
          performed_by: ctx.userId,
        });
      } catch (error) {
        return translate(error);
      }
    },
  };
}

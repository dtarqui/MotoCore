import type { SupabaseClient } from '@supabase/supabase-js';
import { fromDb, fromRpc } from '../../lib/db.js';
import { serviceClient } from '../../lib/supabase.js';
import type { DirectMovementType, MovementType } from './inventory.schemas.js';

export interface PartRow {
  id: string;
  organization_id: string;
  workshop_id: string;
  part_number: string;
  name: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number | null;
  unit_cost: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface MovementRow {
  id: string;
  organization_id: string;
  workshop_id: string;
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number | null;
  total_cost: number | null;
  reference: string | null;
  notes: string | null;
  transfer_id: string | null;
  performed_by: string | null;
  created_at: string;
}

type CatalogFields = 'name' | 'description' | 'brand' | 'category' | 'minimum_stock' | 'maximum_stock' | 'unit_cost';

/** La existencia no figura: nace en cero y solo la cambian los movimientos (RN-11, RN-12). */
export type NewPart = Pick<PartRow, 'organization_id' | 'workshop_id' | 'part_number' | CatalogFields>;
export type PartPatch = Partial<Pick<PartRow, CatalogFields>> & { updated_at: string };

export interface NewMovement {
  part_id: string;
  movement_type: DirectMovementType;
  quantity: number;
  unit_cost?: number | null;
  reference?: string | null;
  notes?: string | null;
  performed_by: string;
}

export interface NewTransfer {
  from_part_id: string;
  to_workshop_id: string;
  quantity: number;
  notes?: string | null;
  performed_by: string;
}

/**
 * Inventario del taller activo. Las lecturas y el catálogo van con la
 * credencial de la petición; los movimientos, por las funciones atómicas del
 * motor (ADR-007), que lanzan `RuleViolation` con el código del contrato.
 */
export interface InventoryRepository {
  listParts(
    orgId: string,
    workshopId: string,
    options: { search?: string; includeInactive: boolean },
  ): Promise<PartRow[]>;
  findPart(orgId: string, workshopId: string, partId: string): Promise<PartRow | null>;
  /** Lanza `UniqueViolation` si el número de parte ya existe en el taller. */
  insertPart(part: NewPart): Promise<PartRow>;
  updatePart(orgId: string, workshopId: string, partId: string, patch: PartPatch): Promise<PartRow | null>;
  listMovements(orgId: string, workshopId: string, partId: string): Promise<MovementRow[]>;
  registerMovement(movement: NewMovement): Promise<MovementRow>;
  transfer(transfer: NewTransfer): Promise<MovementRow[]>;
}

const PART_COLUMNS =
  'id, organization_id, workshop_id, part_number, name, description, brand, category, current_stock, minimum_stock, maximum_stock, unit_cost, is_active, created_at, updated_at';

const MOVEMENT_COLUMNS =
  'id, organization_id, workshop_id, part_id, movement_type, quantity, previous_stock, new_stock, unit_cost, total_cost, reference, notes, transfer_id, performed_by, created_at';

/** Reglas que las funciones del motor pueden levantar. Cualquier otro mensaje es `server.error`. */
export const MOVEMENT_RULES = [
  'inventory.part_not_found',
  'inventory.invalid_movement_type',
  'inventory.invalid_quantity',
  'inventory.insufficient_stock',
] as const;

export const TRANSFER_RULES = [
  ...MOVEMENT_RULES,
  'inventory.cross_organization_transfer',
  'inventory.same_workshop_transfer',
] as const;

/** Mismo criterio que en clientes: el valor se entrecomilla para no alterar la sintaxis del filtro. */
function ilikeValue(search: string): string {
  return `"%${search.replace(/["\\]/g, '\\$&')}%"`;
}

export function supabaseInventoryRepository(db: SupabaseClient): InventoryRepository {
  return {
    async listParts(orgId, workshopId, { search, includeInactive }) {
      let query = db.from('mt_parts').select(PART_COLUMNS).eq('organization_id', orgId).eq('workshop_id', workshopId);
      if (!includeInactive) query = query.eq('is_active', true);
      if (search) {
        const like = ilikeValue(search);
        query = query.or(`name.ilike.${like},part_number.ilike.${like},brand.ilike.${like}`);
      }

      const { data, error } = await query.order('name');
      if (error) throw fromDb('parts.select', error);
      return (data ?? []) as PartRow[];
    },

    async findPart(orgId, workshopId, partId) {
      const { data, error } = await db
        .from('mt_parts')
        .select(PART_COLUMNS)
        .eq('organization_id', orgId)
        .eq('workshop_id', workshopId)
        .eq('id', partId)
        .maybeSingle();
      if (error) throw fromDb('parts.select', error);
      return (data as PartRow | null) ?? null;
    },

    async insertPart(part) {
      const { data, error } = await db.from('mt_parts').insert(part).select(PART_COLUMNS).single();
      if (error) throw fromDb('parts.insert', error);
      return data as PartRow;
    },

    async updatePart(orgId, workshopId, partId, patch) {
      const { data, error } = await db
        .from('mt_parts')
        .update(patch)
        .eq('organization_id', orgId)
        .eq('workshop_id', workshopId)
        .eq('id', partId)
        .select(PART_COLUMNS)
        .maybeSingle();
      if (error) throw fromDb('parts.update', error);
      return (data as PartRow | null) ?? null;
    },

    async listMovements(orgId, workshopId, partId) {
      const { data, error } = await db
        .from('mt_part_movements')
        .select(MOVEMENT_COLUMNS)
        .eq('organization_id', orgId)
        .eq('workshop_id', workshopId)
        .eq('part_id', partId)
        .order('created_at', { ascending: false });
      if (error) throw fromDb('part_movements.select', error);
      return (data ?? []) as MovementRow[];
    },

    async registerMovement(movement) {
      // Excepción 6 de ADR-008: la función está concedida solo al servidor.
      const { data, error } = await serviceClient('inventory-atomic').rpc('mt_register_part_movement', {
        p_part_id: movement.part_id,
        p_movement_type: movement.movement_type,
        p_quantity: movement.quantity,
        p_unit_cost: movement.unit_cost ?? null,
        p_reference: movement.reference ?? null,
        p_notes: movement.notes ?? null,
        p_performed_by: movement.performed_by,
      });
      if (error) throw fromRpc('mt_register_part_movement', error, MOVEMENT_RULES);
      return data as MovementRow;
    },

    async transfer(transfer) {
      const { data, error } = await serviceClient('inventory-atomic').rpc('mt_transfer_stock', {
        p_from_part_id: transfer.from_part_id,
        p_to_workshop_id: transfer.to_workshop_id,
        p_quantity: transfer.quantity,
        p_notes: transfer.notes ?? null,
        p_performed_by: transfer.performed_by,
      });
      if (error) throw fromRpc('mt_transfer_stock', error, TRANSFER_RULES);
      return (data ?? []) as MovementRow[];
    },
  };
}

import type { SupabaseClient } from '@supabase/supabase-js';
import { fromDb } from '../../lib/db.js';
import type { Role } from '../../types.js';

export interface WorkshopRow {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface AssignmentRow {
  id: string;
  organization_id: string;
  workshop_id: string;
  user_id: string;
  role: Role;
  /** Estado de la membresía: una asignación de alguien removido se conserva como historial. */
  is_active: boolean;
  created_at: string;
}

export interface MembershipRef {
  id: string;
  is_active: boolean;
}

export type NewWorkshop = Pick<WorkshopRow, 'organization_id' | 'name' | 'address' | 'phone'>;
export type WorkshopPatch = Partial<Pick<WorkshopRow, 'name' | 'address' | 'phone' | 'is_active'>> & {
  updated_at: string;
};

/** Talleres y asignaciones con la credencial de la petición. Todas las lecturas se acotan a la organización. */
export interface WorkshopsRepository {
  list(orgId: string, options: { includeInactive: boolean }): Promise<WorkshopRow[]>;
  findById(orgId: string, workshopId: string): Promise<WorkshopRow | null>;
  /** Lanza `UniqueViolation` si el nombre ya existe en la organización. */
  insert(workshop: NewWorkshop): Promise<WorkshopRow>;
  /** Lanza `UniqueViolation` si el nombre ya existe en la organización. */
  update(orgId: string, workshopId: string, patch: WorkshopPatch): Promise<WorkshopRow | null>;
  findMembership(orgId: string, userId: string): Promise<MembershipRef | null>;
  listAssignments(orgId: string, workshopId: string): Promise<AssignmentRow[]>;
  findAssignment(orgId: string, workshopId: string, userId: string): Promise<AssignmentRow | null>;
  insertAssignment(orgId: string, workshopId: string, membershipId: string): Promise<void>;
  deleteAssignment(orgId: string, workshopId: string, membershipId: string): Promise<void>;
}

const WORKSHOP_COLUMNS = 'id, organization_id, name, address, phone, is_active, created_at, updated_at';

export function supabaseWorkshopsRepository(db: SupabaseClient): WorkshopsRepository {
  async function findMembership(orgId: string, userId: string): Promise<MembershipRef | null> {
    const { data, error } = await db
      .from('mt_memberships')
      .select('id, is_active')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw fromDb('memberships.select', error);
    return (data as MembershipRef | null) ?? null;
  }

  async function assignments(orgId: string, workshopId: string, membershipId?: string): Promise<AssignmentRow[]> {
    let query = db
      .from('mt_workshop_assignments')
      .select('id, organization_id, workshop_id, membership_id, created_at')
      .eq('organization_id', orgId)
      .eq('workshop_id', workshopId);
    if (membershipId) query = query.eq('membership_id', membershipId);

    const { data, error } = await query.order('created_at');
    if (error) throw fromDb('workshop_assignments.select', error);

    const rows = (data ?? []) as Array<{
      id: string;
      organization_id: string;
      workshop_id: string;
      membership_id: string;
      created_at: string;
    }>;
    if (rows.length === 0) return [];

    const { data: memberships, error: memErr } = await db
      .from('mt_memberships')
      .select('id, user_id, role, is_active')
      .eq('organization_id', orgId)
      .in(
        'id',
        rows.map((r) => r.membership_id),
      );
    if (memErr) throw fromDb('memberships.select', memErr);

    const byId = new Map(
      ((memberships ?? []) as Array<{ id: string; user_id: string; role: Role; is_active: boolean }>).map((m) => [
        m.id,
        m,
      ]),
    );

    return rows.flatMap((r) => {
      const m = byId.get(r.membership_id);
      if (!m) return [];
      return [
        {
          id: r.id,
          organization_id: r.organization_id,
          workshop_id: r.workshop_id,
          user_id: m.user_id,
          role: m.role,
          is_active: m.is_active,
          created_at: r.created_at,
        },
      ];
    });
  }

  return {
    async list(orgId, { includeInactive }) {
      let query = db.from('mt_workshops').select(WORKSHOP_COLUMNS).eq('organization_id', orgId);
      if (!includeInactive) query = query.eq('is_active', true);

      const { data, error } = await query.order('name');
      if (error) throw fromDb('workshops.select', error);
      return (data ?? []) as WorkshopRow[];
    },

    async findById(orgId, workshopId) {
      const { data, error } = await db
        .from('mt_workshops')
        .select(WORKSHOP_COLUMNS)
        .eq('organization_id', orgId)
        .eq('id', workshopId)
        .maybeSingle();
      if (error) throw fromDb('workshops.select', error);
      return (data as WorkshopRow | null) ?? null;
    },

    async insert(workshop) {
      const { data, error } = await db.from('mt_workshops').insert(workshop).select(WORKSHOP_COLUMNS).single();
      if (error) throw fromDb('workshops.insert', error);
      return data as WorkshopRow;
    },

    async update(orgId, workshopId, patch) {
      const { data, error } = await db
        .from('mt_workshops')
        .update(patch)
        .eq('organization_id', orgId)
        .eq('id', workshopId)
        .select(WORKSHOP_COLUMNS)
        .maybeSingle();
      if (error) throw fromDb('workshops.update', error);
      return (data as WorkshopRow | null) ?? null;
    },

    findMembership,

    listAssignments: (orgId, workshopId) => assignments(orgId, workshopId),

    async findAssignment(orgId, workshopId, userId) {
      const membership = await findMembership(orgId, userId);
      if (!membership) return null;
      const [row] = await assignments(orgId, workshopId, membership.id);
      return row ?? null;
    },

    async insertAssignment(orgId, workshopId, membershipId) {
      const { error } = await db
        .from('mt_workshop_assignments')
        .insert({ organization_id: orgId, workshop_id: workshopId, membership_id: membershipId });
      if (error) throw fromDb('workshop_assignments.insert', error);
    },

    async deleteAssignment(orgId, workshopId, membershipId) {
      const { error } = await db
        .from('mt_workshop_assignments')
        .delete()
        .eq('organization_id', orgId)
        .eq('workshop_id', workshopId)
        .eq('membership_id', membershipId);
      if (error) throw fromDb('workshop_assignments.delete', error);
    },
  };
}

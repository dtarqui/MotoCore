import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditAction } from '../../lib/audit.js';
import { fromDb } from '../../lib/db.js';
import { internal } from '../../lib/errors.js';
import { serviceClient } from '../../lib/supabase.js';

export interface AuditRow {
  id: string;
  organization_id: string;
  workshop_id: string | null;
  performed_by: string | null;
  action: AuditAction;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface AuthorProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuditRepository {
  list(orgId: string, filters: { action?: AuditAction; workshopId?: string; limit: number }): Promise<AuditRow[]>;
  profiles(userIds: string[]): Promise<AuthorProfile[]>;
}

const AUDIT_COLUMNS = 'id, organization_id, workshop_id, performed_by, action, entity, entity_id, details, created_at';

export function supabaseAuditRepository(db: SupabaseClient): AuditRepository {
  return {
    async list(orgId, { action, workshopId, limit }) {
      // Con la credencial de la petición: la política de `mt_audit_log` vuelve a
      // exigir el rol en el motor, de modo que la reserva al Owner no depende
      // solo del servicio (RF-704).
      let query = db
        .from('mt_audit_log')
        .select(AUDIT_COLUMNS)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (action) query = query.eq('action', action);
      if (workshopId) query = query.eq('workshop_id', workshopId);

      const { data, error } = await query;
      if (error) throw fromDb('audit_log.select', error);
      return (data ?? []) as AuditRow[];
    },

    async profiles(userIds) {
      if (userIds.length === 0) return [];
      // Excepción 4: perfiles de otras cuentas de la organización.
      const { data, error } = await serviceClient('member-profiles')
        .from('mt_profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);
      if (error) throw internal(`profiles.select: ${error.message}`);
      return (data ?? []) as AuthorProfile[];
    },
  };
}

import type { SupabaseClient } from '@supabase/supabase-js';
import { fromDb } from '../../lib/db.js';

export interface ClientRow {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  document_id: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

type ContactFields = 'first_name' | 'last_name' | 'email' | 'phone' | 'document_id' | 'address' | 'notes';

export type NewClient = Pick<ClientRow, 'organization_id' | ContactFields>;
export type ClientPatch = Partial<Pick<ClientRow, ContactFields | 'is_active'>> & { updated_at: string };

/** Clientes con la credencial de la petición. Nivel organización: ninguna operación mira el taller. */
export interface ClientsRepository {
  list(orgId: string, options: { search?: string; includeInactive: boolean }): Promise<ClientRow[]>;
  findById(orgId: string, clientId: string): Promise<ClientRow | null>;
  /** Lanza `UniqueViolation` si el correo ya existe en la organización. */
  insert(client: NewClient): Promise<ClientRow>;
  /** Lanza `UniqueViolation` si el correo ya existe en la organización. */
  update(orgId: string, clientId: string, patch: ClientPatch): Promise<ClientRow | null>;
}

const CLIENT_COLUMNS =
  'id, organization_id, first_name, last_name, email, phone, document_id, address, notes, is_active, created_at, updated_at';

/**
 * Valor para un filtro `or` de PostgREST. Se entrecomilla porque la coma, el
 * punto y los paréntesis son sintaxis del filtro: sin comillas, una búsqueda
 * que los contuviera alteraría la consulta en lugar de buscarse literalmente.
 */
export function ilikeValue(search: string): string {
  return `"%${search.replace(/["\\]/g, '\\$&')}%"`;
}

export function supabaseClientsRepository(db: SupabaseClient): ClientsRepository {
  return {
    async list(orgId, { search, includeInactive }) {
      let query = db.from('mt_clients').select(CLIENT_COLUMNS).eq('organization_id', orgId);
      if (!includeInactive) query = query.eq('is_active', true);
      if (search) {
        const like = ilikeValue(search);
        query = query.or(
          `first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},document_id.ilike.${like}`,
        );
      }

      const { data, error } = await query.order('last_name').order('first_name');
      if (error) throw fromDb('clients.select', error);
      return (data ?? []) as ClientRow[];
    },

    async findById(orgId, clientId) {
      const { data, error } = await db
        .from('mt_clients')
        .select(CLIENT_COLUMNS)
        .eq('organization_id', orgId)
        .eq('id', clientId)
        .maybeSingle();
      if (error) throw fromDb('clients.select', error);
      return (data as ClientRow | null) ?? null;
    },

    async insert(client) {
      const { data, error } = await db.from('mt_clients').insert(client).select(CLIENT_COLUMNS).single();
      if (error) throw fromDb('clients.insert', error);
      return data as ClientRow;
    },

    async update(orgId, clientId, patch) {
      const { data, error } = await db
        .from('mt_clients')
        .update(patch)
        .eq('organization_id', orgId)
        .eq('id', clientId)
        .select(CLIENT_COLUMNS)
        .maybeSingle();
      if (error) throw fromDb('clients.update', error);
      return (data as ClientRow | null) ?? null;
    },
  };
}

import type { SupabaseClient } from '@supabase/supabase-js';

export type Role = 'owner' | 'mechanic' | 'receptionist';

export const ROLES: readonly Role[] = ['owner', 'mechanic', 'receptionist'];

/** Variables que la autenticacion deja en el contexto de Hono. */
export interface AuthedVars {
  userId: string;
  userEmail: string;
  userToken: string;
  /**
   * Cliente de datos de la peticion, atado a la credencial de quien llama, de
   * modo que las politicas RLS se evaluen sobre su identidad (ADR-002).
   *
   * Es el que deben usar los handlers para leer y escribir datos de negocio.
   * Las siete excepciones que exigen clave de servicio estan enumeradas en
   * `lib/supabase.ts`.
   */
  db: SupabaseClient;
}

export type AppBindings = { Variables: AuthedVars };

export interface Membership {
  organization_id: string;
  user_id: string;
  role: Role;
  is_active: boolean;
}

/** Taller: subdivision operativa de la organizacion, no unidad de aislamiento (ADR-006). */
export interface Workshop {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

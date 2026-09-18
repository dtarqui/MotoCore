import type { SupabaseClient } from '@supabase/supabase-js';

export const ROLES = ['owner', 'mechanic', 'receptionist'] as const;
export type Role = (typeof ROLES)[number];

/** Identidad verificada de quien llama. El servidor la verifica, no la emite (ADR-004). */
export interface Identity {
  userId: string;
  email: string;
}

/**
 * Contexto activo ya validado: la organización declarada en `X-Org-Id` y el rol
 * que el solicitante tiene en ella (ADR-005). Solo existe si la membresía está
 * activa.
 */
export interface OrgContext {
  userId: string;
  orgId: string;
  role: Role;
}

/** Contexto de nivel taller: además, el taller de `X-Workshop-Id`, validado como de la organización. */
export interface WorkshopContext extends OrgContext {
  workshopId: string;
}

/**
 * Variables que deja la autenticación.
 *
 * `db` es el cliente de datos **de la petición**, atado a la credencial de quien
 * llama, de modo que las políticas se evalúen sobre su identidad (ADR-008). Se
 * construye una sola vez por petición.
 */
export type AuthEnv = { Variables: { identity: Identity; db: SupabaseClient } };
export type OrgEnv = { Variables: AuthEnv['Variables'] & { ctx: OrgContext } };
export type WorkshopEnv = { Variables: AuthEnv['Variables'] & { ctx: WorkshopContext } };

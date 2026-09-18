import type { SupabaseClient } from '@supabase/supabase-js';
import type { MembershipState } from '../../src/lib/access.js';
import type { Platform } from '../../src/platform.js';
import { ORG, OTHER_ORG, OTHER_WORKSHOP, OWNER, WORKSHOP } from './fixtures.js';

/** Credenciales que la plataforma simulada reconoce, con la cuenta a la que corresponden. */
export const TOKENS = {
  owner: 'token-owner',
  mechanic: 'token-mechanic',
  stranger: 'token-stranger',
} as const;

/**
 * Cliente de datos que no se puede usar. Si una prueba de contrato llega a la
 * base, falla con un mensaje explícito en lugar de intentar una conexión: N2
 * verifica la interfaz **antes** de tocar la base (Plan de pruebas, §1.2).
 */
const untouchableDb = new Proxy({} as SupabaseClient, {
  get() {
    throw new Error('N2 no debe tocar la base de datos: la petición llegó al repositorio.');
  },
});

/**
 * Plataforma para N2: la organización `ORG` tiene a la dueña y a un mecánico, y
 * sus talleres son `WORKSHOP` y `OTHER_WORKSHOP`; `OTHER_ORG` es ajena a todos.
 */
export function contractPlatform(overrides: Partial<Platform> = {}): Partial<Platform> {
  const memberships: Record<string, Record<string, MembershipState>> = {
    [ORG]: {
      [OWNER]: { role: 'owner', is_active: true },
      'user-mechanic': { role: 'mechanic', is_active: true },
    },
  };
  const workshops: Record<string, string> = { [WORKSHOP]: ORG, [OTHER_WORKSHOP]: ORG, 'ajeno-0000': OTHER_ORG };

  return {
    async verifyToken(token) {
      if (token === TOKENS.owner) return { userId: OWNER, email: 'duena@correo.bo' };
      if (token === TOKENS.mechanic) return { userId: 'user-mechanic', email: 'mecanico@correo.bo' };
      if (token === TOKENS.stranger) return { userId: 'user-stranger', email: 'ajeno@correo.bo' };
      return null;
    },
    requestClient: () => untouchableDb,
    async findMembership(orgId, userId) {
      return memberships[orgId]?.[userId] ?? null;
    },
    async findWorkshopOrganization(workshopId) {
      return workshops[workshopId] ?? null;
    },
    accounts: {
      create: async () => {
        throw new Error('N2 no debe crear cuentas.');
      },
      remove: async () => undefined,
    },
    ...overrides,
  };
}

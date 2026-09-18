import { z } from 'zod';

/**
 * Roles que se pueden conceder. `owner` no figura: el Owner es quien crea la
 * organización, y no se invita ni se asciende a él (RF-402, RN-03).
 */
export const ASSIGNABLE_ROLES = ['mechanic', 'receptionist'] as const;

export const inviteMemberSchema = z.object({
  email: z.string().trim().email('Correo inválido.').max(254),
  role: z.enum(ASSIGNABLE_ROLES),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

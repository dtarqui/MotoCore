import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  organizationName: z.string().trim().min(1).max(150),
});
export type RegisterInput = z.infer<typeof registerSchema>;

const orgFields = {
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional(),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().email().optional(),
};

export const createOrganizationSchema = z.object(orgFields);
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  // No se puede invitar como 'owner': el Owner se define al crear la organizacion.
  role: z.enum(['mechanic', 'receptionist']),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(['mechanic', 'receptionist']),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

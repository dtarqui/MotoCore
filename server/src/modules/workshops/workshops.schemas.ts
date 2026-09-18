import { z } from 'zod';
import { AT_LEAST_ONE_FIELD, atLeastOneField, optionalText, requiredText } from '../../lib/validation.js';

const fields = {
  name: requiredText(150),
  address: optionalText(300),
  phone: optionalText(50),
};

/** RF-301 y HU-06: nombre, dirección y teléfono. */
export const createWorkshopSchema = z.object(fields);
export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;

export const updateWorkshopSchema = z
  .object({ ...fields, name: fields.name.optional() })
  .refine(atLeastOneField, AT_LEAST_ONE_FIELD);
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;

/** RF-304: asignación operativa de un miembro a un taller. No altera permisos. */
export const assignMemberSchema = z.object({
  user_id: z.string().uuid('Identificador de cuenta inválido.'),
});
export type AssignMemberInput = z.infer<typeof assignMemberSchema>;

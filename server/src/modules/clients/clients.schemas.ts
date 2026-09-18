import { z } from 'zod';
import {
  AT_LEAST_ONE_FIELD,
  atLeastOneField,
  optionalEmail,
  optionalText,
  requiredText,
} from '../../lib/validation.js';

/** Datos de contacto mínimos: nombre, correo y teléfono (Requisitos, sección 5). */
const fields = {
  first_name: requiredText(100),
  last_name: requiredText(100),
  email: optionalEmail(),
  phone: optionalText(50),
  document_id: optionalText(50),
  address: optionalText(300),
  notes: optionalText(1000),
};

/** RF-501. */
export const createClientSchema = z.object(fields);
export type CreateClientInput = z.infer<typeof createClientSchema>;

/** RF-504. `null` borra un dato opcional; omitirlo lo deja como estaba. */
export const updateClientSchema = z
  .object({ ...fields, first_name: fields.first_name.optional(), last_name: fields.last_name.optional() })
  .refine(atLeastOneField, AT_LEAST_ONE_FIELD);
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

import { z } from 'zod';
import {
  AT_LEAST_ONE_FIELD,
  atLeastOneField,
  optionalEmail,
  optionalText,
  requiredText,
} from '../../lib/validation.js';

const fields = {
  name: requiredText(150),
  description: optionalText(1000),
  address: optionalText(300),
  phone: optionalText(50),
  email: optionalEmail(),
};

/** RF-201: crear una organización adicional. */
export const createOrganizationSchema = z.object(fields);
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/** RF-204: el Owner edita su organización. Al menos un campo debe venir. */
export const updateOrganizationSchema = z
  .object({ ...fields, name: fields.name.optional() })
  .refine(atLeastOneField, AT_LEAST_ONE_FIELD);
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

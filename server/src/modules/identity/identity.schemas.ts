import { z } from 'zod';
import { requiredText } from '../../lib/validation.js';

/**
 * RF-101. La contraseña se valida aquí, antes de crear nada (HU-01), y nunca se
 * persiste en el sistema (RNF-104). El tope de 72 es el del algoritmo con que
 * el proveedor la resume: más allá, los caracteres se ignorarían sin aviso.
 */
export const registerSchema = z.object({
  email: z.string().trim().email('Correo inválido.').max(254),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña no puede superar los 72 caracteres.'),
  first_name: requiredText(100),
  last_name: requiredText(100),
  organization_name: requiredText(150),
  /** Nombre del primer taller. Si no se indica, toma el de la organización: el negocio de un solo local. */
  workshop_name: requiredText(150).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

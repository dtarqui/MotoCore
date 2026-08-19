import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  organizationName: z.string().trim().min(1).max(150),
  // RF-101: el registro crea tambien el primer taller. Si no se indica
  // nombre, toma el de la organizacion — el caso del negocio de un solo local.
  workshopName: z.string().trim().min(1).max(150).optional(),
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

/** RF-204: el Owner edita su organizacion. Al menos un campo debe venir. */
export const updateOrganizationSchema = z
  .object({ ...orgFields, name: orgFields.name.optional() })
  .refine((v) => Object.keys(v).length > 0, 'Debe indicar al menos un campo a modificar.');
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

const workshopFields = {
  name: z.string().trim().min(1).max(150),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(50).optional(),
};

export const createWorkshopSchema = z.object(workshopFields);
export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;

export const updateWorkshopSchema = z
  .object({ ...workshopFields, name: workshopFields.name.optional() })
  .refine((v) => Object.keys(v).length > 0, 'Debe indicar al menos un campo a modificar.');
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;

/** RF-304: asignacion operativa de un miembro a un taller. No altera permisos. */
export const assignMemberSchema = z.object({
  userId: z.string().uuid(),
});
export type AssignMemberInput = z.infer<typeof assignMemberSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  // No se puede invitar como 'owner': el Owner se define al crear la organizacion (RF-402).
  role: z.enum(['mechanic', 'receptionist']),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(['mechanic', 'receptionist']),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// ------------------------------------------------------------------
// Clientes — nivel organizacion (RF-501..505)
// ------------------------------------------------------------------
const clientFields = {
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  documentId: z.string().trim().max(50).optional(),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(1000).optional(),
};

export const createClientSchema = z.object(clientFields);
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = z
  .object({
    ...clientFields,
    firstName: clientFields.firstName.optional(),
    lastName: clientFields.lastName.optional(),
    // Nullable para poder borrar un dato opcional, no solo cambiarlo.
    email: clientFields.email.nullable().optional(),
    phone: clientFields.phone.nullable().optional(),
    documentId: clientFields.documentId.nullable().optional(),
    address: clientFields.address.nullable().optional(),
    notes: clientFields.notes.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Debe indicar al menos un campo a modificar.');
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ------------------------------------------------------------------
// Inventario — nivel taller (RF-601..609)
// ------------------------------------------------------------------

/**
 * Los seis tipos de movimiento que persiste el historial. `adjustment` fija un
 * valor absoluto; el resto suma o resta (RF-605).
 */
export const MOVEMENT_TYPES = ['purchase', 'sale', 'adjustment', 'return', 'transfer', 'damaged'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

/**
 * Tipos que el usuario puede registrar DIRECTAMENTE (RF-604).
 *
 * `transfer` queda fuera a proposito: no se registra a mano, lo genera la
 * transferencia entre talleres (RF-608) como par de movimientos vinculados.
 * Admitirlo aqui permitiria inventar una entrada sin la salida que la explica,
 * y la existencia dejaria de poder reconstruirse desde su historial.
 */
export const DIRECT_MOVEMENT_TYPES = MOVEMENT_TYPES.filter((t) => t !== 'transfer') as readonly MovementType[];

const partFields = {
  partNumber: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  brand: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  minimumStock: z.number().int().min(0).optional(),
  maximumStock: z.number().int().min(0).optional(),
  unitCost: z.number().min(0).optional(),
};

export const createPartSchema = z
  .object({ ...partFields, initialStock: z.number().int().min(0).optional() })
  .refine(
    (v) => v.maximumStock === undefined || v.maximumStock >= (v.minimumStock ?? 0),
    { message: 'El maximo no puede ser menor que el minimo.', path: ['maximumStock'] },
  );
export type CreatePartInput = z.infer<typeof createPartSchema>;

/** El numero de parte no se edita: identifica la pieza dentro del taller. */
export const updatePartSchema = z
  .object({
    name: partFields.name.optional(),
    description: partFields.description.nullable().optional(),
    brand: partFields.brand.nullable().optional(),
    category: partFields.category.nullable().optional(),
    minimumStock: partFields.minimumStock,
    maximumStock: partFields.maximumStock.nullable(),
    unitCost: partFields.unitCost.nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Debe indicar al menos un campo a modificar.');
export type UpdatePartInput = z.infer<typeof updatePartSchema>;

export const movementSchema = z.object({
  movementType: z.enum(['purchase', 'sale', 'adjustment', 'return', 'damaged'], {
    message: 'inventory.invalid_movement_type',
  }),
  quantity: z.number().int().min(0),
  unitCost: z.number().min(0).optional(),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type MovementInput = z.infer<typeof movementSchema>;

/** RF-608: transferencia entre talleres de la misma organizacion. */
export const transferSchema = z.object({
  toWorkshopId: z.string().uuid(),
  toPartId: z.string().uuid(),
  quantity: z.number().int().positive(),
});
export type TransferInput = z.infer<typeof transferSchema>;

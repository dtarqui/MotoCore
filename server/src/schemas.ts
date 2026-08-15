import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  organizationName: z.string().trim().min(1).max(150),
  // RF-101: el registro crea tambien la primera sucursal. Si no se indica
  // nombre, toma el de la empresa — el caso del taller de un solo local.
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

/** RF-204: el Owner edita su empresa. Al menos un campo debe venir. */
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

/** RF-304: asignacion operativa de un miembro a una sucursal. No altera permisos. */
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
// Clientes — nivel empresa (RF-501..505)
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
// Inventario — nivel sucursal (RF-601..608)
// ------------------------------------------------------------------

/** RF-604: los seis tipos de movimiento. `adjustment` fija un valor absoluto. */
export const MOVEMENT_TYPES = ['purchase', 'sale', 'adjustment', 'return', 'transfer', 'damaged'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

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

/** El numero de parte no se edita: identifica la pieza dentro de la sucursal. */
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
  movementType: z.enum(MOVEMENT_TYPES),
  quantity: z.number().int().min(0),
  unitCost: z.number().min(0).optional(),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type MovementInput = z.infer<typeof movementSchema>;

/** RF-608: transferencia entre sucursales de la misma empresa. */
export const transferSchema = z.object({
  toWorkshopId: z.string().uuid(),
  toPartId: z.string().uuid(),
  quantity: z.number().int().positive(),
});
export type TransferInput = z.infer<typeof transferSchema>;

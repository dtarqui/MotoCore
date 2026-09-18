import { z } from 'zod';
import { AT_LEAST_ONE_FIELD, atLeastOneField, optionalText, requiredText } from '../../lib/validation.js';

/**
 * Los seis tipos que persiste el historial. `ajuste` fija un valor absoluto;
 * `compra` y `devolucion` suman; `venta` y `merma` restan (RN-09).
 */
export const MOVEMENT_TYPES = ['compra', 'venta', 'ajuste', 'devolucion', 'merma', 'transferencia'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

/**
 * Tipos registrables DIRECTAMENTE (RF-604). `transferencia` queda fuera: la
 * genera la transferencia entre talleres (RF-608) como par de movimientos
 * vinculados. Admitirla aquí permitiría una entrada sin la salida que la
 * explica, y la existencia dejaría de poder reconstruirse desde su historial.
 */
export const DIRECT_MOVEMENT_TYPES = ['compra', 'venta', 'ajuste', 'devolucion', 'merma'] as const;
export type DirectMovementType = (typeof DIRECT_MOVEMENT_TYPES)[number];

const stock = () =>
  z.number({ invalid_type_error: 'Debe ser un número entero.' }).int('Debe ser un número entero.').min(0);
const money = () => z.number({ invalid_type_error: 'Debe ser un número.' }).min(0);

const catalog = {
  name: requiredText(200),
  description: optionalText(1000),
  brand: optionalText(100),
  category: optionalText(100),
  minimum_stock: stock().optional(),
  maximum_stock: stock().nullable().optional(),
  unit_cost: money().nullable().optional(),
};

/** El máximo, si se declara, no queda por debajo del mínimo. */
export const stockRangeIsValid = (minimum: number, maximum: number | null) => maximum === null || maximum >= minimum;
export const STOCK_RANGE_MESSAGE = 'El máximo no puede ser menor que el mínimo.';

/**
 * RF-601. `initial_stock` no es un campo del repuesto: si es mayor que cero,
 * genera su movimiento de entrada (RN-12).
 */
export const createPartSchema = z
  .object({
    part_number: requiredText(100),
    ...catalog,
    initial_stock: stock().optional(),
  })
  .refine((v) => stockRangeIsValid(v.minimum_stock ?? 0, v.maximum_stock ?? null), {
    message: STOCK_RANGE_MESSAGE,
    path: ['maximum_stock'],
  });
export type CreatePartInput = z.infer<typeof createPartSchema>;

/**
 * RF-601, RF-609: modifica el catálogo, **nunca la existencia**. El número de
 * parte tampoco se edita: identifica la pieza dentro del taller.
 */
export const updatePartSchema = z
  .object({ ...catalog, name: catalog.name.optional() })
  .refine(atLeastOneField, AT_LEAST_ONE_FIELD);
export type UpdatePartInput = z.infer<typeof updatePartSchema>;

/**
 * RF-604. El tipo y la cantidad se validan antes que este esquema, con sus
 * códigos propios del contrato (`inventory.invalid_movement_type` e
 * `inventory.invalid_quantity`); aquí quedan los campos accesorios.
 */
export const movementSchema = z.object({
  movement_type: z.enum(DIRECT_MOVEMENT_TYPES),
  quantity: z.number().int().min(0),
  unit_cost: money().nullable().optional(),
  reference: optionalText(100),
  notes: optionalText(1000),
});
export type MovementInput = z.infer<typeof movementSchema>;

/** RF-608: el destino es un taller de la organización activa; el repuesto, el de igual número de parte. */
export const transferSchema = z.object({
  to_workshop_id: z.string().uuid('Identificador de taller inválido.'),
  quantity: z.number().int().positive(),
  notes: optionalText(1000),
});
export type TransferInput = z.infer<typeof transferSchema>;

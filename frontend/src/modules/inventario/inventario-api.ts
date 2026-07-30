import { apiRequest, toNullable } from "@/shared/lib/api-client";
import type {
  CreatePartMovementPayload,
  CreatePartPayload,
  Part,
  PartMovement,
  UpdatePartPayload,
} from "./types";

export function getParts(accessToken: string) {
  return apiRequest<Part[]>("/api/inventory/parts", accessToken);
}

export function getLowStockParts(accessToken: string) {
  return apiRequest<Part[]>("/api/inventory/low-stock", accessToken);
}

export function createPart(payload: CreatePartPayload, accessToken: string) {
  return apiRequest<Part>("/api/inventory/parts", accessToken, {
    method: "POST",
    body: JSON.stringify({
      partNumber: payload.partNumber.trim(),
      name: payload.name.trim(),
      description: toNullable(payload.description),
      brand: toNullable(payload.brand),
      category: toNullable(payload.category),
      initialStock: payload.initialStock,
      minimumStock: payload.minimumStock,
      maximumStock: payload.maximumStock,
      unitCost: payload.unitCost,
      salePrice: payload.salePrice,
      location: toNullable(payload.location),
      supplierName: toNullable(payload.supplierName),
      supplierContact: toNullable(payload.supplierContact),
      notes: toNullable(payload.notes),
    }),
  });
}

export function updatePart(
  partId: string,
  payload: UpdatePartPayload,
  accessToken: string,
) {
  return apiRequest<Part>(`/api/inventory/parts/${partId}`, accessToken, {
    method: "PUT",
    body: JSON.stringify({
      name: payload.name.trim(),
      description: toNullable(payload.description),
      brand: toNullable(payload.brand),
      category: toNullable(payload.category),
      minimumStock: payload.minimumStock,
      maximumStock: payload.maximumStock,
      unitCost: payload.unitCost,
      salePrice: payload.salePrice,
      location: toNullable(payload.location),
      supplierName: toNullable(payload.supplierName),
      supplierContact: toNullable(payload.supplierContact),
      notes: toNullable(payload.notes),
    }),
  });
}

export function deletePart(partId: string, accessToken: string) {
  return apiRequest<void>(`/api/inventory/parts/${partId}`, accessToken, {
    method: "DELETE",
  });
}

export function getMovements(accessToken: string) {
  return apiRequest<PartMovement[]>("/api/inventory/movements", accessToken);
}

export function createMovement(
  payload: CreatePartMovementPayload,
  accessToken: string,
) {
  return apiRequest<PartMovement>("/api/inventory/movements", accessToken, {
    method: "POST",
    body: JSON.stringify({
      partId: payload.partId,
      movementType: payload.movementType,
      quantity: payload.quantity,
      unitCost: payload.unitCost ?? null,
      reference: toNullable(payload.reference),
      notes: toNullable(payload.notes),
    }),
  });
}

import { apiRequest, toNullable } from "@/shared/lib/api-client";
import type { Motorcycle, MotorcycleUpsertPayload } from "./types";

function normalizeCreatePayload(payload: MotorcycleUpsertPayload) {
  return {
    clientId: payload.clientId,
    brand: payload.brand.trim(),
    model: payload.model.trim(),
    year: payload.year,
    licensePlate: payload.licensePlate.trim().toUpperCase(),
    vin: toNullable(payload.vin),
    color: toNullable(payload.color),
    mileage: payload.mileage ?? null,
    engineSize: toNullable(payload.engineSize),
    notes: toNullable(payload.notes),
  };
}

function normalizeUpdatePayload(payload: MotorcycleUpsertPayload) {
  return {
    brand: payload.brand.trim(),
    model: payload.model.trim(),
    year: payload.year,
    licensePlate: payload.licensePlate.trim().toUpperCase(),
    vin: toNullable(payload.vin),
    color: toNullable(payload.color),
    mileage: payload.mileage ?? null,
    engineSize: toNullable(payload.engineSize),
    notes: toNullable(payload.notes),
  };
}

export function getMotorcycles(accessToken: string) {
  return apiRequest<Motorcycle[]>("/api/motorcycles", accessToken);
}

export function getMotorcyclesByClient(clientId: string, accessToken: string) {
  return apiRequest<Motorcycle[]>(
    `/api/motorcycles/by-client/${clientId}`,
    accessToken,
  );
}

export function createMotorcycle(
  payload: MotorcycleUpsertPayload,
  accessToken: string,
) {
  return apiRequest<Motorcycle>("/api/motorcycles", accessToken, {
    method: "POST",
    body: JSON.stringify(normalizeCreatePayload(payload)),
  });
}

export function updateMotorcycle(
  motorcycleId: string,
  payload: MotorcycleUpsertPayload,
  accessToken: string,
) {
  return apiRequest<Motorcycle>(`/api/motorcycles/${motorcycleId}`, accessToken, {
    method: "PUT",
    body: JSON.stringify(normalizeUpdatePayload(payload)),
  });
}

export function deleteMotorcycle(motorcycleId: string, accessToken: string) {
  return apiRequest<void>(`/api/motorcycles/${motorcycleId}`, accessToken, {
    method: "DELETE",
  });
}

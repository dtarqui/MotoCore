import { apiRequest, toNullable } from "@/shared/lib/api-client";
import type { CreateMaintenanceHistoryEntryPayload, MaintenanceHistoryEntry } from "./types";

export function getMotorcycleHistory(motorcycleId: string) {
  return apiRequest<MaintenanceHistoryEntry[]>(
    `/api/maintenance-history/motorcycles/${motorcycleId}`,
  );
}

export function createMaintenanceHistoryEntry(
  payload: CreateMaintenanceHistoryEntryPayload) {
  return apiRequest<MaintenanceHistoryEntry>("/api/maintenance-history", {
    method: "POST",
    body: JSON.stringify({
      motorcycleId: payload.motorcycleId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      mileageAtService: payload.mileageAtService ?? null,
      totalCost: payload.totalCost,
      serviceDate: payload.serviceDate,
      servicesPerformed: toNullable(payload.servicesPerformed),
      partsUsed: toNullable(payload.partsUsed),
      recommendations: toNullable(payload.recommendations),
      notes: toNullable(payload.notes),
    }),
  });
}

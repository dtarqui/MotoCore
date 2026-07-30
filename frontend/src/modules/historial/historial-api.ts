import { apiRequest, toNullable } from "@/shared/lib/api-client";
import type { CreateMaintenanceHistoryEntryPayload, MaintenanceHistoryEntry } from "./types";

export function getMotorcycleHistory(motorcycleId: string, accessToken: string) {
  return apiRequest<MaintenanceHistoryEntry[]>(
    `/api/maintenance-history/motorcycles/${motorcycleId}`,
    accessToken,
  );
}

export function createMaintenanceHistoryEntry(
  payload: CreateMaintenanceHistoryEntryPayload,
  accessToken: string,
) {
  return apiRequest<MaintenanceHistoryEntry>("/api/maintenance-history", accessToken, {
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

import { apiRequest, toNullable } from "@/shared/lib/api-client";
import type { CreateWorkOrderPayload, WorkOrder } from "./types";

export function getWorkOrders(accessToken: string) {
  return apiRequest<WorkOrder[]>("/api/work-orders", accessToken);
}

export function createWorkOrder(
  payload: CreateWorkOrderPayload,
  accessToken: string,
) {
  return apiRequest<WorkOrder>("/api/work-orders", accessToken, {
    method: "POST",
    body: JSON.stringify({
      motorcycleId: payload.motorcycleId,
      description: payload.description.trim(),
      currentMileage: payload.currentMileage ?? null,
      estimatedCost: payload.estimatedCost,
      scheduledDate: toNullable(payload.scheduledDate),
      assignedMechanicUserId: toNullable(payload.assignedMechanicUserId),
      notes: toNullable(payload.notes),
    }),
  });
}

export function updateWorkOrderStatus(
  workOrderId: string,
  status: string,
  accessToken: string,
) {
  return apiRequest<WorkOrder>(`/api/work-orders/${workOrderId}/status`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateWorkOrderDiagnosis(
  workOrderId: string,
  diagnosis: string,
  accessToken: string,
) {
  return apiRequest<WorkOrder>(`/api/work-orders/${workOrderId}/diagnosis`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ diagnosis }),
  });
}

export function closeWorkOrder(
  workOrderId: string,
  finalCost: number,
  notes: string | undefined,
  accessToken: string,
) {
  return apiRequest<WorkOrder>(`/api/work-orders/${workOrderId}/close`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ finalCost, notes: toNullable(notes) }),
  });
}

export function deliverWorkOrder(workOrderId: string, accessToken: string) {
  return apiRequest<WorkOrder>(`/api/work-orders/${workOrderId}/deliver`, accessToken, {
    method: "PATCH",
  });
}

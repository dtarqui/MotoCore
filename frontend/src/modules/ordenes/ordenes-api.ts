import { apiRequest, toNullable } from "@/shared/lib/api-client";
import type { CreateWorkOrderPayload, WorkOrder } from "./types";

export function getWorkOrders() {
  return apiRequest<WorkOrder[]>("/api/work-orders");
}

export function createWorkOrder(
  payload: CreateWorkOrderPayload) {
  return apiRequest<WorkOrder>("/api/work-orders", {
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
  status: string) {
  return apiRequest<WorkOrder>(`/api/work-orders/${workOrderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateWorkOrderDiagnosis(
  workOrderId: string,
  diagnosis: string) {
  return apiRequest<WorkOrder>(`/api/work-orders/${workOrderId}/diagnosis`, {
    method: "PATCH",
    body: JSON.stringify({ diagnosis }),
  });
}

export function closeWorkOrder(
  workOrderId: string,
  finalCost: number,
  notes: string | undefined) {
  return apiRequest<WorkOrder>(`/api/work-orders/${workOrderId}/close`, {
    method: "PATCH",
    body: JSON.stringify({ finalCost, notes: toNullable(notes) }),
  });
}

export function deliverWorkOrder(workOrderId: string) {
  return apiRequest<WorkOrder>(`/api/work-orders/${workOrderId}/deliver`, {
    method: "PATCH",
  });
}

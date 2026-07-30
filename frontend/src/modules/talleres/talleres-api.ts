import { apiRequest, toNullable } from "@/shared/lib/api-client";
import type { InviteMemberPayload, UpdateWorkshopPayload, Workshop, WorkshopMember } from "./types";

export function getUserWorkshops(accessToken: string) {
  return apiRequest<Workshop[]>("/api/workshops", accessToken);
}

export function updateWorkshop(
  workshopId: string,
  payload: UpdateWorkshopPayload,
  accessToken: string,
) {
  return apiRequest<Workshop>(`/api/workshops/${workshopId}`, accessToken, {
    method: "PUT",
    body: JSON.stringify({
      name: payload.name.trim(),
      description: toNullable(payload.description),
      address: toNullable(payload.address),
      phoneNumber: toNullable(payload.phoneNumber),
      email: toNullable(payload.email),
    }),
  });
}

export function getWorkshopMembers(workshopId: string, accessToken: string) {
  return apiRequest<WorkshopMember[]>(`/api/workshops/${workshopId}/members`, accessToken);
}

export function inviteMember(
  workshopId: string,
  payload: InviteMemberPayload,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(
    `/api/workshops/${workshopId}/members/invite`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function removeMember(workshopId: string, memberId: string, accessToken: string) {
  return apiRequest<void>(`/api/workshops/${workshopId}/members/${memberId}`, accessToken, {
    method: "DELETE",
  });
}

export function updateMemberRole(
  workshopId: string,
  memberId: string,
  role: string,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(
    `/api/workshops/${workshopId}/members/${memberId}/role`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

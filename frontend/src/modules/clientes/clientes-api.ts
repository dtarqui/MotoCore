import { apiRequest, toNullable } from "@/shared/lib/api-client";
import type { Client, ClientStatistics, ClientUpsertPayload } from "./types";

function normalizePayload(payload: ClientUpsertPayload) {
  return {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    secondaryPhone: toNullable(payload.secondaryPhone),
    address: toNullable(payload.address),
    city: toNullable(payload.city),
    postalCode: toNullable(payload.postalCode),
    identificationNumber: toNullable(payload.identificationNumber),
    companyName: toNullable(payload.companyName),
    taxId: toNullable(payload.taxId),
    birthDate: toNullable(payload.birthDate),
    preferredContactMethod: toNullable(payload.preferredContactMethod),
    notes: toNullable(payload.notes),
  };
}

export function getClients(accessToken: string) {
  return apiRequest<Client[]>("/api/clients", accessToken);
}

export function createClient(
  payload: ClientUpsertPayload,
  accessToken: string,
) {
  return apiRequest<Client>("/api/clients", accessToken, {
    method: "POST",
    body: JSON.stringify(normalizePayload(payload)),
  });
}

export function updateClient(
  clientId: string,
  payload: ClientUpsertPayload,
  accessToken: string,
) {
  return apiRequest<Client>(`/api/clients/${clientId}`, accessToken, {
    method: "PUT",
    body: JSON.stringify(normalizePayload(payload)),
  });
}

export function deleteClient(clientId: string, accessToken: string) {
  return apiRequest<void>(`/api/clients/${clientId}`, accessToken, {
    method: "DELETE",
  });
}

export function getClientById(clientId: string, accessToken: string) {
  return apiRequest<Client>(`/api/clients/${clientId}`, accessToken);
}

export function searchClients(query: string, accessToken: string) {
  const search = new URLSearchParams({ query });
  return apiRequest<Client[]>(
    `/api/clients/search?${search.toString()}`,
    accessToken,
  );
}

export function getClientSummary(clientId: string, accessToken: string) {
  return apiRequest(`/api/clients/${clientId}/summary`, accessToken);
}

export function getClientStatistics(accessToken: string) {
  return apiRequest<ClientStatistics>("/api/clients/statistics", accessToken);
}

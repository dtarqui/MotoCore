import { API_BASE_URL } from "@/shared/config/api";
import type { Client, ClientUpsertPayload } from "./types";

type ProblemDetails = {
  title?: string;
  detail?: string;
};

function buildApiUrl(path: string) {
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  return `${normalizedBase}${path}`;
}

function toNullable(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

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

async function parseProblemDetails(response: Response) {
  try {
    const problem = (await response.json()) as ProblemDetails;
    return (
      problem.detail ??
      problem.title ??
      "No fue posible completar la operación."
    );
  } catch {
    return "No fue posible completar la operación.";
  }
}

async function authorizedRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
) {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await parseProblemDetails(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getClients(accessToken: string) {
  return authorizedRequest<Client[]>("/api/clients", accessToken);
}

export function createClient(
  payload: ClientUpsertPayload,
  accessToken: string,
) {
  return authorizedRequest<Client>("/api/clients", accessToken, {
    method: "POST",
    body: JSON.stringify(normalizePayload(payload)),
  });
}

export function updateClient(
  clientId: string,
  payload: ClientUpsertPayload,
  accessToken: string,
) {
  return authorizedRequest<Client>(`/api/clients/${clientId}`, accessToken, {
    method: "PUT",
    body: JSON.stringify(normalizePayload(payload)),
  });
}

export function deleteClient(clientId: string, accessToken: string) {
  return authorizedRequest<void>(`/api/clients/${clientId}`, accessToken, {
    method: "DELETE",
  });
}

export function getClientById(clientId: string, accessToken: string) {
  return authorizedRequest<Client>(`/api/clients/${clientId}`, accessToken);
}

export function searchClients(query: string, accessToken: string) {
  const search = new URLSearchParams({ query });
  return authorizedRequest<Client[]>(
    `/api/clients/search?${search.toString()}`,
    accessToken,
  );
}

export function getClientSummary(clientId: string, accessToken: string) {
  return authorizedRequest(`/api/clients/${clientId}/summary`, accessToken);
}

export function getClientStatistics(accessToken: string) {
  return authorizedRequest("/api/clients/statistics", accessToken);
}

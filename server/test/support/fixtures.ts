import { expect } from 'vitest';
import type { AuditEntry, AuditRecorder } from '../../src/lib/audit.js';
import { AppError } from '../../src/lib/errors.js';
import type { OrgContext, Role, WorkshopContext } from '../../src/types.js';

/** Identificadores fijos y legibles para las pruebas sin base de datos. */
export const ORG = '11111111-1111-4111-8111-111111111111';
export const OTHER_ORG = '22222222-2222-4222-8222-222222222222';
export const WORKSHOP = '33333333-3333-4333-8333-333333333333';
export const OTHER_WORKSHOP = '44444444-4444-4444-8444-444444444444';
export const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const MEMBER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const STRANGER = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const MISSING = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

export const orgCtx = (role: Role = 'owner', userId = OWNER): OrgContext => ({ userId, orgId: ORG, role });
export const workshopCtx = (role: Role = 'owner', userId = OWNER): WorkshopContext => ({
  ...orgCtx(role, userId),
  workshopId: WORKSHOP,
});

/** Registro de auditoría en memoria: permite comprobar qué acción crítica quedó registrada y cuántas veces. */
export function memoryAudit(): AuditRecorder & { entries: AuditEntry[] } {
  const entries: AuditEntry[] = [];
  return {
    entries,
    async record(entry) {
      entries.push(entry);
    },
  };
}

/** Comprueba que la promesa falle con el código `modulo.razon` y el estado del contrato. */
export async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<AppError> {
  const error = await promise.then(
    () => {
      throw new Error(`se esperaba ${code} y la operación se completó`);
    },
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  expect((error as AppError).code).toBe(code);
  expect((error as AppError).status).toBe(status);
  return error as AppError;
}

/** Marca de tiempo estable para las filas de prueba. */
export const NOW = '2026-09-17T12:00:00.000Z';

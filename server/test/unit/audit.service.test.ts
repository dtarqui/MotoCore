import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import type { AuditRepository, AuditRow } from '../../src/modules/audit/audit.repository.js';
import { createAuditService, DEFAULT_LIMIT, MAX_LIMIT } from '../../src/modules/audit/audit.service.js';
import { expectAppError, MEMBER, NOW, ORG, orgCtx, OWNER, STRANGER, WORKSHOP } from '../support/fixtures.js';

const entry = (overrides: Partial<AuditRow>): AuditRow => ({
  id: 'e',
  organization_id: ORG,
  workshop_id: null,
  performed_by: OWNER,
  action: 'member.invited',
  entity: 'membership',
  entity_id: MEMBER,
  details: null,
  created_at: NOW,
  ...overrides,
});

function setup(rows: AuditRow[]) {
  const repo: AuditRepository = {
    list: vi.fn(async () => rows),
    profiles: vi.fn(async (ids: string[]) =>
      ids
        .filter((id) => id === OWNER)
        .map((id) => ({ id, email: 'duena@correo.bo', first_name: 'Ana', last_name: 'Quispe' })),
    ),
  };
  return { service: createAuditService({ repo }), repo };
}

describe('servicio de auditoría', () => {
  it('CP-704.1 — el Mechanic y el Receptionist reciben 403 audit.insufficient_permissions', async () => {
    const { service, repo } = setup([]);
    await expectAppError(service.list(orgCtx('mechanic'), {}), 'audit.insufficient_permissions', 403);
    await expectAppError(service.list(orgCtx('receptionist'), {}), 'audit.insufficient_permissions', 403);
    expect(repo.list).not.toHaveBeenCalled();
  });

  it('RF-703 — cada entrada lleva su autor; una cuenta borrada deja el perfil en nulo, no la entrada', async () => {
    const { service } = setup([
      entry({ id: '1' }),
      entry({ id: '2', performed_by: STRANGER }),
      entry({ id: '3', performed_by: null }),
    ]);
    const entries = await service.list(orgCtx(), {});
    expect(entries.map((e) => e.performed_by_profile?.first_name ?? null)).toEqual(['Ana', null, null]);
  });

  it('aplica los filtros y acota el límite', async () => {
    const { service, repo } = setup([]);
    await service.list(orgCtx(), {});
    expect(repo.list).toHaveBeenLastCalledWith(ORG, { limit: DEFAULT_LIMIT });

    await service.list(orgCtx(), { action: 'client.deactivated', workshopId: WORKSHOP, limit: '20' });
    expect(repo.list).toHaveBeenLastCalledWith(ORG, { action: 'client.deactivated', workshopId: WORKSHOP, limit: 20 });

    await expect(service.list(orgCtx(), { limit: String(MAX_LIMIT + 1) })).rejects.toBeInstanceOf(ZodError);
    await expect(service.list(orgCtx(), { action: 'member.deleted' })).rejects.toBeInstanceOf(ZodError);
    await expect(service.list(orgCtx(), { workshopId: 'x' })).rejects.toBeInstanceOf(ZodError);
  });
});

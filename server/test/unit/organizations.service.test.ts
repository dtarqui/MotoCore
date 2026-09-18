import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { forbidden } from '../../src/lib/errors.js';
import type {
  OrganizationFactory,
  OrganizationRow,
  OrganizationsRepository,
} from '../../src/modules/organizations/organizations.repository.js';
import { createOrganizationsService } from '../../src/modules/organizations/organizations.service.js';
import type { Role } from '../../src/types.js';
import { expectAppError, MEMBER, memoryAudit, MISSING, NOW, ORG, OWNER, STRANGER } from '../support/fixtures.js';

const organization = (overrides: Partial<OrganizationRow> = {}): OrganizationRow => ({
  id: ORG,
  name: 'Motos del Sur',
  description: null,
  address: null,
  phone: null,
  email: null,
  owner_id: OWNER,
  is_active: true,
  created_at: NOW,
  updated_at: null,
  ...overrides,
});

/** Membresías simuladas: la comprobación real vive en la capa de acceso y se prueba en N2. */
const roles: Record<string, Role> = { [OWNER]: 'owner', [MEMBER]: 'mechanic' };
const membership = async (orgId: string, userId: string): Promise<Role> => {
  const role = orgId === ORG ? roles[userId] : undefined;
  if (!role) throw forbidden('organization.access_denied', 'Sin acceso.');
  return role;
};

function setup(rows: OrganizationRow[] = [organization()]) {
  const repo: OrganizationsRepository = {
    listForUser: vi.fn(async () => rows.map((o) => ({ role: 'owner' as const, organization: o }))),
    async findById(id) {
      return rows.find((o) => o.id === id) ?? null;
    },
    async update(id, patch) {
      const row = rows.find((o) => o.id === id);
      return row ? Object.assign(row, patch) : null;
    },
  };
  const factory: OrganizationFactory = {
    create: vi.fn(async (input) => ({ organization: organization({ ...input, id: MISSING }), workshop: null })),
  };
  const audit = memoryAudit();
  return { service: createOrganizationsService({ repo, factory, membership, audit }), repo, factory, audit };
}

describe('servicio de organizaciones', () => {
  it('CP-202 — lista según la membresía de la cuenta', async () => {
    const { service, repo } = setup();
    expect(await service.list(MEMBER)).toHaveLength(1);
    expect(repo.listForUser).toHaveBeenCalledWith(MEMBER);
  });

  it('CP-201 — crea con el solicitante como propietario, nunca con el del cuerpo', async () => {
    const { service, factory } = setup();
    const created = await service.create(OWNER, { name: 'Motos del Norte', owner_id: STRANGER, email: '' });
    expect(created.name).toBe('Motos del Norte');
    expect(factory.create).toHaveBeenCalledWith({
      name: 'Motos del Norte',
      email: null,
      owner_id: OWNER,
    });
    await expect(service.create(OWNER, { name: '  ' })).rejects.toBeInstanceOf(ZodError);
  });

  it('CP-203.1 — activar devuelve la organización y el rol del solicitante', async () => {
    const { service } = setup();
    expect(await service.switchTo(MEMBER, ORG)).toMatchObject({ role: 'mechanic', organization: { id: ORG } });
    expect(await service.get(MEMBER, ORG)).toMatchObject({ name: 'Motos del Sur' });
  });

  it('CP-203.2 — sin membresía responde 403 organization.access_denied', async () => {
    const { service } = setup();
    await expectAppError(service.switchTo(STRANGER, ORG), 'organization.access_denied', 403);
    await expectAppError(service.get(STRANGER, ORG), 'organization.access_denied', 403);
    await expectAppError(service.update(STRANGER, ORG, { name: 'X' }), 'organization.access_denied', 403);
  });

  it('una organización que desaparece tras verificar la membresía responde 404', async () => {
    const { service } = setup([]);
    await expectAppError(service.get(OWNER, ORG), 'organization.not_found', 404);
    await expectAppError(service.update(OWNER, ORG, { name: 'X' }), 'organization.not_found', 404);
  });

  it('CP-204 y CP-703.4 — el Owner edita y se audita qué campos cambió; un no-Owner recibe 403', async () => {
    const { service, audit } = setup();

    await expectAppError(service.update(MEMBER, ORG, { name: 'X' }), 'organization.insufficient_permissions', 403);
    expect(audit.entries).toHaveLength(0);

    const updated = await service.update(OWNER, ORG, { phone: '44441111', description: null });
    expect(updated).toMatchObject({ phone: '44441111' });
    expect(audit.entries).toEqual([
      expect.objectContaining({
        action: 'organization.updated',
        entityId: ORG,
        details: { fields: ['description', 'phone'] },
      }),
    ]);

    await expect(service.update(OWNER, ORG, {})).rejects.toBeInstanceOf(ZodError);
  });
});

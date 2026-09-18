import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { UniqueViolation } from '../../src/lib/db.js';
import type { Role } from '../../src/types.js';
import type {
  AssignmentRow,
  WorkshopRow,
  WorkshopsRepository,
} from '../../src/modules/workshops/workshops.repository.js';
import { createWorkshopsService } from '../../src/modules/workshops/workshops.service.js';
import {
  expectAppError,
  MEMBER,
  memoryAudit,
  MISSING,
  NOW,
  ORG,
  orgCtx,
  OTHER_ORG,
  OTHER_WORKSHOP,
  STRANGER,
  WORKSHOP,
} from '../support/fixtures.js';

interface Membership {
  id: string;
  user_id: string;
  role: Role;
  is_active: boolean;
}

/** Nivel N1: talleres y asignaciones con un repositorio en memoria. */
function memoryWorkshops(seed: WorkshopRow[], memberships: Membership[] = []) {
  const workshops = [...seed];
  const links: Array<{ id: string; workshop_id: string; membership_id: string }> = [];
  let raceOnInsert = false;

  const toRow = (link: (typeof links)[number]): AssignmentRow => {
    const m = memberships.find((x) => x.id === link.membership_id)!;
    return {
      id: link.id,
      organization_id: ORG,
      workshop_id: link.workshop_id,
      user_id: m.user_id,
      role: m.role,
      is_active: m.is_active,
      created_at: NOW,
    };
  };

  const repo: WorkshopsRepository = {
    async list(orgId, { includeInactive }) {
      return workshops.filter((w) => w.organization_id === orgId && (includeInactive || w.is_active));
    },
    async findById(orgId, id) {
      return workshops.find((w) => w.organization_id === orgId && w.id === id) ?? null;
    },
    async insert(input) {
      if (workshops.some((w) => w.organization_id === input.organization_id && w.name === input.name)) {
        throw new UniqueViolation('workshops.insert');
      }
      const row: WorkshopRow = { ...input, id: MISSING, is_active: true, created_at: NOW, updated_at: null };
      workshops.push(row);
      return row;
    },
    async update(orgId, id, patch) {
      const row = workshops.find((w) => w.organization_id === orgId && w.id === id);
      if (!row) return null;
      if (patch.name && workshops.some((w) => w !== row && w.organization_id === orgId && w.name === patch.name)) {
        throw new UniqueViolation('workshops.update');
      }
      Object.assign(row, patch);
      return row;
    },
    async findMembership(_orgId, userId) {
      return memberships.find((m) => m.user_id === userId) ?? null;
    },
    async listAssignments(_orgId, workshopId) {
      return links.filter((l) => l.workshop_id === workshopId).map(toRow);
    },
    async findAssignment(_orgId, workshopId, userId) {
      const m = memberships.find((x) => x.user_id === userId);
      const link = links.find((l) => l.workshop_id === workshopId && l.membership_id === m?.id);
      return link ? toRow(link) : null;
    },
    async insertAssignment(_orgId, workshopId, membershipId) {
      links.push({ id: `link-${links.length}`, workshop_id: workshopId, membership_id: membershipId });
      if (raceOnInsert) throw new UniqueViolation('workshop_assignments.insert');
    },
    async deleteAssignment(_orgId, workshopId, membershipId) {
      const i = links.findIndex((l) => l.workshop_id === workshopId && l.membership_id === membershipId);
      if (i >= 0) links.splice(i, 1);
    },
  };
  return { repo, workshops, links, simulateRace: () => (raceOnInsert = true) };
}

const workshop = (overrides: Partial<WorkshopRow> = {}): WorkshopRow => ({
  id: WORKSHOP,
  organization_id: ORG,
  name: 'Centro',
  address: null,
  phone: null,
  is_active: true,
  created_at: NOW,
  updated_at: null,
  ...overrides,
});

const mechanic: Membership = { id: 'm-1', user_id: MEMBER, role: 'mechanic', is_active: true };

describe('servicio de talleres', () => {
  it('CP-302 y CP-305 — lista los talleres de la organización; los inactivos solo si se piden', async () => {
    const { repo } = memoryWorkshops([
      workshop(),
      workshop({ id: OTHER_WORKSHOP, name: 'Norte', is_active: false }),
      workshop({ id: MISSING, organization_id: OTHER_ORG, name: 'Ajeno' }),
    ]);
    const service = createWorkshopsService({ repo, audit: memoryAudit() });

    expect((await service.list(orgCtx('mechanic'), { includeInactive: false })).map((w) => w.name)).toEqual(['Centro']);
    expect(await service.list(orgCtx('mechanic'), { includeInactive: true })).toHaveLength(2);
  });

  it('CP-301.1 — el Owner crea un taller con nombre, dirección y teléfono', async () => {
    const service = createWorkshopsService({ repo: memoryWorkshops([]).repo, audit: memoryAudit() });
    const created = await service.create(orgCtx(), { name: 'Sur', address: 'Av. Blanco Galindo', phone: '' });
    expect(created).toMatchObject({ organization_id: ORG, name: 'Sur', address: 'Av. Blanco Galindo', phone: null });
  });

  it('CP-301.2 y CP-301.3 — un no-Owner no crea, edita, desactiva ni asigna', async () => {
    const service = createWorkshopsService({ repo: memoryWorkshops([workshop()]).repo, audit: memoryAudit() });
    const code = 'workshop.insufficient_permissions';
    for (const role of ['mechanic', 'receptionist'] as const) {
      await expectAppError(service.create(orgCtx(role), { name: 'X' }), code, 403);
      await expectAppError(service.update(orgCtx(role), WORKSHOP, { name: 'X' }), code, 403);
      await expectAppError(service.deactivate(orgCtx(role), WORKSHOP), code, 403);
      await expectAppError(service.assign(orgCtx(role), WORKSHOP, { user_id: MEMBER }), code, 403);
      await expectAppError(service.unassign(orgCtx(role), WORKSHOP, MEMBER), code, 403);
    }
  });

  it('RN-06 — el nombre es único por organización, al crear y al editar', async () => {
    const service = createWorkshopsService({
      repo: memoryWorkshops([workshop(), workshop({ id: OTHER_WORKSHOP, name: 'Norte' })]).repo,
      audit: memoryAudit(),
    });
    await expectAppError(service.create(orgCtx(), { name: 'Centro' }), 'workshop.duplicate_name', 409);
    await expectAppError(service.update(orgCtx(), OTHER_WORKSHOP, { name: 'Centro' }), 'workshop.duplicate_name', 409);
  });

  it('CP-301.3 — la edición se refleja; sin campos es entrada inválida', async () => {
    const service = createWorkshopsService({ repo: memoryWorkshops([workshop()]).repo, audit: memoryAudit() });
    expect(await service.update(orgCtx(), WORKSHOP, { phone: '44440000' })).toMatchObject({ phone: '44440000' });
    await expect(service.update(orgCtx(), WORKSHOP, {})).rejects.toBeInstanceOf(ZodError);
  });

  it('un taller de otra organización o mal identificado responde 404 workshop.not_found', async () => {
    const service = createWorkshopsService({
      repo: memoryWorkshops([workshop({ organization_id: OTHER_ORG })]).repo,
      audit: memoryAudit(),
    });
    await expectAppError(service.get(orgCtx(), WORKSHOP), 'workshop.not_found', 404);
    await expectAppError(service.get(orgCtx(), 'x'), 'workshop.not_found', 404);
    await expectAppError(service.update(orgCtx(), WORKSHOP, { name: 'Y' }), 'workshop.not_found', 404);
    await expectAppError(service.listAssignments(orgCtx(), WORKSHOP), 'workshop.not_found', 404);
  });

  it('CP-305 y CP-703.5 — la baja lógica conserva el taller y se audita una sola vez', async () => {
    const { repo, workshops } = memoryWorkshops([workshop()]);
    const audit = memoryAudit();
    const service = createWorkshopsService({ repo, audit });

    await service.deactivate(orgCtx(), WORKSHOP);
    await service.deactivate(orgCtx(), WORKSHOP);

    expect(workshops[0]!.is_active).toBe(false);
    expect(await service.get(orgCtx('mechanic'), WORKSHOP)).toMatchObject({ name: 'Centro' });
    expect(audit.entries).toEqual([
      expect.objectContaining({ action: 'workshop.deactivated', workshopId: WORKSHOP, entityId: WORKSHOP }),
    ]);
  });

  it('CP-304.1 — asigna, es idempotente y se retira sin tocar la membresía', async () => {
    const memberships = [mechanic];
    const { repo, links } = memoryWorkshops([workshop()], memberships);
    const service = createWorkshopsService({ repo, audit: memoryAudit() });

    const first = await service.assign(orgCtx(), WORKSHOP, { user_id: MEMBER });
    const again = await service.assign(orgCtx(), WORKSHOP, { user_id: MEMBER });
    expect(first).toMatchObject({ created: true, assignment: { user_id: MEMBER, role: 'mechanic' } });
    expect(again.created).toBe(false);
    expect(await service.listAssignments(orgCtx('mechanic'), WORKSHOP)).toHaveLength(1);

    await service.unassign(orgCtx(), WORKSHOP, MEMBER);
    expect(links).toHaveLength(0);
    expect(memberships[0]!.is_active).toBe(true);
  });

  it('una asignación concurrente que gana la carrera no produce error', async () => {
    const fake = memoryWorkshops([workshop()], [mechanic]);
    fake.simulateRace();
    const service = createWorkshopsService({ repo: fake.repo, audit: memoryAudit() });
    expect(await service.assign(orgCtx(), WORKSHOP, { user_id: MEMBER })).toMatchObject({ created: false });
  });

  it('solo se asigna a miembros activos, y solo se retira a miembros', async () => {
    const service = createWorkshopsService({
      repo: memoryWorkshops([workshop()], [{ ...mechanic, is_active: false }]).repo,
      audit: memoryAudit(),
    });
    await expectAppError(service.assign(orgCtx(), WORKSHOP, { user_id: MEMBER }), 'member.not_found', 404);
    await expectAppError(service.assign(orgCtx(), WORKSHOP, { user_id: STRANGER }), 'member.not_found', 404);
    await expect(service.assign(orgCtx(), WORKSHOP, { user_id: 'no-es-uuid' })).rejects.toBeInstanceOf(ZodError);
    await expectAppError(service.unassign(orgCtx(), WORKSHOP, STRANGER), 'member.not_found', 404);
    await expectAppError(service.unassign(orgCtx(), WORKSHOP, 'no-es-uuid'), 'member.not_found', 404);
  });
});

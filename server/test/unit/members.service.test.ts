import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { UniqueViolation } from '../../src/lib/db.js';
import { MALFORMED_BODY } from '../../src/lib/http.js';
import type { MemberRow, MembersRepository } from '../../src/modules/members/members.repository.js';
import { createMembersService } from '../../src/modules/members/members.service.js';
import { expectAppError, MEMBER, memoryAudit, NOW, orgCtx, OWNER, STRANGER } from '../support/fixtures.js';

const member = (overrides: Partial<MemberRow> = {}): MemberRow => ({
  user_id: MEMBER,
  role: 'mechanic',
  is_active: true,
  joined_at: NOW,
  updated_at: null,
  email: 'mecanico@correo.bo',
  first_name: 'Juan',
  last_name: 'Mamani',
  ...overrides,
});

const owner = member({ user_id: OWNER, role: 'owner', email: 'duena@correo.bo' });

/** Nivel N1: miembros con un repositorio en memoria. `accounts` simula el proveedor de identidad. */
function memoryMembers(seed: MemberRow[], accounts: Record<string, string> = {}) {
  const rows = [...seed];
  let insertConflict = false;
  const repo: MembersRepository = {
    async list(_orgId, { includeInactive }) {
      return rows.filter((r) => includeInactive || r.is_active);
    },
    async findMember(_orgId, userId) {
      return rows.find((r) => r.user_id === userId) ?? null;
    },
    async findAccountIdByEmail(email) {
      return accounts[email] ?? null;
    },
    async findOwnerId() {
      return OWNER;
    },
    async insert(_orgId, userId, role) {
      if (insertConflict) throw new UniqueViolation('memberships.insert');
      rows.push(member({ user_id: userId, role, email: null, first_name: null, last_name: null }));
    },
    async update(_orgId, userId, patch) {
      Object.assign(
        rows.find((r) => r.user_id === userId)!,
        patch,
      );
    },
  };
  return { repo, rows, failNextInsert: () => (insertConflict = true) };
}

describe('servicio de miembros', () => {
  it('CP-407 — cualquier miembro lista el equipo; los removidos, solo si se piden', async () => {
    const service = createMembersService({
      repo: memoryMembers([owner, member(), member({ user_id: STRANGER, is_active: false })]).repo,
      audit: memoryAudit(),
    });
    expect(await service.list(orgCtx('mechanic'), { includeInactive: false })).toHaveLength(2);
    expect(await service.list(orgCtx('mechanic'), { includeInactive: true })).toHaveLength(3);
  });

  it('CP-406 — solo el Owner invita, cambia roles y remueve', async () => {
    const service = createMembersService({ repo: memoryMembers([owner, member()]).repo, audit: memoryAudit() });
    const code = 'member.insufficient_permissions';
    for (const role of ['mechanic', 'receptionist'] as const) {
      await expectAppError(service.invite(orgCtx(role), { email: 'x@correo.bo', role: 'mechanic' }), code, 403);
      await expectAppError(service.changeRole(orgCtx(role), MEMBER, { role: 'receptionist' }), code, 403);
      await expectAppError(service.remove(orgCtx(role), MEMBER), code, 403);
    }
  });

  it('CP-402.1 — no se invita ni se asciende a owner, con su código propio', async () => {
    const service = createMembersService({ repo: memoryMembers([owner, member()]).repo, audit: memoryAudit() });
    await expectAppError(
      service.invite(orgCtx(), { email: 'x@correo.bo', role: 'owner' }),
      'member.owner_role_forbidden',
      403,
    );
    await expectAppError(service.changeRole(orgCtx(), MEMBER, { role: 'owner' }), 'member.owner_role_forbidden', 403);
  });

  it('CP-401.1 y CP-703.1 — incorpora una cuenta existente y lo audita', async () => {
    const audit = memoryAudit();
    const { repo, rows } = memoryMembers([owner], { 'nuevo@correo.bo': STRANGER });
    const service = createMembersService({ repo, audit });

    const invited = await service.invite(orgCtx(), { email: 'nuevo@correo.bo', role: 'receptionist' });

    expect(invited).toMatchObject({ user_id: STRANGER, role: 'receptionist', is_active: true });
    expect(rows).toHaveLength(2);
    expect(audit.entries).toEqual([
      expect.objectContaining({
        action: 'member.invited',
        entityId: STRANGER,
        details: { role: 'receptionist', reactivated: false },
      }),
    ]);
  });

  it('CP-401.2 — un correo sin cuenta responde 404 member.not_found', async () => {
    const service = createMembersService({ repo: memoryMembers([owner]).repo, audit: memoryAudit() });
    await expectAppError(
      service.invite(orgCtx(), { email: 'nadie@correo.bo', role: 'mechanic' }),
      'member.not_found',
      404,
    );
  });

  it('HU-09 — invitar a un miembro activo responde 409 member.already_active', async () => {
    const fake = memoryMembers([owner, member()], { 'mecanico@correo.bo': MEMBER, 'otro@correo.bo': STRANGER });
    const service = createMembersService({ repo: fake.repo, audit: memoryAudit() });
    await expectAppError(
      service.invite(orgCtx(), { email: 'mecanico@correo.bo', role: 'mechanic' }),
      'member.already_active',
      409,
    );

    fake.failNextInsert();
    await expectAppError(
      service.invite(orgCtx(), { email: 'otro@correo.bo', role: 'mechanic' }),
      'member.already_active',
      409,
    );
  });

  it('CP-401.3 — reincorporar a un removido reactiva su membresía con el nuevo rol, sin duplicarla', async () => {
    const audit = memoryAudit();
    const { repo, rows } = memoryMembers([owner, member({ is_active: false })], { 'mecanico@correo.bo': MEMBER });
    const service = createMembersService({ repo, audit });

    const invited = await service.invite(orgCtx(), { email: 'mecanico@correo.bo', role: 'receptionist' });

    expect(invited).toMatchObject({ role: 'receptionist', is_active: true });
    expect(rows.filter((r) => r.user_id === MEMBER)).toHaveLength(1);
    expect(audit.entries[0]!.details).toEqual({ role: 'receptionist', reactivated: true });
  });

  it('la invitación valida el cuerpo después de las comprobaciones de acceso', async () => {
    const service = createMembersService({ repo: memoryMembers([owner]).repo, audit: memoryAudit() });
    await expect(service.invite(orgCtx(), { email: 'no-es-correo', role: 'mechanic' })).rejects.toBeInstanceOf(
      ZodError,
    );
    await expectAppError(service.invite(orgCtx(), MALFORMED_BODY), 'validation.invalid_body', 400);
  });

  it('CP-403 y CP-703.2 — cambia el rol y registra el antes y el después', async () => {
    const audit = memoryAudit();
    const service = createMembersService({ repo: memoryMembers([owner, member()]).repo, audit });

    const updated = await service.changeRole(orgCtx(), MEMBER, { role: 'receptionist' });
    expect(updated.role).toBe('receptionist');
    expect(audit.entries).toEqual([
      expect.objectContaining({ action: 'member.role_changed', details: { from: 'mechanic', to: 'receptionist' } }),
    ]);

    // Asignar el rol que ya tiene no es un cambio: no se audita.
    await service.changeRole(orgCtx(), MEMBER, { role: 'receptionist' });
    expect(audit.entries).toHaveLength(1);
  });

  it('CP-405 — el rol del propietario no se cambia ni se le remueve', async () => {
    const service = createMembersService({ repo: memoryMembers([owner, member()]).repo, audit: memoryAudit() });
    await expectAppError(service.changeRole(orgCtx(), OWNER, { role: 'mechanic' }), 'member.owner_protected', 403);
    await expectAppError(service.remove(orgCtx(), OWNER), 'member.owner_protected', 403);
  });

  it('CP-404 y CP-703.3 — remueve con baja lógica y lo audita; un removido ya no se remueve', async () => {
    const audit = memoryAudit();
    const { repo, rows } = memoryMembers([owner, member()]);
    const service = createMembersService({ repo, audit });

    await service.remove(orgCtx(), MEMBER);
    expect(rows.find((r) => r.user_id === MEMBER)!.is_active).toBe(false);
    expect(audit.entries).toEqual([
      expect.objectContaining({ action: 'member.removed', details: { role: 'mechanic' } }),
    ]);

    await expectAppError(service.remove(orgCtx(), MEMBER), 'member.not_found', 404);
    await expectAppError(service.changeRole(orgCtx(), MEMBER, { role: 'mechanic' }), 'member.not_found', 404);
    await expectAppError(service.remove(orgCtx(), 'no-es-uuid'), 'member.not_found', 404);
  });
});

import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { UniqueViolation } from '../../src/lib/db.js';
import { MALFORMED_BODY } from '../../src/lib/http.js';
import type { ClientRow, ClientsRepository } from '../../src/modules/clients/clients.repository.js';
import { createClientsService } from '../../src/modules/clients/clients.service.js';
import { expectAppError, memoryAudit, MISSING, NOW, ORG, orgCtx, OTHER_ORG } from '../support/fixtures.js';

/** Nivel N1: reglas del servicio de clientes con un repositorio en memoria. */
function memoryClients(seed: ClientRow[] = []) {
  const rows = [...seed];
  let next = 0;
  const repo: ClientsRepository = {
    async list(orgId, { search, includeInactive }) {
      return rows.filter(
        (r) =>
          r.organization_id === orgId &&
          (includeInactive || r.is_active) &&
          (!search || `${r.first_name} ${r.last_name} ${r.email ?? ''}`.toLowerCase().includes(search.toLowerCase())),
      );
    },
    async findById(orgId, id) {
      return rows.find((r) => r.organization_id === orgId && r.id === id) ?? null;
    },
    async insert(client) {
      if (client.email && rows.some((r) => r.organization_id === client.organization_id && r.email === client.email)) {
        throw new UniqueViolation('clients.insert');
      }
      const row: ClientRow = {
        ...client,
        id: `00000000-0000-4000-8000-${String(++next).padStart(12, '0')}`,
        is_active: true,
        created_at: NOW,
        updated_at: null,
      };
      rows.push(row);
      return row;
    },
    async update(orgId, id, patch) {
      const row = rows.find((r) => r.organization_id === orgId && r.id === id);
      if (!row) return null;
      if (patch.email && rows.some((r) => r !== row && r.organization_id === orgId && r.email === patch.email)) {
        throw new UniqueViolation('clients.update');
      }
      Object.assign(row, patch);
      return row;
    },
  };
  return { repo, rows };
}

const client = (overrides: Partial<ClientRow> = {}): ClientRow => ({
  id: '99999999-9999-4999-8999-999999999999',
  organization_id: ORG,
  first_name: 'Ana',
  last_name: 'Quispe',
  email: 'ana@correo.bo',
  phone: null,
  document_id: null,
  address: null,
  notes: null,
  is_active: true,
  created_at: NOW,
  updated_at: null,
  ...overrides,
});

describe('servicio de clientes — nivel organización', () => {
  it('lista solo los activos por omisión y recorta la búsqueda', async () => {
    const { repo } = memoryClients([
      client(),
      client({ id: MISSING, first_name: 'Luis', email: 'luis@correo.bo', is_active: false }),
    ]);
    const service = createClientsService({ repo, audit: memoryAudit() });

    expect(await service.list(orgCtx(), { includeInactive: false })).toHaveLength(1);
    expect(await service.list(orgCtx(), { includeInactive: true })).toHaveLength(2);
    expect(await service.list(orgCtx(), { search: '  ana  ', includeInactive: true })).toHaveLength(1);
  });

  it('CP-501 — registra y recupera por identificador, con los opcionales vacíos como nulos', async () => {
    const service = createClientsService({ repo: memoryClients().repo, audit: memoryAudit() });
    const created = await service.create(orgCtx('receptionist'), {
      first_name: ' Ana ',
      last_name: 'Quispe',
      email: '',
      phone: '70000000',
    });

    expect(created).toMatchObject({ organization_id: ORG, first_name: 'Ana', email: null, phone: '70000000' });
    expect(await service.get(orgCtx('mechanic'), created.id)).toEqual(created);
  });

  it('CP-503.1 — el correo repetido en la organización responde 409 client.duplicate_email', async () => {
    const service = createClientsService({ repo: memoryClients([client()]).repo, audit: memoryAudit() });
    await expectAppError(
      service.create(orgCtx(), { first_name: 'Otra', last_name: 'Ana', email: 'ana@correo.bo' }),
      'client.duplicate_email',
      409,
    );
  });

  it('CP-505 — el Mechanic no crea, edita ni da de baja clientes', async () => {
    const service = createClientsService({ repo: memoryClients([client()]).repo, audit: memoryAudit() });
    const mechanic = orgCtx('mechanic');

    await expectAppError(
      service.create(mechanic, { first_name: 'A', last_name: 'B' }),
      'client.insufficient_permissions',
      403,
    );
    await expectAppError(service.update(mechanic, client().id, { phone: '1' }), 'client.insufficient_permissions', 403);
    await expectAppError(service.deactivate(mechanic, client().id), 'client.insufficient_permissions', 403);
  });

  it('CP-N105 — un cliente inexistente, uno ajeno y un identificador mal formado responden igual', async () => {
    const service = createClientsService({
      repo: memoryClients([client({ organization_id: OTHER_ORG })]).repo,
      audit: memoryAudit(),
    });

    const ajeno = await expectAppError(service.get(orgCtx(), client().id), 'client.not_found', 404);
    const inexistente = await expectAppError(service.get(orgCtx(), MISSING), 'client.not_found', 404);
    const malFormado = await expectAppError(service.get(orgCtx(), 'no-es-uuid'), 'client.not_found', 404);
    expect(ajeno.message).toBe(inexistente.message);
    expect(malFormado.message).toBe(inexistente.message);
  });

  it('CP-N205 — la entrada inválida se rechaza antes de tocar el repositorio', async () => {
    const { repo, rows } = memoryClients([client()]);
    const service = createClientsService({ repo, audit: memoryAudit() });

    await expect(service.create(orgCtx(), { first_name: 'Sin apellido' })).rejects.toBeInstanceOf(ZodError);
    await expect(service.update(orgCtx(), client().id, {})).rejects.toBeInstanceOf(ZodError);
    await expectAppError(service.create(orgCtx(), MALFORMED_BODY), 'validation.invalid_body', 400);
    expect(rows).toHaveLength(1);
  });

  it('RF-504 — edita los datos de contacto y borra un opcional con null', async () => {
    const { repo } = memoryClients([client({ phone: '71111111' })]);
    const service = createClientsService({ repo, audit: memoryAudit() });

    const updated = await service.update(orgCtx(), client().id, { phone: null, notes: 'Cliente frecuente' });
    expect(updated).toMatchObject({ phone: null, notes: 'Cliente frecuente' });
    expect(updated.updated_at).not.toBeNull();
  });

  it('la edición no deja duplicar un correo ni editar lo inexistente', async () => {
    const other = client({ id: MISSING, email: 'luis@correo.bo' });
    const service = createClientsService({ repo: memoryClients([client(), other]).repo, audit: memoryAudit() });

    await expectAppError(service.update(orgCtx(), other.id, { email: 'ana@correo.bo' }), 'client.duplicate_email', 409);
    await expectAppError(
      service.update(orgCtx(), '12345678-1234-4234-8234-123456789012', { phone: '1' }),
      'client.not_found',
      404,
    );
  });

  it('CP-504.1 y CP-703.6 — la baja lógica conserva el registro y se audita una sola vez', async () => {
    const { repo, rows } = memoryClients([client()]);
    const audit = memoryAudit();
    const service = createClientsService({ repo, audit });

    const first = await service.deactivate(orgCtx(), client().id);
    const second = await service.deactivate(orgCtx(), client().id);

    expect(first.is_active).toBe(false);
    expect(second.is_active).toBe(false);
    expect(rows).toHaveLength(1);
    expect(audit.entries).toEqual([
      expect.objectContaining({
        action: 'client.deactivated',
        entity: 'client',
        entityId: client().id,
        organizationId: ORG,
      }),
    ]);
  });
});

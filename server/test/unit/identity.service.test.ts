import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { internal } from '../../src/lib/errors.js';
import type { AccountGateway, ProfileRepository } from '../../src/modules/identity/identity.repository.js';
import { createProfileService, createRegistrationService } from '../../src/modules/identity/identity.service.js';
import type { OrganizationFactory } from '../../src/modules/organizations/organizations.repository.js';
import { expectAppError, NOW, ORG, OWNER, WORKSHOP } from '../support/fixtures.js';

const valid = {
  email: 'duena@correo.bo',
  password: 'secreto-largo',
  first_name: 'Ana',
  last_name: 'Quispe',
  organization_name: 'Motos del Sur',
};

const organization = {
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
};

function setup(overrides: { create?: AccountGateway['create']; factory?: OrganizationFactory['create'] } = {}) {
  const accounts: AccountGateway = {
    create: vi.fn(overrides.create ?? (async () => ({ user_id: OWNER }))),
    remove: vi.fn(async () => undefined),
  };
  const organizations: OrganizationFactory = {
    create: vi.fn(
      overrides.factory ??
        (async (input) => ({
          organization,
          workshop: {
            id: WORKSHOP,
            organization_id: ORG,
            name: input.workshop_name!,
            address: null,
            phone: null,
            is_active: true,
            created_at: NOW,
            updated_at: null,
          },
        })),
    ),
  };
  return { service: createRegistrationService({ accounts, organizations }), accounts, organizations };
}

describe('registro atómico — RF-101', () => {
  it('CP-101.1 — crea cuenta, organización, primer taller y membresía propietaria', async () => {
    const { service, organizations } = setup();
    const result = await service.register(valid);

    expect(result).toMatchObject({ user_id: OWNER, organization: { id: ORG }, workshop: { name: 'Motos del Sur' } });
    // Sin nombre de taller, el primero toma el de la organización: el negocio de un solo local.
    expect(organizations.create).toHaveBeenCalledWith({
      owner_id: OWNER,
      name: 'Motos del Sur',
      workshop_name: 'Motos del Sur',
    });
  });

  it('respeta el nombre del primer taller cuando se indica', async () => {
    const { service } = setup();
    expect((await service.register({ ...valid, workshop_name: 'Taller Centro' })).workshop?.name).toBe('Taller Centro');
  });

  it('CP-101.4 — una contraseña de menos de 8 caracteres se rechaza señalando el campo, sin crear nada', async () => {
    const { service, accounts } = setup();
    const error = (await service.register({ ...valid, password: '1234567' }).catch((e) => e)) as ZodError;
    expect(error).toBeInstanceOf(ZodError);
    expect(error.issues.map((i) => i.path.join('.'))).toEqual(['password']);
    expect(accounts.create).not.toHaveBeenCalled();
  });

  it('CP-101.2 — un correo ya registrado responde 409 y no crea organización', async () => {
    const { service, organizations } = setup({ create: async () => 'email_taken' });
    await expectAppError(service.register(valid), 'auth.email_already_registered', 409);
    expect(organizations.create).not.toHaveBeenCalled();
  });

  it('CP-101.3 — si la creación de la organización falla, se elimina la cuenta y responde 500', async () => {
    const { service, accounts } = setup({
      factory: async () => {
        throw internal('mt_create_organization: fallo simulado');
      },
    });
    const error = await expectAppError(service.register(valid), 'auth.registration_failed', 500);
    expect(accounts.remove).toHaveBeenCalledWith(OWNER);
    expect(error.internalCause).toContain('fallo simulado');
    expect(error.message).not.toContain('fallo simulado');
  });

  it('un fallo del proveedor al crear la cuenta también es auth.registration_failed', async () => {
    const { service, organizations } = setup({
      create: async () => {
        throw new Error('proveedor caído');
      },
    });
    await expectAppError(service.register(valid), 'auth.registration_failed', 500);
    expect(organizations.create).not.toHaveBeenCalled();
  });
});

describe('perfil — RF-104', () => {
  it('CP-104 — devuelve el perfil y las organizaciones con membresía activa, cada una con su rol', async () => {
    const profiles: ProfileRepository = {
      findProfile: async () => ({ id: OWNER, email: 'duena@correo.bo', first_name: 'Ana', last_name: 'Quispe' }),
      listOrganizations: async () => [{ role: 'owner', organization }],
    };
    const me = await createProfileService({ profiles }).me({ userId: OWNER, email: 'duena@correo.bo' });
    expect(me).toEqual({
      user_id: OWNER,
      email: 'duena@correo.bo',
      profile: expect.objectContaining({ first_name: 'Ana' }),
      organizations: [{ role: 'owner', organization }],
    });
  });
});

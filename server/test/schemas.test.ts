import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  createOrganizationSchema,
  inviteMemberSchema,
  updateRoleSchema,
} from '../src/schemas.js';

describe('registerSchema', () => {
  const valid = {
    email: 'ana@test.com',
    password: 'supersecret',
    firstName: 'Ana',
    lastName: 'Gomez',
    organizationName: 'Taller Central',
  };

  it('acepta input valido', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza password corto', () => {
    expect(registerSchema.safeParse({ ...valid, password: '123' }).success).toBe(false);
  });

  it('rechaza email invalido', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'no-es-email' }).success).toBe(false);
  });

  it('rechaza organizationName vacio', () => {
    expect(registerSchema.safeParse({ ...valid, organizationName: '   ' }).success).toBe(false);
  });
});

describe('createOrganizationSchema', () => {
  it('acepta solo el nombre', () => {
    expect(createOrganizationSchema.safeParse({ name: 'Sucursal Norte' }).success).toBe(true);
  });

  it('rechaza sin nombre', () => {
    expect(createOrganizationSchema.safeParse({}).success).toBe(false);
  });
});

describe('inviteMemberSchema', () => {
  it('acepta mechanic y receptionist', () => {
    expect(inviteMemberSchema.safeParse({ email: 'm@test.com', role: 'mechanic' }).success).toBe(true);
    expect(inviteMemberSchema.safeParse({ email: 'r@test.com', role: 'receptionist' }).success).toBe(true);
  });

  it('rechaza invitar como owner', () => {
    expect(inviteMemberSchema.safeParse({ email: 'o@test.com', role: 'owner' }).success).toBe(false);
  });
});

describe('updateRoleSchema', () => {
  it('rechaza cambiar a owner', () => {
    expect(updateRoleSchema.safeParse({ role: 'owner' }).success).toBe(false);
  });
});

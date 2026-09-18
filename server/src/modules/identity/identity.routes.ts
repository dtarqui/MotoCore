import { Hono } from 'hono';
import { requireAuth } from '../../lib/auth.js';
import { readJson } from '../../lib/http.js';
import type { Platform } from '../../platform.js';
import type { AuthEnv } from '../../types.js';
import { supabaseProfileRepository } from './identity.repository.js';
import { createProfileService, createRegistrationService } from './identity.service.js';

/**
 * `/api/auth` — §3.1 del contrato. La interfaz no expone inicio ni renovación
 * de sesión: ocurren contra el proveedor de identidad (ADR-004).
 */
export function identityRoutes(platform: Platform) {
  const app = new Hono<AuthEnv>();

  // Público: el registro es, junto a la comprobación de disponibilidad, la
  // única operación sin credencial (§2.1 del contrato).
  app.post('/register', async (c) => {
    const service = createRegistrationService({
      accounts: platform.accounts,
      organizations: platform.organizationFactory,
    });
    const registration = await service.register(await readJson(c));
    return c.json(registration, 201);
  });

  app.get('/me', requireAuth(platform), async (c) => {
    const service = createProfileService({ profiles: supabaseProfileRepository(c.get('db')) });
    return c.json(await service.me(c.get('identity')));
  });

  return app;
}

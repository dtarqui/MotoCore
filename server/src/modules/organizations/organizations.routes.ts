import { Hono, type Context } from 'hono';
import { requireAuth } from '../../lib/auth.js';
import { requireMembership } from '../../lib/context.js';
import { readJson } from '../../lib/http.js';
import type { Platform } from '../../platform.js';
import type { AuthEnv } from '../../types.js';
import { supabaseOrganizationsRepository } from './organizations.repository.js';
import { createOrganizationsService } from './organizations.service.js';

/**
 * `/api/organizations` — §3.2 del contrato.
 *
 * Único recurso con el identificador de organización en la ruta: aquí la
 * organización es el recurso, no el contexto (§2.3). Por eso no usa el
 * middleware de contexto activo, y la membresía se comprueba en el servicio.
 */
export function organizationRoutes(platform: Platform) {
  const app = new Hono<AuthEnv>();
  app.use('*', requireAuth(platform));

  const service = (c: Context<AuthEnv>) =>
    createOrganizationsService({
      repo: supabaseOrganizationsRepository(c.get('db')),
      factory: platform.organizationFactory,
      membership: (orgId, userId) => requireMembership(platform, orgId, userId),
      audit: platform.audit,
    });

  app.get('/', async (c) => {
    const organizations = await service(c).list(c.get('identity').userId);
    return c.json({ organizations });
  });

  app.post('/', async (c) => {
    const organization = await service(c).create(c.get('identity').userId, await readJson(c));
    return c.json({ organization, role: 'owner' }, 201);
  });

  app.get('/:orgId', async (c) => {
    const organization = await service(c).get(c.get('identity').userId, c.req.param('orgId'));
    return c.json({ organization });
  });

  app.patch('/:orgId', async (c) => {
    const userId = c.get('identity').userId;
    const orgId = c.req.param('orgId');
    const body = await readJson(c);
    const organization = await service(c).update(userId, orgId, body);
    return c.json({ organization });
  });

  app.post('/:orgId/switch', async (c) => {
    const result = await service(c).switchTo(c.get('identity').userId, c.req.param('orgId'));
    return c.json(result);
  });

  return app;
}

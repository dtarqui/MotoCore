import { Hono, type Context } from 'hono';
import { requireAuth } from '../../lib/auth.js';
import { requireOrgContext } from '../../lib/context.js';
import { queryFlag, readJson } from '../../lib/http.js';
import type { Platform } from '../../platform.js';
import type { OrgEnv } from '../../types.js';
import { supabaseClientsRepository } from './clients.repository.js';
import { createClientsService } from './clients.service.js';

/**
 * `/api/clients` — §3.5 del contrato.
 *
 * Exige `X-Org-Id` y **no** `X-Workshop-Id`: el cliente pertenece a la
 * organización, y esa ausencia en el contrato es la evidencia del alcance por
 * nivel (RF-502).
 */
export function clientRoutes(platform: Platform) {
  const app = new Hono<OrgEnv>();
  app.use('*', requireAuth(platform), requireOrgContext(platform));

  const service = (c: Context<OrgEnv>) =>
    createClientsService({ repo: supabaseClientsRepository(c.get('db')), audit: platform.audit });

  app.get('/', async (c) => {
    const clients = await service(c).list(c.get('ctx'), {
      search: c.req.query('search'),
      includeInactive: queryFlag(c.req.query('includeInactive')),
    });
    return c.json({ clients });
  });

  app.post('/', async (c) => {
    const client = await service(c).create(c.get('ctx'), await readJson(c));
    return c.json({ client }, 201);
  });

  app.get('/:clientId', async (c) => {
    const client = await service(c).get(c.get('ctx'), c.req.param('clientId'));
    return c.json({ client });
  });

  app.patch('/:clientId', async (c) => {
    const body = await readJson(c);
    const client = await service(c).update(c.get('ctx'), c.req.param('clientId'), body);
    return c.json({ client });
  });

  app.post('/:clientId/deactivate', async (c) => {
    const client = await service(c).deactivate(c.get('ctx'), c.req.param('clientId'));
    return c.json({ client });
  });

  return app;
}

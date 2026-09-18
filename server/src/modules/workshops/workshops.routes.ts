import { Hono, type Context } from 'hono';
import { requireAuth } from '../../lib/auth.js';
import { requireOrgContext } from '../../lib/context.js';
import { queryFlag, readJson } from '../../lib/http.js';
import type { Platform } from '../../platform.js';
import type { OrgEnv } from '../../types.js';
import { supabaseWorkshopsRepository } from './workshops.repository.js';
import { createWorkshopsService } from './workshops.service.js';

/**
 * `/api/workshops` — §3.3 del contrato. El taller es un recurso interior a la
 * organización: el contexto llega por `X-Org-Id`, no anidado en la ruta.
 */
export function workshopRoutes(platform: Platform) {
  const app = new Hono<OrgEnv>();
  app.use('*', requireAuth(platform), requireOrgContext(platform));

  const service = (c: Context<OrgEnv>) =>
    createWorkshopsService({ repo: supabaseWorkshopsRepository(c.get('db')), audit: platform.audit });

  app.get('/', async (c) => {
    const workshops = await service(c).list(c.get('ctx'), {
      includeInactive: queryFlag(c.req.query('includeInactive')),
    });
    return c.json({ workshops });
  });

  app.post('/', async (c) => {
    const workshop = await service(c).create(c.get('ctx'), await readJson(c));
    return c.json({ workshop }, 201);
  });

  app.get('/:workshopId', async (c) => {
    const workshop = await service(c).get(c.get('ctx'), c.req.param('workshopId'));
    return c.json({ workshop });
  });

  app.patch('/:workshopId', async (c) => {
    const body = await readJson(c);
    const workshop = await service(c).update(c.get('ctx'), c.req.param('workshopId'), body);
    return c.json({ workshop });
  });

  app.post('/:workshopId/deactivate', async (c) => {
    const workshop = await service(c).deactivate(c.get('ctx'), c.req.param('workshopId'));
    return c.json({ workshop });
  });

  app.get('/:workshopId/assignments', async (c) => {
    const assignments = await service(c).listAssignments(c.get('ctx'), c.req.param('workshopId'));
    return c.json({ assignments });
  });

  app.post('/:workshopId/assignments', async (c) => {
    const body = await readJson(c);
    const { assignment, created } = await service(c).assign(c.get('ctx'), c.req.param('workshopId'), body);
    return c.json({ assignment }, created ? 201 : 200);
  });

  app.delete('/:workshopId/assignments/:userId', async (c) => {
    await service(c).unassign(c.get('ctx'), c.req.param('workshopId'), c.req.param('userId'));
    return c.body(null, 204);
  });

  return app;
}

import { Hono, type Context } from 'hono';
import { requireAuth } from '../../lib/auth.js';
import { requireWorkshopContext } from '../../lib/context.js';
import { queryFlag, readJson } from '../../lib/http.js';
import type { Platform } from '../../platform.js';
import type { WorkshopEnv } from '../../types.js';
import { supabaseInventoryRepository } from './inventory.repository.js';
import { createInventoryService } from './inventory.service.js';

/**
 * `/api/inventory` — §3.6 del contrato. Exige `X-Org-Id` **y** `X-Workshop-Id`:
 * las existencias pertenecen a un local concreto (RF-303, RF-602).
 */
export function inventoryRoutes(platform: Platform) {
  const app = new Hono<WorkshopEnv>();
  app.use('*', requireAuth(platform), requireWorkshopContext(platform));

  const service = (c: Context<WorkshopEnv>) =>
    createInventoryService({ repo: supabaseInventoryRepository(c.get('db')) });

  app.get('/parts', async (c) => {
    const parts = await service(c).listParts(c.get('ctx'), {
      search: c.req.query('search'),
      lowStock: queryFlag(c.req.query('lowStock')),
      includeInactive: queryFlag(c.req.query('includeInactive')),
    });
    return c.json({ parts });
  });

  app.post('/parts', async (c) => {
    const part = await service(c).createPart(c.get('ctx'), await readJson(c));
    return c.json({ part }, 201);
  });

  app.get('/parts/:partId', async (c) => {
    const part = await service(c).getPart(c.get('ctx'), c.req.param('partId'));
    return c.json({ part });
  });

  app.patch('/parts/:partId', async (c) => {
    const body = await readJson(c);
    const part = await service(c).updatePart(c.get('ctx'), c.req.param('partId'), body);
    return c.json({ part });
  });

  app.get('/parts/:partId/movements', async (c) => {
    const movements = await service(c).listMovements(c.get('ctx'), c.req.param('partId'));
    return c.json({ movements });
  });

  app.post('/parts/:partId/movements', async (c) => {
    const body = await readJson(c);
    const movement = await service(c).registerMovement(c.get('ctx'), c.req.param('partId'), body);
    return c.json({ movement }, 201);
  });

  app.post('/parts/:partId/transfer', async (c) => {
    const body = await readJson(c);
    const movements = await service(c).transfer(c.get('ctx'), c.req.param('partId'), body);
    return c.json({ movements }, 201);
  });

  return app;
}

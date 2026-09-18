import { Hono, type Context } from 'hono';
import { requireAuth } from '../../lib/auth.js';
import { requireOrgContext } from '../../lib/context.js';
import { queryFlag, readJson } from '../../lib/http.js';
import type { Platform } from '../../platform.js';
import type { OrgEnv } from '../../types.js';
import { supabaseMembersRepository } from './members.repository.js';
import { createMembersService } from './members.service.js';

/**
 * `/api/members` — §3.4 del contrato. La membresía es interior a la
 * organización: el contexto llega por `X-Org-Id`.
 *
 * La remoción es `DELETE` y no `POST /deactivate`: lo que se revoca es el
 * **vínculo** entre la cuenta y la organización (§2.6, excepción declarada).
 */
export function memberRoutes(platform: Platform) {
  const app = new Hono<OrgEnv>();
  app.use('*', requireAuth(platform), requireOrgContext(platform));

  const service = (c: Context<OrgEnv>) =>
    createMembersService({ repo: supabaseMembersRepository(c.get('db')), audit: platform.audit });

  app.get('/', async (c) => {
    const members = await service(c).list(c.get('ctx'), {
      includeInactive: queryFlag(c.req.query('includeInactive')),
    });
    return c.json({ members });
  });

  app.post('/invite', async (c) => {
    const member = await service(c).invite(c.get('ctx'), await readJson(c));
    return c.json({ member }, 201);
  });

  app.patch('/:userId/role', async (c) => {
    const body = await readJson(c);
    const member = await service(c).changeRole(c.get('ctx'), c.req.param('userId'), body);
    return c.json({ member });
  });

  app.delete('/:userId', async (c) => {
    await service(c).remove(c.get('ctx'), c.req.param('userId'));
    return c.body(null, 204);
  });

  return app;
}

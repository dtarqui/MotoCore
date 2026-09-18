import { Hono } from 'hono';
import { requireAuth } from '../../lib/auth.js';
import { requireOrgContext } from '../../lib/context.js';
import type { Platform } from '../../platform.js';
import type { OrgEnv } from '../../types.js';
import { supabaseAuditRepository } from './audit.repository.js';
import { createAuditService } from './audit.service.js';

/**
 * `/api/audit` — §3.7 del contrato. Nivel organización, reservado al Owner.
 * Solo `GET`: el contrato no expone modificación ni borrado del registro.
 */
export function auditRoutes(platform: Platform) {
  const app = new Hono<OrgEnv>();
  app.use('*', requireAuth(platform), requireOrgContext(platform));

  app.get('/', async (c) => {
    const service = createAuditService({ repo: supabaseAuditRepository(c.get('db')) });
    const entries = await service.list(c.get('ctx'), c.req.query());
    return c.json({ entries });
  });

  return app;
}

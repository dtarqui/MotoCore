import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleError } from './lib/errors.js';
import { authRoutes } from './modules/auth.js';
import { organizationRoutes } from './modules/organizations.js';
import { workshopRoutes } from './modules/workshops.js';
import { clientRoutes } from './modules/clients.js';
import { inventoryRoutes } from './modules/inventory.js';
import { auditRoutes } from './modules/audit.js';
import type { AppBindings } from './types.js';

/** Construye la app Hono. Sirve tanto para el dev-server local como para Vercel. */
export function createApp() {
  const app = new Hono<AppBindings>();

  app.use(
    '*',
    cors({
      origin: (origin) => origin ?? '*',
      allowHeaders: ['Authorization', 'Content-Type', 'X-Org-Id', 'X-Workshop-Id'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      exposeHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
    }),
  );

  app.onError(handleError);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/api/auth', authRoutes);
  // Las sucursales se montan antes que la empresa para que su ruta anidada no
  // quede capturada por los handlers de /:orgId de organizationRoutes.
  app.route('/api/organizations/:orgId/workshops', workshopRoutes);
  app.route('/api/organizations', organizationRoutes);
  // Modulos de negocio: la empresa activa viaja en X-Org-Id, no en la ruta.
  app.route('/api/clients', clientRoutes);
  // Inventario exige ademas la sucursal activa (X-Workshop-Id).
  app.route('/api/inventory', inventoryRoutes);
  // Auditoria: nivel empresa, reservada al Owner (RF-704).
  app.route('/api/audit', auditRoutes);

  return app;
}

export type App = ReturnType<typeof createApp>;

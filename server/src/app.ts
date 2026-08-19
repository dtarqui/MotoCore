import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleError } from './lib/errors.js';
import { authRoutes } from './modules/auth.js';
import { organizationRoutes } from './modules/organizations.js';
import { workshopRoutes } from './modules/workshops.js';
import { memberRoutes } from './modules/members.js';
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

  // Regla de rutas del §2.3 del contrato: el identificador de la organizacion
  // aparece en la ruta SOLO cuando el recurso es la organizacion misma. Todo lo
  // interior a ella —talleres, miembros, clientes, inventario, auditoria— se
  // resuelve por la cabecera X-Org-Id, de modo que exista un unico mecanismo de
  // contexto y un unico punto donde validarlo (ADR-005).
  app.route('/api/organizations', organizationRoutes);

  app.route('/api/workshops', workshopRoutes);
  app.route('/api/members', memberRoutes);
  app.route('/api/clients', clientRoutes);
  // Inventario exige ademas el taller activo (X-Workshop-Id).
  app.route('/api/inventory', inventoryRoutes);
  // Auditoria: nivel organizacion, reservada al Owner (RF-704).
  app.route('/api/audit', auditRoutes);

  return app;
}

export type App = ReturnType<typeof createApp>;

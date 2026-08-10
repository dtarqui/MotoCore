import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleError } from './lib/errors.js';
import { authRoutes } from './modules/auth.js';
import { organizationRoutes } from './modules/organizations.js';
import type { AppBindings } from './types.js';

/** Construye la app Hono. Sirve tanto para el dev-server local como para Vercel. */
export function createApp() {
  const app = new Hono<AppBindings>();

  app.use(
    '*',
    cors({
      origin: (origin) => origin ?? '*',
      allowHeaders: ['Authorization', 'Content-Type', 'X-Org-Id'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      exposeHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
    }),
  );

  app.onError(handleError);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/api/auth', authRoutes);
  app.route('/api/organizations', organizationRoutes);

  return app;
}

export type App = ReturnType<typeof createApp>;

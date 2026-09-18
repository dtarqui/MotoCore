import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAllowedOrigins } from './lib/env.js';
import { handleError, handleNotFound } from './lib/errors.js';
import { requestLog } from './lib/logging.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { clientRoutes } from './modules/clients/clients.routes.js';
import { identityRoutes } from './modules/identity/identity.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { memberRoutes } from './modules/members/members.routes.js';
import { organizationRoutes } from './modules/organizations/organizations.routes.js';
import { workshopRoutes } from './modules/workshops/workshops.routes.js';
import { supabasePlatform, type Platform } from './platform.js';

/**
 * Construye la aplicación: un monolito modular desplegado como funciones
 * serverless (ADR-009). Sirve igual al servidor de desarrollo, a Vercel y a las
 * pruebas, que pueden sustituir piezas de la plataforma (ver `platform.ts`).
 */
export function createApp(overrides: Partial<Platform> = {}) {
  const platform: Platform = { ...supabasePlatform, ...overrides };
  const app = new Hono();

  // Una línea por invocación, con el identificador de la organización activa
  // (Arquitectura, sección 15; riesgo R10).
  app.use('*', requestLog());

  // Solo los orígenes del cliente web de cada entorno (Requisitos, sección 5).
  app.use(
    '*',
    cors({
      origin: getAllowedOrigins(),
      allowHeaders: ['Authorization', 'Content-Type', 'X-Org-Id', 'X-Workshop-Id'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  app.onError(handleError);
  app.notFound(handleNotFound);

  // Comprobación de disponibilidad: pública, sin tocar la base (§2.1).
  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/api/auth', identityRoutes(platform));

  // Regla de rutas del §2.3 del contrato: el identificador de la organización
  // aparece en la ruta SOLO cuando el recurso es la organización misma. Todo lo
  // interior a ella se resuelve por la cabecera X-Org-Id, de modo que exista un
  // único mecanismo de contexto y un único punto donde validarlo (ADR-005).
  app.route('/api/organizations', organizationRoutes(platform));
  app.route('/api/workshops', workshopRoutes(platform));
  app.route('/api/members', memberRoutes(platform));
  app.route('/api/clients', clientRoutes(platform));
  // Nivel taller: exige además X-Workshop-Id.
  app.route('/api/inventory', inventoryRoutes(platform));
  app.route('/api/audit', auditRoutes(platform));

  return app;
}

export type App = ReturnType<typeof createApp>;

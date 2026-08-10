# MotoCore — Backend Node/TypeScript (Supabase)

Reescritura del backend a **Node/TS + Hono** sobre **Supabase** (Postgres + Auth + RLS), con **multitenancy estilo ERP**: una cuenta puede administrar varias organizaciones (empresas), como QuickBooks/Zoho. Se despliega en **Vercel** como serverless functions.

> Esta es la **base multitenant** (Auth + Organizations + Membership). Los módulos de negocio (Clients, Motorcycles, WorkOrders, Inventory, MaintenanceHistory, Audit) se portan en iteraciones siguientes reusando este patrón. El backend .NET original vive en la rama `feat/backend-net-hardening`.

## Stack

- **Hono** — API HTTP en TypeScript, Vercel-nativo.
- **Supabase** — Postgres, Auth (registro/login/refresh/OAuth), RLS para aislamiento por tenant.
- **Zod** — validación de requests.
- **Vitest** — tests.

## Modelo de datos (multitenancy)

| Tabla | Rol |
|---|---|
| `auth.users` | Identidad global (gestionada por Supabase Auth) |
| `profiles` | Datos de perfil 1:1 con el usuario |
| `organizations` | Empresa/compañía (era "workshop") |
| `memberships` | `user ↔ organization` con rol (`owner`/`mechanic`/`receptionist`) — **N por usuario** |

El aislamiento lo garantizan **políticas RLS** (un usuario solo ve filas de organizaciones donde tiene membership activa) **más** chequeos de membership en la capa de API (mismo patrón que el .NET original). La organización activa se selecciona por request con el header `X-Org-Id` (estilo cambio de organización de QuickBooks/Zoho).

## Endpoints (esta iteración)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | — | Health check |
| POST | `/api/auth/register` | — | Crea cuenta + 1ª organización + membership Owner |
| GET | `/api/auth/me` | Bearer | Perfil + organizaciones (con rol) |
| GET | `/api/organizations` | Bearer | Organizaciones del usuario (por membership) |
| POST | `/api/organizations` | Bearer | Crear organización (el creador queda Owner) |
| GET | `/api/organizations/:id` | Bearer (miembro) | Detalle de la organización |
| POST | `/api/organizations/:id/switch` | Bearer (miembro) | Validar y activar organización |
| GET | `/api/organizations/:id/members` | Bearer (miembro) | Listar miembros |
| POST | `/api/organizations/:id/members/invite` | Bearer (Owner) | Invitar usuario existente |
| PATCH | `/api/organizations/:id/members/:userId/role` | Bearer (Owner) | Cambiar rol de un miembro |
| DELETE | `/api/organizations/:id/members/:userId` | Bearer (Owner) | Quitar un miembro |

El **login** se hace desde el cliente con Supabase Auth (`signInWithPassword`), no por este API. El cliente envía el access token de Supabase en `Authorization: Bearer <token>`.

Los errores se devuelven como **ProblemDetails** (RFC 7807) con códigos `modulo.razon` (mismo catálogo que el backend .NET), para que el `api-client` del frontend los maneje sin cambios.

## Setup

1. **Crear un proyecto Supabase** (https://supabase.com).
2. **Aplicar la migración**: en el SQL Editor de Supabase, pegar y ejecutar `supabase/migrations/0001_init_multitenancy.sql` (o `supabase db push` si usas la CLI).
3. **Configurar el entorno**: copiar `.env.example` a `.env` y completar con los valores de *Project Settings → API*:
   ```
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   AUTH_AUTO_CONFIRM_EMAIL=true   # dev: permite iniciar sesión sin confirmar email
   ```
4. **Instalar y correr**:
   ```bash
   npm install
   npm run dev        # http://localhost:8787
   npm test           # unit + HTTP (los tests de integración corren solo si hay credenciales)
   npm run typecheck
   ```

## Tests

- `test/schemas.test.ts` y `test/app.test.ts` corren **sin Supabase** (validación, rutas, auth 401, mapeo de errores).
- `test/integration.test.ts` corre **solo con credenciales** (`describe.skipIf`): ejercita registro → varias organizaciones → **aislamiento entre cuentas** → invitación. Requiere la migración aplicada y `AUTH_AUTO_CONFIRM_EMAIL=true`.

## Deploy en Vercel

- Este directorio (`server/`) es un proyecto Vercel independiente. `vercel.json` reescribe todas las rutas a la función `api/index.ts`, que ejecuta la app Hono completa.
- Configurar en Vercel las variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (y `AUTH_AUTO_CONFIRM_EMAIL` según el entorno). **Nunca** commitear la service-role key.
- El frontend (Vite) se despliega como sitio estático (otro proyecto Vercel) apuntando a la URL de este API y usando `@supabase/supabase-js` para el login.

## Pendiente (próximas iteraciones)

- Integración del frontend: adoptar Supabase Auth en el login/registro y agregar el **selector de organización** (envía `X-Org-Id`).
- Portar los módulos de negocio (Clients → Motorcycles → WorkOrders → Inventory → MaintenanceHistory → Audit) con sus tablas + RLS por `organization_id`.
- Features del roadmap competitivo (estimaciones con aprobación, facturación/pagos, booking, DVI, portal del cliente).

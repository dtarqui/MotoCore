# MotoCore — Backend Node/TypeScript (Supabase)

Reescritura del backend a **Node/TS + Hono** sobre **Supabase** (Postgres + Auth + RLS), con **multitenancy jerárquica**: una cuenta administra varias **empresas** (`organizations`) y cada empresa opera varias **sucursales** (`workshops`). Se despliega en **Vercel** como serverless functions.

> **Alcance actual**: base multitenant (Auth + Empresas + Membresías + Sucursales) y el corte vertical de negocio — **Clientes** (nivel empresa) e **Inventario** (nivel sucursal) — más el registro de auditoría. Los módulos que siguen solo en el backend .NET (Motorcycles, WorkOrders, MaintenanceHistory, Dashboard) se portarían reusando este patrón; están fuera del alcance del proyecto de grado. El backend .NET legacy vive en `backend/` y en la rama `feat/backend-net-hardening`.
>
> La especificación que gobierna este código está en [`docs/`](../docs/README.md): terminología en el [Glosario](../docs/ingenieria/01-glosario.md), reglas en [Requisitos](../docs/ingenieria/02-requisitos.md) y esquema en [Modelo de datos](../docs/ingenieria/05-modelo-datos.md).

## Stack

- **Hono** — API HTTP en TypeScript, Vercel-nativo.
- **Supabase** — Postgres, Auth (registro/login/refresh/OAuth), RLS para aislamiento por tenant.
- **Zod** — validación de requests.
- **Vitest** — tests.

## Modelo de datos (multitenancy)

| Tabla | Nivel | Rol |
|---|---|---|
| `auth.users` | — | Identidad global (gestionada por Supabase Auth) |
| `profiles` | — | Datos de perfil 1:1 con el usuario |
| `organizations` | *tenant* | **Empresa** — unidad de aislamiento |
| `workshops` | empresa | **Sucursal** — local físico dentro de una empresa |
| `memberships` | empresa | `user ↔ organization` con rol (`owner`/`mechanic`/`receptionist`) — **N por usuario** |
| `workshop_assignments` | empresa | En qué sucursales trabaja un miembro (operativo, no afecta permisos) |
| `clients` | empresa | Clientes, visibles desde cualquier sucursal de la empresa |
| `parts` | sucursal | Repuestos con existencia propia por sucursal |
| `part_movements` | sucursal | Historial inmutable de movimientos de stock |
| `audit_log` | empresa | Acciones críticas (RF-703), inmutable |

Toda tabla de negocio lleva `organization_id` —también las de nivel sucursal, que llevan además `workshop_id`— para que las políticas se evalúen siempre sobre el mismo criterio.

El aislamiento lo garantizan **políticas RLS** (un usuario solo ve filas de empresas donde tiene membresía activa) **más** chequeos de membresía en la capa de API. El contexto activo viaja por request: `X-Org-Id` para la empresa (estilo cambio de organización de QuickBooks/Zoho) y `X-Workshop-Id` para la sucursal en los módulos que lo requieren. El servidor no asume ninguno por defecto.

## Endpoints

### Identidad y empresas

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | — | Health check |
| POST | `/api/auth/register` | — | Crea cuenta + 1ª empresa + 1ª sucursal + membresía Owner (atómico, vía `register_account`) |
| GET | `/api/auth/me` | Bearer | Perfil + empresas (con rol) |
| GET | `/api/organizations` | Bearer | Empresas del usuario (por membresía) |
| POST | `/api/organizations` | Bearer | Crear empresa (el creador queda Owner) |
| GET | `/api/organizations/:orgId` | Bearer (miembro) | Detalle de la empresa |
| PATCH | `/api/organizations/:orgId` | Bearer (Owner) | Editar datos de la empresa |
| POST | `/api/organizations/:orgId/switch` | Bearer (miembro) | Validar y activar empresa |
| GET | `/api/organizations/:orgId/members` | Bearer (miembro) | Listar miembros |
| POST | `/api/organizations/:orgId/members/invite` | Bearer (Owner) | Invitar usuario existente |
| PATCH | `/api/organizations/:orgId/members/:userId/role` | Bearer (Owner) | Cambiar rol de un miembro |
| DELETE | `/api/organizations/:orgId/members/:userId` | Bearer (Owner) | Quitar un miembro |

### Sucursales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/organizations/:orgId/workshops` | Bearer (miembro) | Listar sucursales de la empresa |
| POST | `/api/organizations/:orgId/workshops` | Bearer (Owner) | Crear sucursal |
| GET | `/api/organizations/:orgId/workshops/:workshopId` | Bearer (miembro) | Detalle de la sucursal |
| PATCH | `/api/organizations/:orgId/workshops/:workshopId` | Bearer (Owner) | Editar sucursal |
| PATCH | `/api/organizations/:orgId/workshops/:workshopId/deactivate` | Bearer (Owner) | Desactivar (baja lógica) |
| GET | `/api/organizations/:orgId/workshops/:workshopId/assignments` | Bearer (miembro) | Miembros asignados |
| POST | `/api/organizations/:orgId/workshops/:workshopId/assignments` | Bearer (Owner) | Asignar miembro |
| DELETE | `/api/organizations/:orgId/workshops/:workshopId/assignments/:userId` | Bearer (Owner) | Quitar asignación |

### Negocio — requieren contexto activo por cabecera

**Clientes** (nivel empresa — requieren `X-Org-Id`):

| Método | Ruta | Descripción |
|---|---|---|
| GET / POST | `/api/clients` | Listar y buscar · crear |
| GET / PATCH | `/api/clients/:clientId` | Detalle · editar |
| PATCH | `/api/clients/:clientId/deactivate` | Baja lógica |

**Inventario** (nivel sucursal — requieren `X-Org-Id` **y** `X-Workshop-Id`):

| Método | Ruta | Descripción |
|---|---|---|
| GET / POST | `/api/inventory/parts` | Listar (incluye filtro de bajo stock) · crear repuesto |
| GET / PATCH | `/api/inventory/parts/:partId` | Detalle · editar |
| GET / POST | `/api/inventory/parts/:partId/movements` | Historial de movimientos · registrar movimiento |
| POST | `/api/inventory/parts/:partId/transfer` | Transferir existencias a otra sucursal de la misma empresa |

El **login** se hace desde el cliente con Supabase Auth (`signInWithPassword`), no por este API. El cliente envía el access token de Supabase en `Authorization: Bearer <token>`.

Los errores se devuelven como **Problem Details** (RFC 9457, que sustituye al RFC 7807) con códigos `modulo.razon` — mismo catálogo que el backend .NET, para que el `api-client` del frontend los maneje sin cambios.

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

Corren **sin Supabase** (validación, rutas, auth 401, contexto activo obligatorio, mapeo de errores):

- `test/schemas.test.ts` · `test/app.test.ts` — esquemas Zod y superficie HTTP base.
- `test/workshops.test.ts` — rutas de sucursales y asignaciones.
- `test/business-routes.test.ts` — clientes e inventario: exigencia de `X-Org-Id` / `X-Workshop-Id` y validación de entrada.

Corren **solo con credenciales** (`describe.skipIf`). Requieren las migraciones aplicadas y `AUTH_AUTO_CONFIRM_EMAIL=true`:

- `test/integration.test.ts` — registro → varias empresas → **aislamiento entre cuentas vía API** (RF-701) → invitación.
- `test/rls.test.ts` — **aislamiento por acceso directo a la base de datos** (RF-702), sin pasar por la capa de aplicación. Es la prueba que sostiene la premisa central del proyecto.

## Deploy en Vercel

- Este directorio (`server/`) es un proyecto Vercel independiente. `vercel.json` reescribe todas las rutas a la función `api/index.ts`, que ejecuta la app Hono completa.
- Configurar en Vercel las variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (y `AUTH_AUTO_CONFIRM_EMAIL` según el entorno). **Nunca** commitear la service-role key.
- El frontend (Vite) se despliega como sitio estático (otro proyecto Vercel) apuntando a la URL de este API y usando `@supabase/supabase-js` para el login.

## Pendiente (próximas iteraciones)

- Integración del frontend: adoptar Supabase Auth en el login/registro y agregar los **selectores de empresa y sucursal** (envían `X-Org-Id` y `X-Workshop-Id`).
- Endpoint de consulta del registro de auditoría, reservado al `Owner` (RF-704). Hoy la auditoría solo se **escribe**.
- Portar los módulos que siguen en el backend .NET (Motorcycles → WorkOrders → MaintenanceHistory → Dashboard) con sus tablas + RLS por `organization_id`. Están fuera del alcance del proyecto de grado (RF-800).
- Funcionalidades del [análisis del mercado](../docs/ingenieria/09-analisis-mercado.md): facturación electrónica del SIN, WhatsApp, presupuestos con aprobación, agendamiento, portal del cliente.

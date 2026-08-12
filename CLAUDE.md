# CLAUDE.md

Guía de contexto para Claude Code al trabajar en este repositorio.

## Qué es MotoCore

SaaS multi-tenant para gestión de talleres de motocicletas, evolucionando a un modelo **ERP multiempresa**: una cuenta administra **varias organizaciones/empresas** (estilo QuickBooks/Zoho), con datos aislados por organización. **Mercado objetivo por ahora: Bolivia.** Ver [README.md](README.md), `docs/*.md` y sobre todo [docs/roadmap-competitivo.md](docs/roadmap-competitivo.md) para el contexto de producto y el roadmap.

## Estado actual: PIVOTE de backend en curso (leer primero)

El backend se está reescribiendo de **.NET → Node/TypeScript + Supabase** para desplegar en **Vercel** (Vercel no ejecuta .NET). Conviven **dos backends** en el repo:

- **`server/` — backend NUEVO y objetivo** (Node/TS + Hono + Supabase). Aquí va todo el trabajo nuevo. La **base multitenant** (Auth + Organizations + Membership) ya está lista y con tests.
- **`backend/` — backend .NET legacy**, aún funcional; sirve como **referencia de la lógica de negocio** hasta que `server/` lo reemplace. El endurecimiento .NET completo (tests, paginación, healthchecks, scrub de secretos) está preservado en la rama **`feat/backend-net-hardening`**.
- **`frontend/` — React/Vite**, hoy conectado al backend **.NET**. Pendiente: migrar auth a Supabase + agregar selector de organización.

**Decisiones estratégicas ya confirmadas con el usuario:**
- Stack nuevo: **Hono + Supabase** (Postgres + Auth + RLS + Storage) + **Zod**, desplegado en **Vercel**. El frontend React/Vite se mantiene.
- **Multitenancy ERP**: una cuenta → N organizaciones, con organización activa por request vía header `X-Org-Id`.
- **Mercado Bolivia**, dos features clave del roadmap: **WhatsApp** (Business API) y **facturación electrónica del SIN** (Servicio de Impuestos Nacionales: CUIS/CUFD/CUF, firma digital, XML RND 102100000011).

## Estructura del repo

```
server/     NUEVO backend — Node/TS (Hono) + Supabase. Objetivo de la reescritura.
backend/    Backend .NET (legacy, referencia). Se elimina cuando server/ lo reemplace.
frontend/   React 19 + TypeScript + Vite (hoy contra el backend .NET).
docs/       Docs de producto + roadmap-competitivo.md (enfocado en Bolivia).
docker-compose.yml   Stack .NET legacy (Postgres + backend + frontend).
.github/workflows/   CI del backend .NET / frontend.
```

## Backend nuevo (`server/`) — aquí va el trabajo nuevo

Node/TS + Hono sobre Supabase. Estructura:

- `supabase/migrations/0001_init_multitenancy.sql` — esquema + **RLS**: `profiles`, `organizations`, `memberships`, funciones helper (`is_org_member`, `is_org_owner`), trigger de creación de perfil, y RPC `get_user_id_by_email` (para invitaciones).
- `src/lib/` — `supabase.ts` (clientes service-role y user-scoped), `auth.ts` (middleware que verifica el JWT de Supabase), `errors.ts` (ProblemDetails + `AppError`, códigos `modulo.razon`), `memberships.ts` (`requireMembership`/`requireOwner`), `org-context.ts` (`requireActiveOrg` vía `X-Org-Id`, para módulos de negocio futuros), `env.ts`.
- `src/modules/` — `auth.ts` (register, me), `organizations.ts` (listar por membership, crear, switch, y gestión de miembros: invite/role/remove, solo Owner).
- `src/schemas.ts` (Zod), `src/app.ts` (arma la app Hono), `src/dev-server.ts`, `api/index.ts` (handler Vercel), `vercel.json`.
- `test/` — Vitest: `schemas.test.ts` + `app.test.ts` corren **sin Supabase**; `integration.test.ts` corre **solo con credenciales** (registro → varias orgs → aislamiento → invitación).

**Patrones (seguirlos, no reinventar):**
- Errores como excepciones `AppError(code, message, status)` mapeadas a **ProblemDetails** (RFC 7807). Códigos `modulo.razon` (mismo catálogo que el .NET) para que el `api-client` del frontend no cambie.
- **Aislamiento multi-tenant en dos capas**: RLS en Postgres (defensa de fondo) + `requireMembership(orgId, userId)` explícito al inicio de cada handler (mismo espíritu que el `GetMembershipAsync` del .NET).
- **Auth**: la maneja **Supabase Auth** (registro/login/refresh/OAuth). El API solo **verifica** el token (`Authorization: Bearer`). El login se hace en el cliente con `supabase.auth.signInWithPassword`, no en este API.
- **Organización activa** por request vía header `X-Org-Id`, validado contra membership (habilita el cambio de organización estilo ERP).

**Comandos (`server/`):**
```bash
npm install
npm run dev        # dev-server local en http://localhost:8787
npm run typecheck
npm test           # unit + HTTP; la integración corre solo con credenciales de Supabase
```
**Setup Supabase**: crear proyecto → aplicar `supabase/migrations/0001_init_multitenancy.sql` en el SQL Editor → copiar `.env.example` a `.env` con las claves (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_AUTO_CONFIRM_EMAIL=true` en dev). Detalle en [server/README.md](server/README.md).

**Hecho vs. pendiente en `server/`:**
- **Hecho**: base multitenant (register que crea cuenta + 1ª organización + Owner; `me`; organizations CRUD + switch; members invite/role/remove con las reglas del .NET), RLS, y tests (13 unit/HTTP verdes; 5 de integración gated por credenciales). Typecheck limpio.
- **Pendiente**: portar los módulos de negocio (`Clients → Motorcycles → WorkOrders → Inventory → MaintenanceHistory → Audit`) con tablas + RLS por `organization_id`; integrar el frontend (Supabase Auth + selector de organización); features Bolivia (WhatsApp, facturación SIN). No hay verificación end-to-end todavía porque requiere un proyecto Supabase real.

## Modelo multitenancy ERP (el cambio conceptual central)

- `auth.users` (Supabase) = identidad global; `profiles` = datos de perfil 1:1.
- `organizations` (renombra "workshop") = empresa/compañía. **Una cuenta puede crear y pertenecer a varias.**
- `memberships` = `user ↔ organization` con rol (`owner`/`mechanic`/`receptionist`), **N por usuario**, unique `(organization_id, user_id)`.
- Todo dato de negocio se scopea por **`organization_id`** (renombra `workshop_id` del .NET).
- El registro crea la **1ª organización + membership Owner**. Nuevas orgs vía `POST /api/organizations`.

## Backend legacy (`backend/`) — .NET, solo referencia

Clean Architecture (.NET 10): `MotoCore.Domain` (entidades) → `MotoCore.Application` (servicios, contratos, DTOs, validadores FluentValidation, Result Pattern) → `MotoCore.Infrastructure` (EF Core `MotoCoreDbContext`, repos, JWT) → `MotoCore.Api` (Minimal API endpoints en `Controllers/`, `Program.cs`). Módulos: `Clients`, `Motorcycles`, `WorkOrders`, `Inventory`, `MaintenanceHistory`, `Workshops`, `Users`, `Auth`, `Audit` — su lógica de negocio es la **especificación a portar** a `server/`. Aislamiento por `IWorkshopRepository.GetMembershipAsync(workshopId, userId)` + rol.

Reglas de negocio a preservar al portar (viven en los `Services/` del .NET): numeración de órdenes `WO-{año}-{secuencia}`, matemática de stock por tipo de movimiento (Purchase/Sale/Adjustment/…), transiciones de estado de la orden, y audit log. Los secretos de config están reemplazados por placeholders (`CHANGE_ME`) tras el scrub de seguridad.

> Nota: en `main` este backend ya **no** debe recibir features nuevas — el trabajo nuevo va en `server/`. Se conserva como referencia y se eliminará cuando `server/` cubra los módulos.

## Frontend (`frontend/`)

React 19 + Vite + TypeScript + TailwindCSS 4 + React Query + React Router 7. Alias `@/` → `src/`. Módulos en `src/modules/<modulo>/` (`types.ts`, `<modulo>-api.ts` que llama a `apiRequest` de `shared/lib/api-client.ts`, `pages/`). `useAuth().hasAnyRole([...])` condiciona acciones por rol. UI compartida en `src/shared/ui/` (estilo shadcn/ui).

Hoy apunta al backend **.NET** (`VITE_API_BASE_URL`). **Pendiente** (parte de la reescritura): adoptar `@supabase/supabase-js` para auth, apuntar al backend `server/`, y agregar el **selector de organización** que envía `X-Org-Id`.

```bash
npm run dev      # servidor de desarrollo
npm run build    # tsc -b + vite build
npm run lint
```

## Mercado Bolivia (features diferenciadoras)

- **WhatsApp Business API**: presupuestos (con link de aprobación), estado de la orden y recordatorios. Canal por defecto en Bolivia.
- **Facturación electrónica del SIN**: emitir la factura de la orden como factura en línea del SIN (XML con **CUF/CUFD**, **CUIS**, **firma digital**, RND Nº 102100000011; modalidades En Línea / Computarizada / Portal Web). Es requisito de cumplimiento. **Validar la normativa vigente del SIN antes de implementar** (las RND y los plazos cambian; el plazo de adecuación estaba extendido hasta sep-2026).
- Prioridades completas y comparativa con software del mismo objetivo usado en Bolivia (AutoSoft Taller, ServitechApp, TuneraTaller, Appli-Car) en [docs/roadmap-competitivo.md](docs/roadmap-competitivo.md).

## Convenciones al proponer cambios

- **El trabajo nuevo de backend va en `server/`** (Node/Supabase), no en `backend/` (.NET legacy), salvo que el usuario lo pida explícitamente.
- Roles en inglés (`Owner`/`Mechanic`/`Receptionist`); copy de UI y docs en español — mantén esa mezcla, no traduzcas los roles ni anglicices el copy visible.
- Antes de crear un módulo/feature nuevo, revisa cómo está resuelto un módulo análogo (en `server/` el patrón es `organizations.ts`; la lógica de negocio de referencia está en los `Services/` del .NET) y replícalo.
- Al tocar multitenancy/auth en `server/`, corre `npm test` (incluye aislamiento) — no asumas que "se ve bien" es suficiente.
- Supabase/Vercel: nunca commitear la `SUPABASE_SERVICE_ROLE_KEY` ni ningún secreto; van en variables de entorno.

## Git / ramas

- **`main`** — línea del nuevo rumbo (backend `server/` Node/Supabase, docs de Bolivia). Los secretos de la config .NET están scrubbeados.
- **`feat/backend-net-hardening`** — snapshot del backend .NET endurecido (vulnerabilidades NuGet, 103 tests, paginación, healthchecks), pusheado a origin. Es de donde se recupera cualquier detalle de la implementación .NET.
- Commitea/pushea solo cuando el usuario lo pida.

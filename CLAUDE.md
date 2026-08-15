# CLAUDE.md

Guía de contexto para Claude Code al trabajar en este repositorio.

## Qué es MotoCore

SaaS multiempresa para gestión de talleres de motocicletas: una cuenta administra **varias empresas**, y cada empresa **varias sucursales**, con datos aislados por empresa. **Mercado objetivo: Bolivia.**

Es, además, el **proyecto de grado de una Maestría en Full Stack Development** (sep–dic 2026).

## Regla de oro: la documentación manda sobre el código

**`docs/` define el sistema a construir; el código se amolda a esa definición, nunca al revés.** Antes de escribir o modificar código, leer [docs/README.md](docs/README.md) (índice y orden de lectura) y verificar qué establecen los requisitos, el modelo de datos y las decisiones de diseño. Si el código y la documentación difieren, **la documentación es la referencia** y el código es lo que hay que corregir — salvo que el usuario decida explícitamente cambiar la documentación.

Documentos que gobiernan el trabajo técnico:

| Necesitas saber | Documento |
|---|---|
| Terminología (empresa, sucursal, membresía) | [docs/01-glosario.md](docs/01-glosario.md) |
| Qué debe hacer el sistema | [docs/02-requisitos.md](docs/02-requisitos.md) |
| Entidades, claves y políticas | [docs/05-modelo-datos.md](docs/05-modelo-datos.md) |
| Por qué está diseñado así | [docs/07-decisiones-diseno.md](docs/07-decisiones-diseno.md) |
| Qué teoría o estándar respalda una tecnología | [docs/anteproyecto/03-marco-teorico-y-conceptual.md](docs/anteproyecto/03-marco-teorico-y-conceptual.md) |
| Qué construir y en qué orden | [docs/08-plan-trabajo.md](docs/08-plan-trabajo.md) |

## Anteproyecto académico

En [docs/anteproyecto/](docs/anteproyecto/README.md), **alineado sesión por sesión** con las diapositivas del seminario en `docs/diapositivas/*.pptx`. Reglas duras: **solo se escribe hasta donde el seminario ya cubrió** — no adelantar capítulos de sesiones futuras, y rehacer si una sesión nueva cambia el formato exigido. El Estado del Arte usa únicamente fuentes revisadas por pares (Google Scholar, IEEE, ACM, Scopus, OATD, BASE) — nunca blogs/Medium/YouTube/Wikipedia, y **nunca citas sin verificar** contra el documento original. Si el usuario trae una sesión nueva (`.pptx` en `docs/diapositivas/`), léela primero extrayendo el texto vía `python3` + `zipfile` (el `.pptx` es binario) antes de escribir nada.

## Estado del código (no confundir con el diseño documentado)

Lo que sigue describe **lo que hay hoy en el repositorio**, que va por detrás de la documentación de diseño.

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
docs/       Documentación del proyecto de grado — define el sistema a construir.
            Empieza por docs/README.md (índice y orden de lectura).
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
- **Pendiente inmediato**: implementar la **jerarquía empresa → sucursales** (ADR-006) — tablas `workshops` y `workshop_assignments`, taller activo por header `X-Workshop-Id`, y ajuste de unicidades. El código actual asume el modelo plano.
- **Pendiente después**: el corte vertical del proyecto de grado (`clients` a nivel empresa, `parts`/`part_movements` a nivel sucursal); integrar el frontend (Supabase Auth + selectores de organización y taller). Fuera de alcance del proyecto de grado: resto de módulos, WhatsApp y facturación SIN. No hay verificación end-to-end todavía porque requiere un proyecto Supabase real.

## Modelo multitenancy jerárquico (el cambio conceptual central)

Dos niveles, **un solo límite de seguridad**. Detalle en [docs/05-modelo-datos.md](docs/05-modelo-datos.md) y [docs/01-glosario.md](docs/01-glosario.md).

- `auth.users` (Supabase) = identidad global; `profiles` = datos de perfil 1:1.
- `organizations` = **empresa**, la unidad de aislamiento (tenant). **Una cuenta puede crear y pertenecer a varias.**
- `workshops` = **sucursal**, N por organización. **No** es una frontera de seguridad: indica dónde ocurre la operación, no quién puede verla.
- `memberships` = `user ↔ organization` con rol (`owner`/`mechanic`/`receptionist`), unique `(organization_id, user_id)`. El rol es **por organización**, nunca por sucursal.
- **Toda** tabla de negocio lleva `organization_id` (para que RLS evalúe siempre el mismo criterio); las de nivel sucursal llevan **además** `workshop_id`.
- Nivel empresa: clientes, motocicletas, historial, auditoría. Nivel sucursal: órdenes de trabajo, inventario.
- El registro crea la **1ª organización + 1ª sucursal + membership Owner**.

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
- Relevamiento de las soluciones existentes en Bolivia y funcionalidades identificadas: [docs/09-analisis-mercado.md](docs/09-analisis-mercado.md).

## Convenciones al proponer cambios

- **Antes de escribir documentación**, revisa [docs/README.md](docs/README.md): cada tema tiene un documento dueño. Enlaza en vez de duplicar, y usa la terminología de [docs/01-glosario.md](docs/01-glosario.md). Ojo: **empresa/organización = tenant** (unidad de aislamiento) y **sucursal/workshop = local** dentro de una empresa — en el código .NET legacy "workshop" era el tenant, hoy significa sucursal.
- **El trabajo nuevo de backend va en `server/`** (Node/Supabase), no en `backend/` (.NET legacy), salvo que el usuario lo pida explícitamente.
- Roles en inglés (`Owner`/`Mechanic`/`Receptionist`); copy de UI y docs en español — mantén esa mezcla, no traduzcas los roles ni anglicices el copy visible.
- Antes de crear un módulo/feature nuevo, revisa cómo está resuelto un módulo análogo (en `server/` el patrón es `organizations.ts`; la lógica de negocio de referencia está en los `Services/` del .NET) y replícalo.
- Al tocar multitenancy/auth en `server/`, corre `npm test` (incluye aislamiento) — no asumas que "se ve bien" es suficiente.
- Supabase/Vercel: nunca commitear la `SUPABASE_SERVICE_ROLE_KEY` ni ningún secreto; van en variables de entorno.

## Git / ramas

- **`main`** — línea del nuevo rumbo (backend `server/` Node/Supabase, docs de Bolivia). Los secretos de la config .NET están scrubbeados.
- **`feat/backend-net-hardening`** — snapshot del backend .NET endurecido (vulnerabilidades NuGet, 103 tests, paginación, healthchecks), pusheado a origin. Es de donde se recupera cualquier detalle de la implementación .NET.
- Commitea/pushea solo cuando el usuario lo pida.

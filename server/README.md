# MotoCore — Backend Node/TypeScript (Supabase)

Reescritura del backend a **Node/TS + Hono** sobre **Supabase** (Postgres + Auth + RLS), con **multi-tenancy jerárquica**: una cuenta administra varias **organizaciones** (`organizations`) y cada organización opera varios **talleres** (`workshops`). Se despliega en **Vercel** como funciones serverless.

> **Alcance actual**: base multi-tenant (Auth + Organizaciones + Membresías + Talleres) y el corte vertical de negocio — **Clientes** (nivel organización) e **Inventario** (nivel taller) — más el registro de auditoría. Los módulos que siguen solo en el backend .NET (Motorcycles, WorkOrders, MaintenanceHistory, Dashboard) se portarían reusando este patrón; están fuera del alcance del proyecto de grado (RF-800). El backend .NET legacy vive en `backend/`.
>
> **La especificación gobierna este código**, no al revés ([`docs/`](../docs/README.md)): terminología en el [Glosario](../docs/ingenieria/01-glosario.md), reglas en [Requisitos](../docs/ingenieria/02-requisitos.md), esquema en [Modelo de datos](../docs/ingenieria/05-modelo-datos.md) y, sobre todo, la interfaz en el [Contrato de la API](../docs/ingenieria/10-contrato-api.md). Cuando el código difiera de lo especificado, **se corrige el código**.

## Stack

- **Hono** — API HTTP en TypeScript, nativa de Vercel.
- **Supabase** — Postgres, Auth (registro/login/refresh/OAuth), RLS para el aislamiento por inquilino.
- **Zod** — validación de entrada.
- **Vitest** — pruebas.

## Modelo de datos (multi-tenancy)

| Tabla | Nivel | Rol |
|---|---|---|
| `auth.users` | — | Identidad global (gestionada por Supabase Auth) |
| `profiles` | — | Datos de perfil 1:1 con la cuenta |
| `organizations` | *tenant* | **Organización** — unidad de aislamiento |
| `workshops` | organización | **Taller** — local físico dentro de una organización |
| `memberships` | organización | `cuenta ↔ organización` con rol (`owner`/`mechanic`/`receptionist`) — **N por cuenta** |
| `workshop_assignments` | organización | En qué talleres trabaja un miembro (operativo, no afecta permisos) |
| `clients` | organización | Clientes, visibles desde cualquier taller de la organización |
| `parts` | taller | Repuestos con existencia propia por taller |
| `part_movements` | taller | Historial inmutable de movimientos de existencias |
| `audit_log` | organización | Acciones críticas (RF-703), inmutable |

Las **siete tablas de negocio** —de `workshops` hacia abajo— llevan todas `organization_id`, también las de nivel taller, que llevan además `workshop_id`. Es el censo sobre el que se mide la cobertura de políticas (RNF-101); `organizations` y `profiles` quedan fuera de él por no ser datos de negocio, con el motivo documentado en el [Modelo de datos](../docs/ingenieria/05-modelo-datos.md).

El aislamiento lo garantizan **políticas RLS** —una cuenta solo ve filas de organizaciones donde tiene membresía activa— **más** la verificación de membresía en la capa de aplicación (ADR-002, defensa en profundidad).

### Los dos clientes de datos, y por qué importa cuál se usa

Es la decisión más fácil de romper sin darse cuenta al añadir un endpoint.

| Cliente | Respeta RLS | Cuándo |
|---|---|---|
| `c.get('db')` — atado a la credencial de la petición | **Sí** | Toda lectura y escritura de datos de negocio |
| `serviceClient()` — clave de servicio | **No, la salta** | Siete excepciones, enumeradas en `src/lib/supabase.ts` |

Si un handler consulta con `serviceClient()`, las políticas **no intervienen** y el aislamiento pasa a depender solo del control de la aplicación. Por eso el reparto está acotado y documentado excepción por excepción.

La de más peso es la primera: **la propia verificación de membresía consulta con clave de servicio**. Es deliberado — si el control de la aplicación dependiera de RLS para funcionar, las dos capas dejarían de ser independientes, que es justo lo que RNF-102 exige demostrar. Esa independencia se verifica en `test/defense-in-depth.test.ts` (CP-N102): allí se anula la capa de aplicación y se comprueba que las políticas siguen filtrando.

## Contexto activo: la regla de rutas

El §2.3 del contrato fija una regla que atraviesa toda la API: **el identificador de la organización aparece en la ruta solo cuando el recurso es la organización misma**. Todo lo interior a ella —talleres, miembros, clientes, inventario, auditoría— se dirige a una ruta plana y el contexto viaja por cabecera:

| Cabecera | Contenido | Cuándo |
|---|---|---|
| `Authorization: Bearer <jwt>` | Credencial de Supabase Auth | Siempre, salvo registro y `/health` |
| `X-Org-Id` | Organización activa | Toda operación sobre datos internos de una organización |
| `X-Workshop-Id` | Taller activo | Operaciones de nivel taller (inventario y sus movimientos) |

El servidor **nunca asume un contexto por defecto**: si falta la cabecera exigida, rechaza la petición (ADR-005). Admitir a la vez la ruta anidada y la cabecera dejaría dos mecanismos de contexto conviviendo y la validación dejaría de estar concentrada en un punto único.

## Endpoints

### Identidad y organizaciones

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | — | Comprobación de disponibilidad |
| POST | `/api/auth/register` | — | Crea cuenta + 1.ª organización + 1.er taller + membresía Owner (atómico, vía `register_account`) |
| GET | `/api/auth/me` | Bearer | Perfil + organizaciones con rol |
| GET | `/api/organizations` | Bearer | Organizaciones de la cuenta (por membresía) |
| POST | `/api/organizations` | Bearer | Crear organización (el creador queda Owner) |
| GET | `/api/organizations/:orgId` | Bearer (miembro) | Detalle de la organización |
| PATCH | `/api/organizations/:orgId` | Bearer (Owner) | Editar sus datos. **Acción auditada** |
| POST | `/api/organizations/:orgId/switch` | Bearer (miembro) | Validar y devolver el rol para activar el contexto |

### Talleres — requieren `X-Org-Id`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/workshops` | miembro | Listar los talleres de la organización activa |
| POST | `/api/workshops` | Owner | Crear taller |
| GET | `/api/workshops/:workshopId` | miembro | Detalle |
| PATCH | `/api/workshops/:workshopId` | Owner | Editar campos |
| POST | `/api/workshops/:workshopId/deactivate` | Owner | Baja lógica. **Acción auditada** |
| GET | `/api/workshops/:workshopId/assignments` | miembro | Miembros asignados |
| POST | `/api/workshops/:workshopId/assignments` | Owner | Asignar miembro |
| DELETE | `/api/workshops/:workshopId/assignments/:userId` | Owner | Retirar asignación |

### Miembros — requieren `X-Org-Id`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/members` | miembro | Listar con rol y estado |
| POST | `/api/members/invite` | Owner | Incorporar una cuenta existente. **Acción auditada** |
| PATCH | `/api/members/:userId/role` | Owner | Cambiar rol. **Acción auditada** |
| DELETE | `/api/members/:userId` | Owner | Revocar la membresía (baja lógica). **Acción auditada** |

### Clientes — nivel organización, requieren `X-Org-Id`

| Método | Ruta | Descripción |
|---|---|---|
| GET / POST | `/api/clients` | Listar y buscar · crear |
| GET / PATCH | `/api/clients/:clientId` | Detalle · editar |
| POST | `/api/clients/:clientId/deactivate` | Baja lógica. **Acción auditada** |

Que estas rutas **no** exijan `X-Workshop-Id` es deliberado: su ausencia es la evidencia de RF-502 — el cliente pertenece a la organización, no al local.

### Inventario — nivel taller, requieren `X-Org-Id` **y** `X-Workshop-Id`

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/inventory/parts` | miembro | Listar (con `search` y `lowStock`) |
| POST | `/api/inventory/parts` | Owner, Receptionist | Crear repuesto |
| GET | `/api/inventory/parts/:partId` | miembro | Detalle |
| PATCH | `/api/inventory/parts/:partId` | Owner, Receptionist | Editar catálogo, **nunca la existencia** |
| GET / POST | `/api/inventory/parts/:partId/movements` | miembro | Historial · registrar movimiento |
| POST | `/api/inventory/parts/:partId/transfer` | **Owner** | Transferir existencias a otro taller de la organización |

RF-609 fija ese reparto: el Mechanic consume repuestos —consulta y registra movimientos— pero no administra el catálogo, y la transferencia entre locales queda reservada al Owner. Los tipos de movimiento registrables directamente son `purchase`, `sale`, `adjustment`, `return` y `damaged`; **`transfer` no se acepta** en esa operación, lo genera la transferencia como par de movimientos vinculados (RF-604, RF-608).

### Auditoría — nivel organización, requiere `X-Org-Id`, **solo Owner**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/audit` | Acciones críticas de la organización activa. Filtros: `action`, `workshopId`, `limit` |

Es la única lectura reservada a un rol. La restricción se aplica **también en la base de datos**: la política de `audit_log` exige `is_org_owner` (migración `0007`), de modo que el acceso directo tampoco la elude (RF-704). No se expone ninguna operación de escritura: el registro es historial inmutable.

Las **seis acciones críticas** que registra (RF-703) son `member.invited`, `member.role_changed`, `member.removed`, `organization.updated`, `workshop.deactivated` y `client.deactivated`.

## Errores

Todas las respuestas de error siguen **Problem Details** (RFC 9457, que sustituye al RFC 7807), con el código estable `modulo.razon` en el campo `title`. El catálogo completo es el del [§4 del contrato](../docs/ingenieria/10-contrato-api.md) y **la API no emite ningún código fuera de él**: un fallo inesperado del motor se propaga como `server.error` (500) en lugar de inventar un código nuevo.

Dos reglas que conviene tener presentes al tocar este código:

- **No divulgación (RNF-105).** Un recurso de otra organización responde `404` del módulo, indistinguible de uno inexistente; un `403` confirmaría que ese identificador existe en alguna parte. El `403 organization.access_denied` se reserva para cuando el solicitante *declara* operar sobre una organización ajena: ahí no revela nada que él no haya afirmado.
- **Transiciones de estado (§2.6).** Una baja lógica auditada se expone como `POST /…/deactivate`, no como `PATCH`. La excepción son los **vínculos** —membresía y asignación a taller—, que se revocan con `DELETE` porque lo que se corta es una relación, no el estado de un recurso propio.

El **login** se hace desde el cliente con Supabase Auth (`signInWithPassword`), no contra esta API (ADR-004): aquí solo se **verifica** el token recibido.

## Puesta en marcha

1. **Crear un proyecto Supabase** (https://supabase.com).
2. **Aplicar las migraciones** en orden, desde el SQL Editor de Supabase o con `supabase db push`:
   ```
   supabase/migrations/0001_init_multitenancy.sql
   …
   supabase/migrations/0008_glossary_terms.sql
   ```
   La `0007` es imprescindible: sin ella la política de `audit_log` no restringe la lectura al Owner y el caso CP-704.2 no puede pasar.
3. **Configurar el entorno**: copiar `.env.example` a `.env` con los valores de *Project Settings → API*:
   ```
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   AUTH_AUTO_CONFIRM_EMAIL=true   # dev: permite iniciar sesión sin confirmar correo
   ```
4. **Instalar y ejecutar**:
   ```bash
   npm install
   npm run dev        # http://localhost:8787
   npm test
   npm run typecheck
   ```

## Pruebas

Los niveles siguen el [plan de pruebas](../docs/ingenieria/11-plan-pruebas.md). Cada caso lleva su identificador `CP-nnn` en el nombre, para leer la evidencia contra la matriz de trazabilidad sin traducción intermedia.

**Sin Supabase** (N1 unitaria y N2 contrato HTTP) — corren siempre, en cada integración:

| Archivo | Qué cubre |
|---|---|
| `test/schemas.test.ts` | Esquemas Zod |
| `test/app.test.ts` | Superficie HTTP: credencial ausente, validación, forma del Problem Details |
| `test/workshops.test.ts` | Esquemas de taller y **regresión de la regla de rutas** |
| `test/business-routes.test.ts` | Clientes e inventario: contexto activo obligatorio y tipos de movimiento |

**Solo con credenciales** (N3 integración y N4 aislamiento) — se saltan con `describe.skipIf` si faltan. Requieren las migraciones aplicadas y `AUTH_AUTO_CONFIRM_EMAIL=true`:

| Archivo | Qué cubre |
|---|---|
| `test/integration.test.ts` | Flujo completo y reglas de negocio: CP-101 a CP-609, CP-703, CP-N105 |
| `test/rls.test.ts` | **Aislamiento por acceso directo a la base de datos** (RF-702, CP-702, CP-N101, CP-N106, CP-704.2), sin pasar por la capa de aplicación |
| `test/defense-in-depth.test.ts` | **CP-N102**: con la capa de aplicación anulada, las políticas del motor siguen impidiendo el acceso cruzado |

Esos dos últimos archivos son los que sostienen la premisa central del proyecto: uno demuestra que el aislamiento se mantiene cuando se prescinde de la API, y el otro que se mantiene **dentro** de la API aunque su control de membresía falle.

> **Un caso omitido no cubre su requisito.** Si N3 y N4 se saltan por falta de credenciales, la suite pasa en verde pero **no** constituye evidencia de cumplimiento (§6.2 del plan de pruebas). La validación del objetivo 4 se ejecuta contra un entorno real antes de cada hito.

## Despliegue en Vercel

- Este directorio (`server/`) es un proyecto Vercel independiente. `vercel.json` reescribe todas las rutas a la función `api/index.ts`, que ejecuta la app Hono completa.
- Configurar en Vercel `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `AUTH_AUTO_CONFIRM_EMAIL` según el entorno. **Nunca** commitear la clave de servicio.
- El frontend se despliega como sitio estático (otro proyecto Vercel) apuntando a la URL de esta API.

## Trabajo posterior

- Portar los módulos que siguen en el backend .NET (Motorcycles → WorkOrders → MaintenanceHistory → Dashboard) con sus tablas y sus políticas por `organization_id`. Están fuera del alcance del proyecto de grado (RF-800).
- Funcionalidades del [análisis del mercado](../docs/ingenieria/09-analisis-mercado.md): facturación electrónica del SIN, mensajería por WhatsApp, presupuestos con aprobación, agendamiento y portal del cliente.
- Publicar el esquema OpenAPI desde este servidor, para que el frontend derive sus tipos en lugar de declararlos a mano.

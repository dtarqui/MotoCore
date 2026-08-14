# Arquitectura y Plataforma

> Terminología: ver [glosario.md](glosario.md). Estado técnico detallado del repositorio (qué existe hoy, ramas): ver [CLAUDE.md](../CLAUDE.md).

## Arquitectura objetivo

MotoCore se está construyendo como un SaaS **multiempresa** desplegado en infraestructura **serverless**, con el aislamiento de datos garantizado en la propia base de datos.

```text
Frontend (React + Vite, PWA)
        |
        |  REST + Authorization: Bearer <JWT>  +  X-Org-Id  [+ X-Workshop-Id]
        v
Backend Node/TypeScript (Hono) — Vercel Functions (serverless)
        |
        v
Supabase — PostgreSQL + Auth + Row-Level Security + Storage
```

El frontend también habla **directamente con Supabase Auth** para registro/login/refresh; la API solo **verifica** el token que recibe.

## Modelo multiempresa jerárquico (multi-tenant)

La jerarquía tiene dos niveles, con **un solo límite de seguridad**:

```
Cuenta ──membresía(rol)──> Organización (empresa)  ← unidad de aislamiento (tenant)
                                └── Taller (sucursal)  ← subdivisión operativa
```

- La **organización** es la unidad de aislamiento. Toda tabla de negocio lleva `organization_id`.
- **Una cuenta puede crear y pertenecer a varias organizaciones**, con un rol distinto en cada una.
- **Una organización puede tener varios talleres** (sucursales). El taller determina *dónde* ocurre una operación, no *quién* puede verla — no es una segunda frontera de seguridad (ver [ADR-006](decisiones-arquitectura.md)).
- La **organización activa** viaja en el header `X-Org-Id`; el **taller activo**, en `X-Workshop-Id`, y debe pertenecer a la organización activa.
- El registro de una cuenta crea su primera organización, su primer taller y la membresía `Owner`.

Modelo de datos base:

| Tabla | Rol |
|---|---|
| `auth.users` (Supabase) | Identidad global de la cuenta |
| `profiles` | Datos de perfil, 1:1 con la cuenta |
| `organizations` | La empresa / tenant |
| `workshops` | Sucursal; N por organización |
| `memberships` | Cuenta ↔ organización, con rol; N por cuenta |
| `workshop_assignments` | Miembro ↔ taller; asignación operativa, sin efecto en permisos |

**Alcance de los datos por nivel** (tabla completa en [glosario.md](glosario.md)):

| Nivel organización | Nivel taller |
|---|---|
| Clientes, motocicletas, historial de mantenimiento, miembros, auditoría | Órdenes de trabajo, inventario y movimientos de stock |

Las tablas de nivel taller llevan `workshop_id` **además** de `organization_id`, para que las políticas de aislamiento se sigan evaluando sobre un único criterio.

> **Estado**: la jerarquía está **decidida y documentada, pero aún no implementada** — el esquema y los módulos actuales asumen el modelo plano de una organización sin sucursales. Es la primera tarea técnica del cronograma (ver [plan-trabajo.md](plan-trabajo.md), iteración I3).

## Aislamiento de datos: defensa en profundidad

Dos capas independientes, ambas obligatorias (detalle en [seguridad.md](seguridad.md)):

1. **Row-Level Security en PostgreSQL** — políticas que exigen que quien consulta tenga una membresía activa en la organización dueña de la fila. Protege aunque el código de aplicación tenga un error.
2. **Verificación de membresía en la API** — cada handler valida la membresía (y el rol, cuando corresponde) antes de operar, y devuelve errores de negocio específicos.

## Stack tecnológico

### Frontend
React 19 · TypeScript · Vite · TailwindCSS · React Query · React Router

### Backend (`server/`) — objetivo
Node.js · TypeScript · Hono (API) · Zod (validación) · `@supabase/supabase-js` · Vitest (pruebas)

Responsabilidades: exponer la API REST, validar entrada, aplicar reglas de negocio y autorización por organización, y ejecutar las operaciones privilegiadas que no pueden vivir en el cliente (numeración de órdenes, movimientos de stock, auditoría).

### Datos y autenticación
**Supabase**: PostgreSQL gestionado, Supabase Auth (registro, login, refresh, confirmación de email, OAuth), Row-Level Security y Storage.

### Despliegue
**Vercel**: el backend como funciones serverless y el frontend como sitio estático. Secretos exclusivamente en variables de entorno del proveedor.

### Integración continua
GitHub Actions (`.github/workflows/ci.yml`) ejecuta en cada push/PR a `main`: typecheck y pruebas del backend nuevo, lint y build del frontend, y build/test del backend legacy mientras siga en el repositorio.

## Backend legacy (`backend/`)

Backend previo en ASP.NET Core (.NET 10) con Clean Architecture y EF Core sobre PostgreSQL. **Ya no recibe features nuevas**: se conserva como referencia de la lógica de negocio a portar y se eliminará cuando `server/` cubra los módulos. El snapshot endurecido vive en la rama `feat/backend-net-hardening`.

## Enfoque multiplataforma

- **Web (PWA)**: es la plataforma soportada. Existe un manifest instalable; falta service worker para uso offline.
- **Móvil / Escritorio**: `capacitor.config.ts` y `electron/main.js` son **scaffolds documentados sin dependencias instaladas** — no son funcionales y están **fuera del alcance** actual del proyecto de grado (ver [tesis/01-definicion-y-alcance.md](tesis/01-definicion-y-alcance.md) §1.8.3).

## Decisiones de arquitectura registradas

Las decisiones relevantes están documentadas con sus alternativas y consecuencias en [decisiones-arquitectura.md](decisiones-arquitectura.md): migración .NET → Node (ADR-001), RLS + verificación en API (ADR-002), elección de Hono (ADR-003), Supabase Auth (ADR-004), organización activa por header (ADR-005) y **jerarquía empresa → sucursales (ADR-006)**.

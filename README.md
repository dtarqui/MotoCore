
<p align="center">
        <img src="https://github.com/user-attachments/assets/37b92f90-e109-4989-9789-7bf45a1c6afa" alt="MotoCore logo" width="280" />
</p>

# MotoCore

Plataforma SaaS para la gestión integral de talleres de motocicletas, evolucionando hacia un modelo **ERP multiempresa**: una cuenta administra varias empresas, y cada empresa opera varias sucursales. **Mercado objetivo por ahora: Bolivia.**

> **Estado — pivote de backend en curso.** El backend se está reescribiendo de **.NET → Node/TypeScript + Supabase** para desplegar en **Vercel**. En el repo conviven dos backends: `server/` (el **nuevo**, objetivo) y `backend/` (**.NET legacy**, referencia hasta que `server/` lo reemplace). El frontend sigue, por ahora, contra el backend .NET. El detalle técnico del backend nuevo está en [server/README.md](server/README.md); la especificación que gobierna la construcción, en [docs/](docs/README.md).

## Resumen

MotoCore centraliza la operación diaria de un taller: clientes, motocicletas, órdenes de trabajo, inventario, historial técnico y recordatorios de mantenimiento. El proyecto avanza hacia una plataforma multiempresa (varias empresas por cuenta, con cambio de empresa activa estilo QuickBooks/Zoho) enfocada en el mercado boliviano.

## Propuesta de valor

- Digitaliza los procesos operativos del taller.
- Mejora el seguimiento de servicios y mantenimientos.
- Organiza el historial técnico de cada motocicleta.
- Facilita el control de repuestos y stock.
- Entrega métricas para soporte de decisiones.

## Alcance

MotoCore está orientado a talleres de motocicletas, mecánicos independientes y pequeños centros de servicio en Bolivia.

Bajo el modelo **multiempresa**, una cuenta puede administrar **varias empresas** (`organizations`), y cada empresa puede tener **varias sucursales** (`workshops`). El equipo (`Owner`, `Mechanic`, `Receptionist`) y los datos (clientes, motos, órdenes, inventario, historial) quedan **aislados por empresa** — sin compartición entre empresas. La sucursal es una subdivisión operativa, no una frontera de seguridad: ver el [Glosario](docs/ingenieria/01-glosario.md).

## Arquitectura (alto nivel)

**Objetivo de la reescritura (en `server/`):**

```text
Frontend (React + Vite, PWA)
        |
Backend Node/TS (Hono) — Serverless en Vercel
        |
Supabase (PostgreSQL + Auth + RLS + Storage)
```

- Aislamiento multi-tenant **por empresa**: políticas **RLS** en Postgres + chequeo de membresía en la API (defensa en profundidad).
- Autenticación por **Supabase Auth** (registro/login/refresh/OAuth); la API verifica el token.

**Legacy (en `backend/`, se reemplaza):** Frontend → API ASP.NET Core (.NET 10) → PostgreSQL.

## Estructura del repositorio

```
server/              NUEVO backend — Node/TS (Hono) + Supabase — ver server/README.md
backend/             Backend .NET legacy (referencia) — ver backend/README.md
frontend/            React 19 + Vite — ver frontend/README.md
docs/                Documentación del proyecto de grado — empezar por docs/README.md
  anteproyecto/        Documento académico (definición, estado del arte, marco teórico)
  ingenieria/          Especificación técnica (requisitos, arquitectura, datos, seguridad, plan)
.github/workflows/   Pipeline de CI (frontend + server; el job .NET está desactivado)
docker-compose.yml   Stack .NET legacy (Postgres + backend + frontend)
```

## Stack tecnológico

**Frontend**: React · TypeScript · Vite · TailwindCSS · React Query · React Router

**Backend nuevo (`server/`)**: Node.js · TypeScript · Hono · Zod · Supabase (`@supabase/supabase-js`) · Vitest · desplegado en Vercel

**Backend legacy (`backend/`)**: ASP.NET Core · C# · Clean Architecture · EF Core

**Datos**: PostgreSQL (gestionado por Supabase en el nuevo backend)

## Multitenancy ERP

- `auth.users` (Supabase) = identidad global; `profiles` = perfil.
- `organizations` = **empresa**, y es la unidad de aislamiento (*tenant*); **una cuenta puede tener varias**.
- `workshops` = **sucursal** dentro de una empresa; subdivisión operativa, no unidad de aislamiento.
- `memberships` = usuario ↔ empresa con rol (`owner`/`mechanic`/`receptionist`); el rol es por empresa, no global.
- Todo dato de negocio se scopea por `organization_id`; las entidades de nivel sucursal llevan además `workshop_id`. El contexto activo se selecciona por request: header `X-Org-Id` para la empresa y `X-Workshop-Id` para la sucursal.

## Módulos y roadmap

**Ya en `server/` (backend nuevo)**: registro atómico que crea cuenta + 1ª empresa + 1ª sucursal, gestión de empresas y miembros, sucursales y asignación de miembros a sucursales, clientes (nivel empresa), inventario y movimientos de stock con transferencia entre sucursales (nivel sucursal), registro de auditoría de acciones críticas y aislamiento por RLS.

**Todavía solo en el backend .NET legacy**, pendiente de portar: motocicletas, órdenes de trabajo (estados, diagnóstico, cierre, entrega), historial de mantenimiento y dashboard. Quedan fuera del alcance del proyecto de grado (ver [Requisitos](docs/ingenieria/02-requisitos.md), RF-800).

**Funcionalidades identificadas para el mercado boliviano** (ver [docs/ingenieria/09-analisis-mercado.md](docs/ingenieria/09-analisis-mercado.md)): facturación electrónica del SIN, mensajería por WhatsApp, presupuestos con aprobación del cliente, facturación y cobro en línea, agendamiento, inspección digital y portal del cliente.

## Seguridad

- Autenticación por Supabase Auth (nuevo backend) / JWT con refresh (legacy).
- Control de acceso por roles y aislamiento de datos por empresa (RLS + chequeo en la API).
- Los secretos de configuración del backend legacy están reemplazados por placeholders; los del backend nuevo van en variables de entorno (Supabase/Vercel), nunca en el repo.

Roles: `Owner`, `Mechanic`, `Receptionist`.

## Cómo ejecutar

### Backend nuevo (`server/`) — Node/TS + Supabase

```bash
cd server
npm install
# 1) Crear un proyecto en Supabase y aplicar supabase/migrations/0001_init_multitenancy.sql
# 2) Copiar .env.example a .env con las claves de Supabase
npm run dev        # http://localhost:8787
npm test           # unit + HTTP (la integración corre solo con credenciales de Supabase)
```

Detalle en [server/README.md](server/README.md).

### Backend legacy (`backend/`) — .NET (referencia)

```bash
docker compose up --build
# Backend:  http://localhost:8080  (Swagger en /swagger)
# Frontend: http://localhost:8081
```

Detalle en [backend/README.md](backend/README.md).

### Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

Configura `VITE_API_BASE_URL` en `frontend/.env` apuntando a la URL del backend.

### Requisitos previos

| Herramienta | Necesaria para |
|---|---|
| Node.js 20+ | Backend nuevo (`server/`) y frontend |
| Cuenta de Supabase | Backend nuevo (Postgres + Auth) |
| .NET 10 SDK / Docker | Solo para el backend .NET legacy |

## Variables de entorno

**Backend nuevo (`server/.env`)**

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave anónima (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service-role (privada — nunca commitear) |
| `AUTH_AUTO_CONFIRM_EMAIL` | `true` en dev para iniciar sesión sin confirmar email |

**Frontend (`frontend/.env`)**: `VITE_API_BASE_URL` — URL del backend que consume el frontend.

## Testing

```bash
# Backend nuevo
cd server && npm test        # + npm run typecheck

# Backend legacy (.NET)
cd backend && dotnet test
```

## CI/CD

`.github/workflows/ci.yml` corre en cada push/PR a `main`: lint+build del frontend y typecheck+test del backend nuevo (`server/`). El job del backend .NET legacy está **comentado** en el workflow, en línea con el pivote. El despliegue continuo a Vercel se agrega cuando el proyecto tenga un entorno Supabase de destino.

## Documentación

**[Índice y orden de lectura](docs/README.md)** — la documentación está numerada para leerse en secuencia.

**Anteproyecto**
- [1. Definición y alcance](docs/anteproyecto/01-definicion-y-alcance.md) · [2. Antecedentes y estado del arte](docs/anteproyecto/02-antecedentes-y-estado-del-arte.md) · [3. Marco teórico y conceptual](docs/anteproyecto/03-marco-teorico-y-conceptual.md)

**Especificación**
- [1. Glosario](docs/ingenieria/01-glosario.md) · [2. Requisitos](docs/ingenieria/02-requisitos.md) · [3. Historias de usuario](docs/ingenieria/03-historias-usuario.md)

**Diseño**
- [4. Arquitectura](docs/ingenieria/04-arquitectura.md) · [5. Modelo de datos](docs/ingenieria/05-modelo-datos.md) · [6. Seguridad](docs/ingenieria/06-seguridad.md) · [7. Decisiones de diseño](docs/ingenieria/07-decisiones-diseno.md)

**Contrato y verificación**
- [10. Contrato de la interfaz de programación](docs/ingenieria/10-contrato-api.md) · [11. Plan de pruebas y validación](docs/ingenieria/11-plan-pruebas.md)

**Ejecución y contexto**
- [8. Plan de trabajo](docs/ingenieria/08-plan-trabajo.md) · [9. Análisis del mercado](docs/ingenieria/09-analisis-mercado.md)

## Licencia

Este proyecto se distribuye bajo los términos definidos en [LICENSE](LICENSE).

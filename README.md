
<p align="center">
        <img src="https://github.com/user-attachments/assets/37b92f90-e109-4989-9789-7bf45a1c6afa" alt="MotoCore logo" width="280" />
</p>

# MotoCore

Plataforma SaaS para la gestión integral de talleres de motocicletas, evolucionando hacia un modelo **ERP multiempresa** (una cuenta administra varias organizaciones). **Mercado objetivo por ahora: Bolivia.**

> **Estado — pivote de backend en curso.** El backend se está reescribiendo de **.NET → Node/TypeScript + Supabase** para desplegar en **Vercel**. En el repo conviven dos backends: `server/` (el **nuevo**, objetivo) y `backend/` (**.NET legacy**, referencia hasta que `server/` lo reemplace). El frontend sigue, por ahora, contra el backend .NET. Ver [CLAUDE.md](CLAUDE.md) para el detalle técnico del estado.

## Resumen

MotoCore centraliza la operación diaria de un taller: clientes, motocicletas, órdenes de trabajo, inventario, historial técnico y recordatorios de mantenimiento. El proyecto avanza hacia una plataforma multiempresa (varias organizaciones por cuenta, con cambio de organización estilo QuickBooks/Zoho) enfocada en el mercado boliviano.

## Propuesta de valor

- Digitaliza los procesos operativos del taller.
- Mejora el seguimiento de servicios y mantenimientos.
- Organiza el historial técnico de cada motocicleta.
- Facilita el control de repuestos y stock.
- Entrega métricas para soporte de decisiones.

## Alcance

MotoCore está orientado a talleres de motocicletas, mecánicos independientes y pequeños centros de servicio en Bolivia.

Bajo el modelo **multiempresa**, una cuenta puede administrar **varias organizaciones**; cada organización tiene su equipo (`Owner`, `Mechanic`, `Receptionist`) y sus datos (clientes, motos, órdenes, inventario, historial) **aislados por organización** — sin compartición entre organizaciones.

## Arquitectura (alto nivel)

**Objetivo de la reescritura (en `server/`):**

```text
Frontend (React + Vite, PWA)
        |
Backend Node/TS (Hono) — Serverless en Vercel
        |
Supabase (PostgreSQL + Auth + RLS + Storage)
```

- Aislamiento multi-tenant por **RLS** en Postgres + chequeo de membership en la API.
- Autenticación por **Supabase Auth** (registro/login/refresh/OAuth); la API verifica el token.

**Legacy (en `backend/`, se reemplaza):** Frontend → API ASP.NET Core (.NET 10) → PostgreSQL.

## Estructura del repositorio

```
server/              NUEVO backend — Node/TS (Hono) + Supabase — ver server/README.md
backend/             Backend .NET legacy (referencia) — ver backend/README.md
frontend/            React 19 + Vite — ver frontend/README.md
docs/                Documentación de producto + roadmap-competitivo.md (Bolivia)
.github/workflows/   Pipeline de CI (backend .NET / frontend)
docker-compose.yml   Stack .NET legacy (Postgres + backend + frontend)
CLAUDE.md            Guía de contexto técnico para trabajar el repo con Claude Code
```

## Stack tecnológico

**Frontend**: React · TypeScript · Vite · TailwindCSS · React Query · React Router

**Backend nuevo (`server/`)**: Node.js · TypeScript · Hono · Zod · Supabase (`@supabase/supabase-js`) · Vitest · desplegado en Vercel

**Backend legacy (`backend/`)**: ASP.NET Core · C# · Clean Architecture · EF Core

**Datos**: PostgreSQL (gestionado por Supabase en el nuevo backend)

## Multitenancy ERP

- `auth.users` (Supabase) = identidad global; `profiles` = perfil.
- `organizations` (era "workshop") = empresa; **una cuenta puede tener varias**.
- `memberships` = usuario ↔ organización con rol (`owner`/`mechanic`/`receptionist`).
- Todo dato de negocio se scopea por `organization_id`. La organización activa se selecciona por request (header `X-Org-Id`).

## Módulos y roadmap

**Operación del taller** (implementada en el backend .NET, en proceso de portarse a `server/`): talleres/organizaciones y equipo, clientes, motocicletas, órdenes de trabajo (estados, diagnóstico, cierre, entrega), inventario (stock, movimientos, bajo stock), historial de mantenimiento, dashboard y auditoría de acciones críticas.

**Base multitenant nueva** (ya en `server/`): registro que crea cuenta + 1ª organización, gestión de organizaciones y miembros, aislamiento por RLS.

**Roadmap priorizado para Bolivia** (ver [docs/roadmap-competitivo.md](docs/roadmap-competitivo.md)): presupuestos con aprobación del cliente, facturación y pagos online, **mensajería/presupuestos por WhatsApp**, **facturación electrónica del SIN**, agendamiento, inspección digital (DVI), portal del cliente.

## Seguridad

- Autenticación por Supabase Auth (nuevo backend) / JWT con refresh (legacy).
- Control de acceso por roles y aislamiento de datos por organización (RLS + chequeo en la API).
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

`.github/workflows/ci.yml` corre en cada push/PR a `main` para el backend .NET y el frontend. El pipeline del backend nuevo (`server/`) se agregará al integrarlo en el flujo de despliegue a Vercel.

## Documentación

- [Roadmap competitivo (Bolivia)](docs/roadmap-competitivo.md)
- [Objetivos del proyecto](docs/objetivos.md)
- [Arquitectura y plataforma](docs/arquitectura.md)
- [Módulos funcionales](docs/modulos.md)
- [Seguridad y roles](docs/seguridad.md)
- [Roadmap y extensiones futuras](docs/roadmap.md)
- [Guía técnica para Claude Code](CLAUDE.md)

## Licencia

Este proyecto se distribuye bajo los términos definidos en [LICENSE](LICENSE).

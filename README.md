
<p align="center">
        <img src="https://github.com/user-attachments/assets/37b92f90-e109-4989-9789-7bf45a1c6afa" alt="MotoCore logo" width="280" />
</p>

# MotoCore

Plataforma SaaS para la gestión integral de talleres de motocicletas, diseñada para operar en web, móvil y escritorio desde una misma base funcional.

## Resumen

MotoCore centraliza la operación diaria de un taller: clientes, motocicletas, órdenes de trabajo, inventario, historial técnico y recordatorios de mantenimiento. El enfoque del proyecto es construir una solución moderna, escalable y multiplataforma para talleres pequeños y medianos.

## Propuesta de valor

- Digitaliza procesos operativos del taller.
- Mejora el seguimiento de servicios y mantenimientos.
- Organiza el historial técnico de cada motocicleta.
- Facilita el control de repuestos y stock.
- Entrega métricas para soporte de decisiones.

## Alcance

MotoCore está orientado a:

- Talleres de motocicletas.
- Mecánicos independientes.
- Pequeños centros de servicio de motos.
- Talleres especializados en mantenimiento y reparación.

Incluye soporte para múltiples talleres bajo arquitectura SaaS.

En este modelo, cada `Owner` administra su propio taller con su equipo (`Mechanic` y `Receptionist`), manteniendo clientes y motocicletas aislados por taller (sin compartición entre talleres).

## Arquitectura (alto nivel)

```text
Frontend (React PWA)
        |
Backend API (ASP.NET Core)
        |
Base de datos (PostgreSQL)
```

Distribución multiplataforma:

- Web: PWA.
- Móvil: empaquetado con Capacitor.
- Escritorio: empaquetado con Electron.

## Estructura del repositorio

```
backend/             ASP.NET Core (.NET 10), Clean Architecture — ver backend/README.md
frontend/            React 19 + Vite — ver frontend/README.md
docs/                Documentación de producto (objetivos, arquitectura, módulos, seguridad, roadmap)
.github/workflows/   Pipeline de CI
docker-compose.yml   Stack completo (Postgres + backend + frontend)
CLAUDE.md            Guía de contexto técnico para trabajar en el repo con Claude Code
mejoras.md           Recomendaciones de mejora vigentes
```

## Stack tecnológico

**Frontend**

- React
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router

**Backend**

- ASP.NET Core
- C#
- Arquitectura basada en servicios

**Datos**

- PostgreSQL

## Módulos principales

**Implementados** (backend + frontend conectados):

- Gestión de talleres y equipo (multi-tenant): datos del taller, invitar miembros, cambiar roles.
- Gestión de clientes.
- Gestión de motocicletas.
- Órdenes de trabajo (estados, diagnóstico, cierre, entrega).
- Inventario de repuestos (stock, movimientos, alertas de bajo stock).
- Historial de mantenimiento por motocicleta.
- Dashboard de métricas (servicios del mes, ingresos, alertas).
- Auditoría de acciones críticas (cambios de rol, remoción de miembros/talleres).

**Planeados** (ver [docs/roadmap.md](docs/roadmap.md) y [mejoras.md](mejoras.md)):

- Recordatorios automáticos de servicio (por kilometraje/tiempo).
- 2FA y login con Google/Facebook (el catálogo de proveedores existe, el flujo OAuth no).
- Empaquetado nativo real (Capacitor/Electron hoy son solo scaffolds documentados).

## Seguridad

- Autenticación basada en JWT (access + refresh token con rotación).
- Control de acceso por roles y aislamiento de datos por taller (multi-tenant), cubierto por tests dedicados.
- Rate limiting en endpoints de autenticación (por IP).
- Auditoría de acciones críticas (cambios de rol, remoción de miembros/talleres).
- Confirmación de email y reset de password: la lógica está implementada; el envío de correo hoy es un stub que solo registra en logs (ver [mejoras.md](mejoras.md)).

Roles contemplados:

- Owner.
- Mechanic.
- Receptionist.

## Estado del proyecto

**Backend** (`ASP.NET Core` + `Clean Architecture`): implementado. Los 8 módulos de dominio (Auth, Users, Workshops, Clients, Motorcycles, WorkOrders, Inventory, MaintenanceHistory) cuentan con entidades, servicios, validadores (FluentValidation) y controllers expuestos vía API REST documentada con Swagger. Incluye rate limiting, auditoría de acciones críticas, health checks y logging estructurado. Cuenta con una suite de tests (xUnit, 25/25 en verde) que cubre reglas de negocio y aislamiento multi-tenant, y un pipeline de CI (`.github/workflows/ci.yml`). Todo validado end-to-end con Docker (build, tests, y el stack completo corriendo contra PostgreSQL real).

**Frontend** (`React` + `Vite`): autenticación, Clientes, Motocicletas, Órdenes de trabajo, Inventario, Talleres (administración de equipo), Historial de mantenimiento y Dashboard están conectados a la API real. PWA básica instalable (manifest); scaffolds de Capacitor/Electron listos para cuando se invierta en esas plataformas.

Ver [mejoras.md](mejoras.md) para el detalle de próximos pasos recomendados.

## Cómo ejecutar

### Opción 1: Docker Compose (stack completo)

```bash
docker compose up --build
# Backend:  http://localhost:8080  (Swagger en /swagger)
# Frontend: http://localhost:8081
```

Levanta PostgreSQL, backend y frontend juntos, con la migración de base de datos aplicándose automáticamente al arrancar.

### Opción 2: Backend y frontend por separado

```bash
cd backend
dotnet restore
# Con PostgreSQL (docker compose incluido para desarrollo local)
docker compose -f compose.local.yml up -d
dotnet ef database update --project src/MotoCore.Infrastructure --startup-project src/MotoCore.Api
dotnet run --project src/MotoCore.Api
# Swagger UI: https://localhost:7222/swagger
```

Ver [backend/README.md](backend/README.md) para el detalle completo (arquitectura, endpoints, configuración).

```bash
cd frontend
npm install
npm run dev
```

Configura `VITE_API_BASE_URL` en `frontend/.env` apuntando a la URL del backend (por defecto `https://localhost:7222`).

### Requisitos previos

| Herramienta | Necesaria para |
|---|---|
| .NET 10 SDK | Correr el backend fuera de Docker (`dotnet run`, `dotnet test`) |
| Node.js 20+ | Correr el frontend fuera de Docker (`npm run dev`) |
| Docker Desktop | Cualquiera de las dos opciones de arriba que use contenedores |
| PostgreSQL 15+ | Solo si no usas Docker ni el provider `InMemory` |

## Variables de entorno

| Variable | Dónde | Default | Descripción |
|---|---|---|---|
| `Database:Provider` | `backend/src/MotoCore.Api/appsettings*.json` | `PostgreSql` | `PostgreSql` o `InMemory` |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `backend/.env` | ver `.env.example` | Conexión a Postgres cuando el provider es `PostgreSql` |
| `Jwt:SigningKey` | `appsettings.json` | clave de ejemplo | Cambiar antes de cualquier despliegue real (ver [mejoras.md](mejoras.md)) |
| `VITE_API_BASE_URL` | `frontend/.env` | `https://localhost:7222` | URL del backend que consume el frontend |

Ver la sección "Configuración" de [backend/README.md](backend/README.md) para la lista completa (CORS, proveedores externos, etc.).

## Testing

```bash
# Backend
cd backend && dotnet test

# O sin instalar el SDK, usando Docker:
docker run --rm -v "${PWD}/backend:/src" -w /src mcr.microsoft.com/dotnet/sdk:10.0 dotnet test
```

El frontend todavía no tiene suite de tests (ver [mejoras.md](mejoras.md) — es una de las recomendaciones pendientes).

## CI/CD

`.github/workflows/ci.yml` corre en cada push/PR a `main`: `dotnet build` + `dotnet test` para el backend, `npm run lint` + `npm run build` (incluye `tsc -b`) para el frontend.

## Documentación

Para mantener este README claro y concreto, el detalle completo se documenta en archivos separados:

- [Objetivos del proyecto](docs/objetivos.md)
- [Arquitectura y plataforma](docs/arquitectura.md)
- [Módulos funcionales](docs/modulos.md)
- [Seguridad y roles](docs/seguridad.md)
- [Roadmap y extensiones futuras](docs/roadmap.md)

## Licencia

Este proyecto se distribuye bajo los términos definidos en [LICENSE](LICENSE).

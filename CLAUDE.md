# CLAUDE.md

Guía de contexto para Claude Code al trabajar en este repositorio.

## Qué es MotoCore

SaaS multi-tenant para gestión de talleres de motocicletas. Cada `Owner` administra un taller con su equipo (`Mechanic`, `Receptionist`); los datos de clientes, motos, órdenes e inventario están aislados por taller — nunca se comparten entre talleres. Ver [README.md](README.md) y `docs/*.md` para el contexto de producto completo.

**Estado**: MVP funcional end-to-end. Backend (8 módulos) y frontend (8 módulos) conectados entre sí, con tests reales, CI y Docker — todo verificado corriendo, no solo escrito. Ver [mejoras.md](mejoras.md) para qué falta.

## Estructura del repo

```
backend/            ASP.NET Core (.NET 10) — Clean Architecture
frontend/           React 19 + TypeScript + Vite
docs/                Documentación de producto (objetivos, arquitectura, módulos, seguridad, roadmap)
docker-compose.yml   Stack completo (Postgres + backend + frontend)
.github/workflows/   CI (build + test backend, lint + build frontend)
mejoras.md           Recomendaciones de mejora vigentes — revisar antes de proponer trabajo nuevo
```

## Backend (`backend/`)

Clean Architecture en 4 proyectos, de adentro hacia afuera:

- `MotoCore.Domain` — entidades puras, sin dependencias externas.
- `MotoCore.Application` — casos de uso, contratos (`I*Service`, `I*Repository`), DTOs/Request models, validadores FluentValidation. Depende solo de Domain.
- `MotoCore.Infrastructure` — EF Core (`MotoCoreDbContext`), repos, JWT, hashing de passwords, `LoggingEmailSender`. Depende de Application + Domain.
- `MotoCore.Api` — Controllers, `Program.cs`, middleware, health checks. Depende de todo lo anterior.

Módulos de negocio (misma subestructura en Application: `Contracts/`, `Models/`, `Services/`, `Validators/`): `Clients`, `Motorcycles`, `WorkOrders`, `Inventory`, `MaintenanceHistory`, `Workshops`, `Users`, `Auth`, `Audit`. Al añadir un módulo nuevo, replica ese patrón.

**Patrones ya en uso** (seguirlos, no reinventar):
- Result Pattern para manejo de errores sin excepciones.
- Repository Pattern detrás de interfaces en `Contracts/`.
- FluentValidation para validación de requests (un validador por modelo en `Validators/`).
- Minimal APIs / Controllers exponen, la lógica de negocio vive en `Services/`, nunca en el controller.
- Cada servicio de módulo valida membership (`IWorkshopRepository.GetMembershipAsync(workshopId, userId)`) y rol al inicio de cada método — es el mecanismo de aislamiento multi-tenant. Replicalo en cualquier servicio nuevo.

**Base de datos**: PostgreSQL en producción, InMemory para desarrollo/testing (`Database:Provider` en `appsettings.json`).

**Al agregar una entidad o campo nuevo al modelo de EF Core, genera la migración de inmediato** (`dotnet ef migrations add NombreMigracion --project src/MotoCore.Infrastructure --startup-project src/MotoCore.Api`). El provider InMemory (usado en dev/tests) no detecta cambios de modelo pendientes — el error solo aparece al arrancar contra PostgreSQL real (`PendingModelChangesWarning`). Ya pasó una vez con la entidad `AuditLogEntry`; no asumas que "compila y los tests pasan" significa que la migración existe.

**Toda entidad nueva con clave `Guid` necesita `Id { get; set; } = Guid.NewGuid();`** como valor por defecto (mismo patrón que `Client`, `Motorcycle`, `Workshop`). Sin eso, con `ValueGeneratedNever()` configurado en `MotoCoreDbContext`, cualquier fila creada sin asignar `Id` explícitamente cae en `Guid.Empty` — funciona para la primera fila y choca con la clave primaria en la segunda. Ya fue un bug real en `WorkOrder`, `Part`, `PartMovement` y `MaintenanceHistoryEntry`.

**Comandos útiles**:
```bash
dotnet run --project src/MotoCore.Api        # levantar API (Swagger en /swagger)
dotnet test                                   # correr tests
docker compose -f compose.local.yml up -d     # Postgres local (solo DB)
docker compose up --build                     # stack completo (Postgres + backend + frontend)
```

## Testing (backend)

`tests/MotoCore.Api.Tests` tiene cobertura real (xUnit) sobre `AuthService`, `WorkOrderService`, `InventoryService`, `AuditLogService`, y aislamiento multi-tenant explícito en `MultiTenant/`. Patrón: `InMemoryDbContextFactory.Create()` da un `MotoCoreDbContext` fresco por test, se construyen los repositorios EF reales (no mocks) directamente sobre ese contexto, y `WorkshopSeeder` siembra workshop + membership + `UserAccount`.

**Si escribes un test nuevo que pasa por `WorkshopRepository.GetMembershipAsync`, usa `WorkshopSeeder.SeedWorkshopWithMemberAsync`** en vez de crear la `WorkshopMembership` a mano. Esa consulta hace `.Include(m => m.UserAccount)` sobre una relación requerida; si el `UserAccountId` no corresponde a una fila real en `Users`, el provider InMemory descarta la fila entera y la membership "no existe" — resultando en `access_denied` en todos lados sin ninguna pista de por qué. Ya costó depurar 18 tests fallando por esto.

No confíes en que todo el backend está cubierto: `ClientService`, `MotorcycleService`, `UserService`, `WorkshopService` y `MaintenanceHistoryService` no tienen tests dedicados todavía (ver [mejoras.md](mejoras.md)).

## Frontend (`frontend/`)

React 19 + Vite + TypeScript + TailwindCSS 4 + React Query + React Router 7. Alias `@/` apunta a `src/`.

Módulos en `src/modules/<modulo>/`: `types.ts`, `<modulo>-api.ts` (llama a `apiRequest` de `shared/lib/api-client.ts` — maneja el Bearer token y los `ProblemDetails` del backend), `pages/`, y opcionalmente `components/`. UI compartida en `src/shared/ui/` (Radix + class-variance-authority + tailwind-merge, estilo shadcn/ui). Módulos: `auth`, `clientes`, `motocicletas`, `ordenes`, `inventario`, `talleres`, `historial`, `dashboard`.

**Todos los módulos están conectados a la API real** — ya no hay datos hardcodeados en ningún componente. `clientes-api.ts` sigue siendo la referencia más clara del patrón (fetch tipado + normalización de payload). Dentro de cada página, usa `useAuth().hasAnyRole([...])` para condicionar acciones puntuales (no toda la página necesita `RoleRoute` si solo una acción es restringida).

`VITE_API_BASE_URL` en `.env` apunta al backend (default `https://localhost:7222`).

**Comandos útiles**:
```bash
npm run dev                  # servidor de desarrollo
npm run build                # tsc -b + vite build
npm run lint
npm run generate:api-types   # genera src/shared/api/schema.d.ts desde el swagger.json del backend (requiere backend corriendo)
```

**PWA/Capacitor/Electron**: hay un manifest PWA real e instalable (`public/manifest.webmanifest`, sin service worker todavía). `capacitor.config.ts` y `electron/main.js` son placeholders documentados sin las dependencias instaladas — no asumas que Capacitor o Electron son funcionales hasta que alguien corra los pasos que esos archivos documentan.

## Convenciones al proponer cambios

- Backend y frontend usan roles en inglés (`Owner`, `Mechanic`, `Receptionist`) pero el copy de UI y los docs de producto están en español — mantén esa mezcla, no traduzcas los roles ni anglicices el copy visible al usuario.
- Antes de crear un módulo/feature nuevo en cualquiera de los dos lados, revisa cómo está resuelto un módulo existente análogo y replica la estructura en vez de improvisar una nueva.
- Si vas a tocar autenticación o el aislamiento multi-tenant, hay tests reales que lo cubren (`MultiTenantIsolationTests`, `WorkOrderServiceTests`, etc.) — corre `dotnet test` después de cualquier cambio ahí, no asumas que "se ve bien" es suficiente.
- El envío de emails (confirmación, reset de password) hoy es un stub que solo registra en logs (`LoggingEmailSender`). No asumas que un usuario realmente recibe un correo — si una tarea depende de eso, hay que conectar un proveedor real primero.
- Antes de agregar infraestructura nueva (otro pipeline de CI, otro Dockerfile, otra herramienta de observabilidad), revisa [mejoras.md](mejoras.md) — puede que ya exista una decisión tomada al respecto (por ejemplo: se optó por logging JSON nativo en vez de Serilog para no agregar dependencias sin poder validarlas en su momento).

# MotoCore Backend

API REST moderna para gestión de autenticación y taller mecánico construida con .NET 10.0 siguiendo Clean Architecture.

## Arquitectura

Este proyecto implementa **Clean Architecture** (Arquitectura Limpia) con separación clara de responsabilidades en capas concéntricas:

```
┌─────────────────────────────────────────┐
│         MotoCore.Api (Presentación)     │  Endpoints, Controllers
├─────────────────────────────────────────┤
│      MotoCore.Application (Casos de Uso)│  Servicios, Contratos, Modelos
├─────────────────────────────────────────┤
│   MotoCore.Infrastructure (Infraestr.)  │  DB, Auth, External Services
├─────────────────────────────────────────┤
│       MotoCore.Domain (Dominio)         │  Entidades, Lógica de Negocio
└─────────────────────────────────────────┘
```

### Capas del Proyecto

#### 1. **MotoCore.Domain** (Capa de Dominio)
- **Sin dependencias externas**
- Contiene las entidades del negocio
- Lógica de dominio pura

**Entidades por módulo:**
| Módulo | Entidades |
|---|---|
| `Auth` | `UserAccount`, `RefreshToken`, `ExternalLogin`, `SystemRoles` |
| `Workshops` | `Workshop`, `WorkshopMembership` |
| `Clients` | `Client` |
| `Motorcycles` | `Motorcycle` |
| `WorkOrders` | `WorkOrder`, `WorkOrderStatus` |
| `Inventory` | `Part`, `PartMovement`, `PartMovementType` |
| `MaintenanceHistory` | `MaintenanceHistoryEntry` |
| `Audit` | `AuditLogEntry` |

#### 2. **MotoCore.Application** (Capa de Aplicación)
- **Depende solo de Domain**
- Casos de uso y lógica de negocio
- Contratos (interfaces)
- Modelos de Request/Response
- Patrón Result para manejo de errores

**Servicios y contratos** (uno por módulo, misma subestructura `Contracts/`, `Models/`, `Services/`, `Validators/`):

| Módulo | Servicio | Contrato principal |
|---|---|---|
| `Auth` | `AuthService` | `IAuthService`, `IJwtTokenGenerator`, `IPasswordHashingService`, `IRefreshTokenProtector`, `IEmailSender`, `IUserIdentityRepository` |
| `Users` | `UserService` | `IUserService` |
| `Workshops` | `WorkshopService` | `IWorkshopService`, `IWorkshopRepository` |
| `Clients` | `ClientService` | `IClientService`, `IClientRepository` |
| `Motorcycles` | `MotorcycleService` | `IMotorcycleService`, `IMotorcycleRepository` |
| `WorkOrders` | `WorkOrderService` | `IWorkOrderService`, `IWorkOrderRepository` |
| `Inventory` | `InventoryService` | `IInventoryService`, `IPartRepository`, `IPartMovementRepository` |
| `MaintenanceHistory` | `MaintenanceHistoryService` | `IMaintenanceHistoryService`, `IMaintenanceHistoryRepository` |
| `Audit` | `AuditLogService` | `IAuditLogService`, `IAuditLogRepository` |

Todo servicio de módulo de negocio sigue el mismo patrón de entrada: valida `IWorkshopRepository.GetMembershipAsync(workshopId, userId)` y el rol del miembro antes de tocar cualquier dato — es el mecanismo central de aislamiento multi-tenant.

#### 3. **MotoCore.Infrastructure** (Capa de Infraestructura)
- **Depende de Application y Domain**
- Implementación de servicios externos
- Persistencia (Entity Framework Core)
- Autenticación JWT
- Seguridad

**Componentes:**
- `MotoCoreDbContext` - Contexto de EF Core
- `UserIdentityRepository` - Repositorio de usuarios
- `JwtTokenGenerator` - Generación de tokens
- `PasswordHashingService` - Hash de contraseñas
- Soporte para PostgreSQL e InMemory Database

#### 4. **MotoCore.Api** (Capa de Presentación)
- **Depende de Application e Infrastructure**
- Minimal APIs de ASP.NET Core
- Endpoints REST
- Configuración de servicios
- Middleware de autenticación/autorización

## Sistema de Autenticación

### Características
- **JWT Bearer Authentication** con tokens de acceso y actualización
- **Refresh Token Rotation** - Seguridad mejorada con rotación automática
- **IP Tracking** - Auditoría de tokens por dirección IP
- **Password Hashing** - Usando ASP.NET Core Identity
- **Role-Based Authorization** - 3 roles del sistema
- **Aislamiento por taller** - Datos operativos segmentados por workshop

### Flujo de Autenticación

```
1. REGISTRO
   POST /api/auth/register
   
   - Valida email y contraseña (min 8 caracteres)
   - Hash de contraseña
  - Crea usuario con rol según política de negocio
   - Genera Access Token (15 min) + Refresh Token (7 días)

2. LOGIN
   POST /api/auth/login
   
   - Verifica credenciales
   - Genera tokens JWT

3. REFRESH TOKEN
   POST /api/auth/refresh-token
   
   - Valida refresh token
   - Revoca token anterior
   - Genera nuevos tokens

4. LOGOUT
   POST /api/auth/logout
   
   - Revoca refresh token actual
```

## API Endpoints

### Authentication (`/api/auth`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/external/providers` | Listar proveedores externos | No |
| POST | `/register` | Registrar cuenta | No |
| POST | `/login` | Iniciar sesión | No |
| POST | `/refresh-token` | Renovar token | No |
| POST | `/logout` | Cerrar sesión | No |

### Users (`/api/users`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar usuarios | Owner |
| GET | `/me` | Obtener mi perfil | User |
| GET | `/{userId}` | Obtener usuario | User/Owner |
| PUT | `/me` | Actualizar mi perfil | User |
| PUT | `/{userId}` | Actualizar usuario | Owner |
| PATCH | `/{userId}/role` | Cambiar rol | Owner |
| DELETE | `/{userId}` | Eliminar usuario | Owner |

### Workshops (`/api/workshops`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear taller | Owner |
| GET | `/` | Listar mis talleres | User |
| GET | `/{id}` | Ver taller | Member |
| PUT | `/{id}` | Actualizar taller | Owner |
| DELETE | `/{id}` | Eliminar taller | Owner |
| GET | `/{id}/members` | Listar miembros | Member |
| POST | `/{id}/members/invite` | Invitar miembro | Owner |
| DELETE | `/{id}/members/{mid}` | Remover miembro | Owner |
| PATCH | `/{id}/members/{mid}/role` | Cambiar rol miembro | Owner |

### Clients (`/api/clients`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear cliente | Owner/Receptionist |
| GET | `/` | Listar clientes del taller | Member |
| GET | `/{clientId}` | Ver cliente | Member |
| GET | `/search?query=` | Buscar clientes (nombre, email, teléfono, RUT) | Member |
| PUT | `/{clientId}` | Actualizar cliente | Owner/Receptionist |
| DELETE | `/{clientId}` | Eliminar (soft delete) | Owner/Receptionist |
| GET | `/{clientId}/summary` | Resumen del cliente | Member |
| GET | `/statistics` | Estadísticas del taller | Member |

### Motorcycles (`/api/motorcycles`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear motocicleta | Owner/Receptionist |
| GET | `/` | Listar motocicletas del taller | Member |
| GET | `/{motorcycleId}` | Ver motocicleta | Member |
| GET | `/by-client/{clientId}` | Motocicletas de un cliente | Member |
| PUT | `/{motorcycleId}` | Actualizar motocicleta | Owner/Receptionist |
| DELETE | `/{motorcycleId}` | Eliminar (soft delete) | Owner |

### Work Orders (`/api/work-orders`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear orden de trabajo | Owner/Receptionist |
| GET | `/` | Listar órdenes del taller | Member |
| GET | `/{workOrderId}` | Ver orden | Member |
| GET | `/by-motorcycle/{motorcycleId}` | Órdenes de una motocicleta | Member |
| PATCH | `/{workOrderId}/status` | Cambiar estado (Pending InDiagnosis InRepair Completed Delivered) | Owner/Mechanic |
| PATCH | `/{workOrderId}/diagnosis` | Actualizar diagnóstico | Owner/Mechanic |
| PATCH | `/{workOrderId}/close` | Cerrar orden (costo final) | Owner/Mechanic |
| PATCH | `/{workOrderId}/deliver` | Entregar orden | Owner/Receptionist |

### Inventory (`/api/inventory`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/parts` | Crear repuesto | Owner/Receptionist |
| GET | `/parts` | Listar repuestos del taller | Member |
| GET | `/parts/{partId}` | Ver repuesto | Member |
| GET | `/low-stock` | Repuestos con stock bajo el mínimo | Owner/Receptionist |
| PUT | `/parts/{partId}` | Actualizar repuesto | Owner/Receptionist |
| DELETE | `/parts/{partId}` | Eliminar repuesto (soft delete) | Owner |
| POST | `/movements` | Registrar movimiento de stock (compra, venta, ajuste, devolución, transferencia, dañado) | Member |
| GET | `/movements` | Listar movimientos del taller | Owner/Receptionist |

### Maintenance History (`/api/maintenance-history`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear entrada de historial | Member |
| GET | `/{entryId}` | Ver entrada | Member |
| GET | `/motorcycles/{motorcycleId}` | Historial de una motocicleta | Member |
| GET | `/clients/{clientId}` | Historial de un cliente | Member |

No expone un listado global por taller (solo por motocicleta o cliente) — el frontend lo consume embebido en la vista de cada motocicleta.

### Audit Log (`/api/audit-logs`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Ver auditoría del taller (cambios de rol, remoción de miembros/talleres) | Owner |

### System
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check básico | No |
| GET | `/health/db` | Health check de conexión a base de datos | No |

Los endpoints `/api/auth/register`, `/login`, `/refresh-token`, `/forgot-password`, `/reset-password` y `/resend-confirmation` tienen rate limiting (10 solicitudes/minuto por defecto, política `"auth"` en `Program.cs`).

## Roles del Sistema

- **Owner** - Propietario del taller con control administrativo
- **Mechanic** - Mecánico del taller (múltiples permitidos)
- **Receptionist** - Recepcionista (múltiples permitidos, rol por defecto)

MotoCore opera con un modelo multi-taller: cada `Owner` administra su propio taller y los datos (clientes, motocicletas, órdenes, inventario, historial) se mantienen aislados por taller.

## Base de Datos

### Proveedores Soportados
- **PostgreSQL** (Producción)
- **InMemory** (Desarrollo/Testing)

### Esquema de Tablas

```sql
users
  - id (PK, UUID)
  - email (unique)
  - normalized_email (unique index)
  - password_hash
  - first_name
  - last_name
  - role
  - email_confirmed
  - created_at_utc
  - updated_at_utc

refresh_tokens
  - id (PK, UUID)
  - user_account_id (FK users)
  - token_hash (unique index)
  - created_at_utc
  - created_by_ip
  - expires_at_utc
  - revoked_at_utc
  - revoked_by_ip
  - replaced_by_token_hash

external_logins
  - id (PK, UUID)
  - user_account_id (FK users)
  - provider
  - provider_subject
  - email
  - unique(provider, provider_subject)
```

### Tablas de negocio (una por módulo, todas aisladas por `workshop_id`)

| Tabla | Módulo | Notas |
|---|---|---|
| `workshops` | Workshops | `owner_id` `users` |
| `workshop_memberships` | Workshops | unique(`workshop_id`, `user_account_id`) |
| `clients` | Clients | unique(`workshop_id`, `email`) |
| `motorcycles` | Motorcycles | `client_id` `clients`; unique(`workshop_id`, `license_plate`) |
| `work_orders` | WorkOrders | `motorcycle_id` `motorcycles`; unique(`workshop_id`, `order_number`) |
| `parts` | Inventory | unique(`workshop_id`, `part_number`) |
| `part_movements` | Inventory | `part_id` `parts`; `work_order_id` `work_orders` (nullable) |
| `maintenance_history` | MaintenanceHistory | `motorcycle_id` `motorcycles`, `client_id` `clients`, `work_order_id` `work_orders` (nullable) |
| `audit_log_entries` | Audit | `workshop_id`/`performed_by_user_id` sin FK real (el registro debe sobrevivir aunque se borre el taller o el usuario) |

Todas las tablas de negocio usan `Guid` generado por la aplicación (`ValueGeneratedNever()` en EF Core) — cualquier entidad nueva necesita `Id = Guid.NewGuid()` como valor por defecto, o la primera fila queda con `Guid.Empty` y la segunda choca con la clave primaria (ver `CLAUDE.md`).

## Configuración

### appsettings.json

```json
{
  "Database": {
    "Provider": "PostgreSql"  // o "InMemory"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=motocore;..."
  },
  "Jwt": {
    "Issuer": "MotoCore.Api",
    "Audience": "MotoCore.Client",
    "SigningKey": "your-secret-key-min-32-characters",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays": 7
  },
  "Authentication": {
    "ExternalProviders": [
      { "Name": "google", "DisplayName": "Google", "Enabled": false },
      { "Name": "facebook", "DisplayName": "Facebook", "Enabled": false }
    ]
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  }
}
```

### Variables de Entorno

El proyecto soporta archivos `.env` para configuración sensible:

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=motocore
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=your-password

JWT_SIGNING_KEY=your-secret-key
JWT_ISSUER=MotoCore.Api
JWT_AUDIENCE=MotoCore.Client
```

## Cómo Ejecutar

### Prerequisitos
- .NET 10.0 SDK
- PostgreSQL 15+ (opcional, puede usar InMemory)

### Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/dtarqui/MotoCore.git
cd MotoCore/backend

# 2. Restaurar dependencias
dotnet restore

# 3. Configurar base de datos
# Opción A: Usar InMemory (no requiere setup)
# En appsettings.Development.json: "Provider": "InMemory"

# Opción B: Usar PostgreSQL
# Crear base de datos y configurar connection string
dotnet ef database update --project src/MotoCore.Infrastructure

# 4. Ejecutar la API
dotnet run --project src/MotoCore.Api

# La API estará disponible en https://localhost:5001
# Swagger UI: https://localhost:5001/swagger
```

### Migraciones de Base de Datos

```bash
# Crear nueva migración
dotnet ef migrations add MigrationName --project src/MotoCore.Infrastructure --startup-project src/MotoCore.Api

# Aplicar migraciones
dotnet ef database update --project src/MotoCore.Infrastructure --startup-project src/MotoCore.Api

# Revertir migración
dotnet ef database update PreviousMigration --project src/MotoCore.Infrastructure --startup-project src/MotoCore.Api
```

### Con Docker

```bash
# Desde la raíz del repo, levanta Postgres + backend + frontend juntos
docker compose up --build

# Solo la imagen del backend
docker build -t motocore-backend ./backend
```

El `Dockerfile` es multi-stage (`sdk:10.0` para build/publish, `aspnet:10.0` para runtime) y aplica las migraciones automáticamente al arrancar contra PostgreSQL.

## Testing

Suite de tests con xUnit sobre `MotoCoreDbContext` en modo InMemory (sin mocks): cubre reglas de negocio de `AuthService`, `WorkOrderService`, `InventoryService` y, de forma explícita, el aislamiento de datos entre talleres (multi-tenancy) en `tests/MotoCore.Api.Tests/MultiTenant/`.

Validado con Docker (`mcr.microsoft.com/dotnet/sdk:10.0`): **25/25 tests en verde**, y el stack completo (`docker compose up`) probado end-to-end contra PostgreSQL real vía `curl` (registro, login, CRUD, audit log, rate limiting).

```bash
# Ejecutar todos los tests
dotnet test

# Ejecutar con cobertura
dotnet test --collect:"XPlat Code Coverage"
```

## Patrones y Principios

### Patrones Implementados
- **Clean Architecture** - Separación en capas
- **Repository Pattern** - Abstracción de datos
- **Result Pattern** - Manejo de errores sin excepciones
- **Dependency Injection** - IoC Container
- **Options Pattern** - Configuración fuertemente tipada
- **Factory Pattern** - DbContextFactory
- **Minimal APIs** - Endpoints ligeros

### Principios SOLID
- **S** - Single Responsibility: Cada clase tiene una responsabilidad única
- **O** - Open/Closed: Extensible sin modificar código existente
- **L** - Liskov Substitution: Interfaces bien definidas
- **I** - Interface Segregation: Interfaces específicas por servicio
- **D** - Dependency Inversion: Depende de abstracciones, no implementaciones

## Seguridad

- Contraseñas hasheadas con ASP.NET Core Identity
- JWT con firma HMAC-SHA256
- Refresh token rotation
- IP tracking para auditoría
- CORS configurable
- HTTPS enforced
- Nullable reference types habilitado
- Rate limiting en endpoints de autenticación
- Email confirmation (lógica completa; envío real de correo pendiente)

## Tecnologías Utilizadas

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | .NET | 10.0 |
| Lenguaje | C# | 14.0 |
| ORM | Entity Framework Core | 10.0 |
| Base de Datos | PostgreSQL | 15+ |
| Autenticación | JWT Bearer | - |
| Documentación | Swagger/OpenAPI | 10.0 |
| Testing | xUnit | 2.9 |

## Próximas Mejoras

### Arquitectura
- [x] Implementar FluentValidation para validaciones
- [x] Agregar middleware de manejo de excepciones global
- [ ] Implementar AutoMapper para mapeo de objetos
- [x] Agregar logging estructurado (JSON console nativo de `Microsoft.Extensions.Logging`; Serilog/Application Insights quedan como upgrade opcional — no se agregó para no introducir dependencias sin poder validar `dotnet restore` en el entorno de esta sesión)
- [ ] Implementar CQRS con MediatR
- [ ] Agregar Response Caching
- [x] Implementar Health Checks avanzados (`/health/db`, chequeo real de conexión a la base de datos)

### Funcionalidades
- [x] Email confirmation (lógica y endpoints; el envío usa un `IEmailSender` que hoy solo registra en logs — swap por SendGrid/SMTP en `Infrastructure/DependencyInjection.cs` cuando se elija proveedor)
- [x] Password reset flow (mismo estado que email confirmation)
- [ ] Two-Factor Authentication (2FA)
- [x] Rate limiting (10 solicitudes/minuto en endpoints de `/api/auth`)
- [x] Audit trail (cambios de rol y remociones en talleres; `GET /api/audit-logs`, solo Owner)
- [ ] OAuth con Google/Facebook
- [x] Multi-tenancy (aislamiento por taller ya implementado)

### DevOps
- [x] Docker containerization (`backend/Dockerfile`, `docker-compose.yml` en la raíz — validado end-to-end)
- [x] CI/CD pipeline (`.github/workflows/ci.yml`: build + test backend, lint + build frontend)
- [x] Integration tests (servicios contra `MotoCoreDbContext` InMemory y, para validación puntual, contra PostgreSQL real vía Docker)
- [ ] Load testing
- [ ] Monitoring con Application Insights / OpenTelemetry

## Estructura de Archivos

```
backend/
├── src/
│   ├── MotoCore.Domain/
│   │   ├── Auth/                  UserAccount, RefreshToken, ExternalLogin, SystemRoles
│   │   ├── Workshops/              Workshop, WorkshopMembership
│   │   ├── Clients/                Client
│   │   ├── Motorcycles/            Motorcycle
│   │   ├── WorkOrders/             WorkOrder, WorkOrderStatus
│   │   ├── Inventory/              Part, PartMovement, PartMovementType
│   │   ├── MaintenanceHistory/     MaintenanceHistoryEntry
│   │   └── Audit/                  AuditLogEntry
│   │
│   ├── MotoCore.Application/
│   │   ├── <Módulo>/               un directorio por módulo (mismos 8 de arriba + Users)
│   │   │   ├── Contracts/          I*Service, I*Repository
│   │   │   ├── Models/             DTOs y Request models
│   │   │   ├── Services/           implementación de I*Service
│   │   │   └── Validators/         FluentValidation por Request model
│   │   ├── Common/
│   │   │   ├── Results/            Result, Result<T>, Error
│   │   │   └── Utilities/          EmailValidator, etc.
│   │   └── DependencyInjection.cs
│   │
│   ├── MotoCore.Infrastructure/
│   │   ├── Auth/                  JwtTokenGenerator, PasswordHashingService, RefreshTokenProtector, LoggingEmailSender
│   │   ├── Persistence/            MotoCoreDbContext, *Repository, Migrations/
│   │   ├── Configuration/          EnvironmentFileLoader
│   │   └── DependencyInjection.cs
│   │
│   └── MotoCore.Api/
│       ├── Controllers/            un *Controller.cs por módulo (8 módulos + Audit)
│       ├── Extensions/             ClaimsPrincipalExtensions, ResultExtensions
│       ├── Filters/                ValidationFilter
│       ├── Middleware/             GlobalExceptionHandlingMiddleware
│       ├── HealthChecks/           DatabaseHealthCheck
│       ├── Program.cs
│       └── appsettings.json
│
├── tests/
│   └── MotoCore.Api.Tests/
│       ├── TestSupport/            InMemoryDbContextFactory, WorkshopSeeder
│       ├── Auth/, WorkOrders/, Inventory/, MultiTenant/, Audit/
│
├── Dockerfile
├── compose.local.yml               solo Postgres, para `dotnet run` fuera de Docker
└── README.md
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es privado y de uso interno.

## Autor

**dtarqui** - [GitHub](https://github.com/dtarqui)

---

**MotoCore Backend** - Sistema de gestión de taller mecánico con .NET 10.0

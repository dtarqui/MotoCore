# MotoCore Backend

API REST moderna para gestión de autenticación y taller mecánico construida con .NET 10.0 siguiendo Clean Architecture.

## 🏗️ Arquitectura

Este proyecto implementa **Clean Architecture** (Arquitectura Limpia) con separación clara de responsabilidades en capas concéntricas:

```
┌─────────────────────────────────────────┐
│         MotoCore.Api (Presentación)     │  ← Endpoints, Controllers
├─────────────────────────────────────────┤
│      MotoCore.Application (Casos de Uso)│  ← Servicios, Contratos, Modelos
├─────────────────────────────────────────┤
│   MotoCore.Infrastructure (Infraestr.)  │  ← DB, Auth, External Services
├─────────────────────────────────────────┤
│       MotoCore.Domain (Dominio)         │  ← Entidades, Lógica de Negocio
└─────────────────────────────────────────┘
```

### 📦 Capas del Proyecto

#### 1. **MotoCore.Domain** (Capa de Dominio)
- **Sin dependencias externas**
- Contiene las entidades del negocio
- Lógica de dominio pura

**Entidades:**
- `UserAccount` - Usuario del sistema
- `RefreshToken` - Tokens de actualización JWT
- `ExternalLogin` - Autenticación con proveedores externos
- `SystemRoles` - Roles del sistema (Owner, Mechanic, Receptionist)

#### 2. **MotoCore.Application** (Capa de Aplicación)
- **Depende solo de Domain**
- Casos de uso y lógica de negocio
- Contratos (interfaces)
- Modelos de Request/Response
- Patrón Result para manejo de errores

**Servicios:**
- `AuthService` - Autenticación y autorización
- `UserService` - Gestión de usuarios

**Contratos:**
- `IAuthService`, `IUserService`
- `IUserIdentityRepository`
- `IJwtTokenGenerator`
- `IPasswordHashingService`
- `IRefreshTokenProtector`

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

## 🔐 Sistema de Autenticación

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
   ↓
   - Valida email y contraseña (min 8 caracteres)
   - Hash de contraseña
  - Crea usuario con rol según política de negocio
   - Genera Access Token (15 min) + Refresh Token (7 días)

2. LOGIN
   POST /api/auth/login
   ↓
   - Verifica credenciales
   - Genera tokens JWT

3. REFRESH TOKEN
   POST /api/auth/refresh-token
   ↓
   - Valida refresh token
   - Revoca token anterior
   - Genera nuevos tokens

4. LOGOUT
   POST /api/auth/logout
   ↓
   - Revoca refresh token actual
```

## 🌐 API Endpoints

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

### System
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | No |

## 🎭 Roles del Sistema

- **Owner** - Propietario del taller con control administrativo
- **Mechanic** - Mecánico del taller (múltiples permitidos)
- **Receptionist** - Recepcionista (múltiples permitidos, rol por defecto)

MotoCore opera con un modelo multi-taller: cada `Owner` administra su propio taller y los datos (clientes, motocicletas, órdenes, inventario, historial) se mantienen aislados por taller.

## 🗄️ Base de Datos

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
  - user_account_id (FK → users)
  - token_hash (unique index)
  - created_at_utc
  - created_by_ip
  - expires_at_utc
  - revoked_at_utc
  - revoked_by_ip
  - replaced_by_token_hash

external_logins
  - id (PK, UUID)
  - user_account_id (FK → users)
  - provider
  - provider_subject
  - email
  - unique(provider, provider_subject)
```

## ⚙️ Configuración

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

## 🚀 Cómo Ejecutar

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

## 🧪 Testing

```bash
# Ejecutar todos los tests
dotnet test

# Ejecutar con cobertura
dotnet test --collect:"XPlat Code Coverage"
```

## 📐 Patrones y Principios

### Patrones Implementados
- ✅ **Clean Architecture** - Separación en capas
- ✅ **Repository Pattern** - Abstracción de datos
- ✅ **Result Pattern** - Manejo de errores sin excepciones
- ✅ **Dependency Injection** - IoC Container
- ✅ **Options Pattern** - Configuración fuertemente tipada
- ✅ **Factory Pattern** - DbContextFactory
- ✅ **Minimal APIs** - Endpoints ligeros

### Principios SOLID
- **S** - Single Responsibility: Cada clase tiene una responsabilidad única
- **O** - Open/Closed: Extensible sin modificar código existente
- **L** - Liskov Substitution: Interfaces bien definidas
- **I** - Interface Segregation: Interfaces específicas por servicio
- **D** - Dependency Inversion: Depende de abstracciones, no implementaciones

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con ASP.NET Core Identity
- ✅ JWT con firma HMAC-SHA256
- ✅ Refresh token rotation
- ✅ IP tracking para auditoría
- ✅ CORS configurable
- ✅ HTTPS enforced
- ✅ Nullable reference types habilitado
- ⚠️ Rate limiting (pendiente)
- ⚠️ Email confirmation (pendiente)

## 📊 Tecnologías Utilizadas

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | .NET | 10.0 |
| Lenguaje | C# | 14.0 |
| ORM | Entity Framework Core | 10.0 |
| Base de Datos | PostgreSQL | 15+ |
| Autenticación | JWT Bearer | - |
| Documentación | Swagger/OpenAPI | 10.0 |
| Testing | MSTest | - |

## 🛠️ Próximas Mejoras

### Arquitectura
- [ ] Implementar FluentValidation para validaciones
- [ ] Agregar middleware de manejo de excepciones global
- [ ] Implementar AutoMapper para mapeo de objetos
- [ ] Agregar logging estructurado con Serilog
- [ ] Implementar CQRS con MediatR
- [ ] Agregar Response Caching
- [ ] Implementar Health Checks avanzados

### Funcionalidades
- [ ] Email confirmation
- [ ] Password reset flow
- [ ] Two-Factor Authentication (2FA)
- [ ] Rate limiting
- [ ] Audit trail
- [ ] OAuth con Google/Facebook
- [ ] Multi-tenancy

### DevOps
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Integration tests
- [ ] Load testing
- [ ] Monitoring con Application Insights

## 📝 Estructura de Archivos

```
backend/
├── src/
│   ├── MotoCore.Domain/
│   │   └── Auth/
│   │       ├── UserAccount.cs
│   │       ├── RefreshToken.cs
│   │       ├── ExternalLogin.cs
│   │       └── SystemRoles.cs
│   │
│   ├── MotoCore.Application/
│   │   ├── Auth/
│   │   │   ├── Contracts/
│   │   │   ├── Models/
│   │   │   └── Services/
│   │   ├── Users/
│   │   │   ├── Contracts/
│   │   │   ├── Models/
│   │   │   └── Services/
│   │   ├── Common/
│   │   │   └── Results/
│   │   └── DependencyInjection.cs
│   │
│   ├── MotoCore.Infrastructure/
│   │   ├── Auth/
│   │   ├── Persistence/
│   │   │   └── Migrations/
│   │   ├── Configuration/
│   │   └── DependencyInjection.cs
│   │
│   └── MotoCore.Api/
│       ├── Controllers/
│       │   ├── AuthController.cs
│       │   └── UserController.cs
│       ├── Program.cs
│       └── appsettings.json
│
├── tests/
│   └── MotoCore.Api.Tests/
│
└── README.md
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 👤 Autor

**dtarqui** - [GitHub](https://github.com/dtarqui)

---

⭐ **MotoCore Backend** - Sistema de gestión de taller mecánico con .NET 10.0

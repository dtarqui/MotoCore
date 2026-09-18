<p align="center">
        <img src="https://github.com/user-attachments/assets/37b92f90-e109-4989-9789-7bf45a1c6afa" alt="MotoCore logo" width="280" />
</p>

# MotoCore

Plataforma SaaS para la gestión integral de talleres de motocicletas, evolucionando hacia un modelo **ERP multiorganización**: una cuenta administra varias organizaciones, y cada organización opera varios talleres. **Mercado objetivo por ahora: Bolivia.**

> **La especificación gobierna la construcción**, no al revés: la norma está en [docs/](docs/README.md) y, cuando el código difiere de ella, **se corrige el código**. El detalle técnico de cada parte está en [server/README.md](server/README.md) y [frontend/README.md](frontend/README.md).
>
> **Lo construido es el corte vertical** que demuestra el modelo jerárquico: identidad, organizaciones, talleres, miembros, **clientes** (nivel organización) e **inventario** (nivel taller), más el registro de auditoría y el aislamiento verificado en dos capas.

## Resumen

MotoCore centraliza la operación diaria de un taller: clientes, motocicletas, órdenes de trabajo, inventario, historial técnico y recordatorios de mantenimiento. El proyecto avanza hacia una plataforma multiorganización (varias organizaciones por cuenta, con cambio de organización activa estilo QuickBooks/Zoho) enfocada en el mercado boliviano.

## Propuesta de valor

- Digitaliza los procesos operativos del taller.
- Mejora el seguimiento de servicios y mantenimientos.
- Organiza el historial técnico de cada motocicleta.
- Facilita el control de repuestos y stock.
- Entrega métricas para soporte de decisiones.

## Alcance

MotoCore está orientado a talleres de motocicletas, mecánicos independientes y pequeños centros de servicio en Bolivia.

Bajo el modelo **multiorganización**, una cuenta puede administrar **varias organizaciones** (`organizations`), y cada organización puede tener **varios talleres** (`workshops`). El equipo (`Owner`, `Mechanic`, `Receptionist`) y los datos (clientes, motos, órdenes, inventario, historial) quedan **aislados por organización** — sin compartición entre organizaciones. El taller es una subdivisión operativa, no una frontera de seguridad: ver el [Glosario](docs/ingenieria/01-glosario.md).

## Arquitectura (alto nivel)

**Objetivo de la reescritura (en `server/`):**

```text
Frontend (React + Vite, PWA)
        |
Backend Node/TS (Hono) — Serverless en Vercel
        |
Supabase (PostgreSQL + Auth + RLS + Storage)
```

- Aislamiento multi-tenant **por organización**: políticas **RLS** en Postgres + chequeo de membresía en la API (defensa en profundidad).
- Autenticación por **Supabase Auth** (registro/login/refresh/OAuth); la API verifica el token.

## Estructura del repositorio

```
server/              Interfaz de programación — Node/TS (Hono) + Supabase — ver server/README.md
  src/modules/         Un directorio por módulo, con controlador, servicio y repositorio
  supabase/            Migraciones versionadas, comprobación del esquema y limpieza
frontend/            Cliente web — React 19 + Vite — ver frontend/README.md
docs/                Documentación del proyecto de grado — empezar por docs/README.md
  anteproyecto/        Documento académico (definición, estado del arte, marco teórico)
  ingenieria/          Especificación técnica (requisitos, arquitectura, datos, seguridad, plan)
.github/workflows/   Pipeline de integración continua
package.json         Solo la calidad antes de integrar: Prettier y ESLint en pre-commit
```

## Stack tecnológico

**Frontend**: React · TypeScript · Vite · TailwindCSS · React Query · React Router

**Backend (`server/`)**: Node.js · TypeScript · Hono · Zod · Supabase (`@supabase/supabase-js`) · Vitest · desplegado en Vercel

**Datos**: PostgreSQL, gestionado por Supabase

## Multitenancy ERP

Todos los objetos del esquema llevan el prefijo `mt_`, de modo que MotoCore pueda convivir en `public` con otro sistema sin colisionar.

- `auth.users` (Supabase) = identidad global; `mt_profiles` = perfil.
- `mt_organizations` = **organización**, y es la unidad de aislamiento (_tenant_); **una cuenta puede tener varias**.
- `mt_workshops` = **taller** dentro de una organización; subdivisión operativa, no unidad de aislamiento.
- `mt_memberships` = usuario ↔ organización con rol (`owner`/`mechanic`/`receptionist`); el rol es por organización, no global. **Cada organización tiene un solo propietario activo**, y no lo garantiza solo la API: un índice único parcial lo hace cumplir en el motor.
- Todo dato de negocio se acota por `organization_id`; las entidades de nivel taller llevan además `workshop_id`. El contexto activo se selecciona por petición: cabecera `X-Org-Id` para la organización y `X-Workshop-Id` para el taller.

**La regla de rutas que se deriva de eso**: el identificador de la organización aparece en la URL **solo cuando el recurso es la organización misma** (`/api/organizations/...`). Todo lo interior a ella —talleres, miembros, clientes, inventario, auditoría— vive en rutas planas (`/api/workshops`, `/api/members`, `/api/clients`, `/api/inventory/...`) y se resuelve por cabecera. El servidor nunca asume un contexto por defecto: si falta la cabecera exigida, rechaza la petición (ADR-005, §2.3 del [contrato](docs/ingenieria/10-contrato-api.md)).

## Módulos y roadmap

**Construido**: registro atómico que crea cuenta, primera organización, primer taller y membresía propietaria; organizaciones y miembros con control de acceso por rol; talleres y asignación operativa de miembros; clientes (nivel organización); inventario con movimientos de existencias y transferencia entre talleres (nivel taller); registro de auditoría de las seis acciones críticas; y el aislamiento en dos capas, con sus pruebas por las dos vías.

**Fuera del alcance del proyecto de grado** (RF-800, ver [Requisitos](docs/ingenieria/02-requisitos.md)): motocicletas, órdenes de trabajo, historial de mantenimiento y panel de métricas. No están en el repositorio; se incorporarán reutilizando el mismo patrón de alcance por nivel.

**Pendiente dentro del alcance**: ejecutar las tres corridas de validación C0–C3 sobre el proyecto desechable (`npm run evidencia` en `server/`), la evaluación con operadores y la medición de costo — los tres son trabajo de la fase de validación, no construcción.

**Funcionalidades identificadas para el mercado boliviano** (ver [docs/ingenieria/09-analisis-mercado.md](docs/ingenieria/09-analisis-mercado.md)): facturación electrónica del SIN, mensajería por WhatsApp, presupuestos con aprobación del cliente, facturación y cobro en línea, agendamiento, inspección digital y portal del cliente.

## Seguridad

- Autenticación por Supabase Auth; la API verifica el token, no lo emite (ADR-004).
- Control de acceso por roles y aislamiento de datos por organización (RLS + chequeo en la API).
- Los secretos van en variables de entorno (Supabase/Vercel), nunca en el repositorio (RNF-103).

Roles: `Owner`, `Mechanic`, `Receptionist`.

## Cómo ejecutar

### Backend (`server/`) — Node/TS + Supabase

```bash
cd server
npm install
# 1) Crear un proyecto Supabase y aplicar supabase/migrations/*.sql en orden
#    (supabase/reset.sql parte de cero; supabase/verify.sql comprueba el resultado)
# 2) Copiar .env.example a .env con las claves de Supabase
npm run dev        # http://localhost:8787
npm test           # unit + HTTP (la integración corre solo con credenciales de Supabase)
```

Detalle en [server/README.md](server/README.md).

### Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

Configura `VITE_API_BASE_URL` en `frontend/.env` apuntando a la URL del backend.

### Requisitos previos

| Herramienta               | Necesaria para                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------- |
| Node.js 24 (mínimo 22.22) | Interfaz de programación y cliente web — lo exige jsdom, con el que corre el nivel N6 |
| Cuenta de Supabase        | Backend nuevo (Postgres + Auth)                                                       |

## Variables de entorno

**Backend (`server/.env`)**

| Variable                   | Descripción                                                                      |
| -------------------------- | -------------------------------------------------------------------------------- |
| `SUPABASE_URL`             | URL del proyecto Supabase                                                        |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable — pública por diseño                                            |
| `SUPABASE_SECRET_KEY`      | Clave secreta — salta las políticas RLS; nunca commitear ni exponer al navegador |
| `AUTH_AUTO_CONFIRM_EMAIL`  | `true` en desarrollo, para iniciar sesión sin confirmar el correo                |
| `CORS_ALLOWED_ORIGINS`     | Orígenes de navegador admitidos: solo los del cliente web de ese entorno         |

**Frontend (`frontend/.env`)**

| Variable                        | Descripción                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`             | URL del backend que consume el frontend                                             |
| `VITE_SUPABASE_URL`             | URL del proyecto Supabase — el login ocurre contra Auth, no contra la API (ADR-004) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publicable. **Nunca la secreta**: este archivo se empaqueta en el navegador   |

Vite solo expone al navegador las variables con prefijo `VITE_`; una sin él se ignora en silencio.

## Testing

```bash
cd server   && npm test && npm run typecheck   # N1 y N2; con credenciales, también N3 y N4
cd frontend && npm test && npm run build       # N6: contrato desde el lado del cliente
cd frontend && npm run test:e2e                # N7: flujos T1–T3, instalabilidad, responsivo y accesibilidad
cd server   && npm run evidencia -- --corrida 1  # ciclo C0–C3 con su evidencia en evidencia/corrida-1/
```

Los niveles de prueba, la matriz requisito → caso → evidencia y el criterio de cierre están en el [Plan de pruebas](docs/ingenieria/11-plan-pruebas.md). Los casos de integración y de aislamiento (N3, N4) se saltan sin credenciales de Supabase: **un caso omitido no cubre su requisito**. La línea base (C0) deshabilita las políticas del motor y por eso solo corre sobre el proyecto de validación desechable, nombrándolo de forma explícita.

## CI/CD

`.github/workflows/ci.yml` corre en cada integración a `main`: lint, pruebas y compilación del cliente web, y lint, verificación de tipos, pruebas y **cobertura de los servicios de dominio (≥ 80 %)** de la interfaz de programación. Ambos trabajos terminan con la **auditoría de dependencias**, que falla ante una vulnerabilidad alta o crítica (RNF-201, RNF-203, RNF-207, RNF-208).

Antes de integrar, un gancho de _pre-commit_ pasa **Prettier y ESLint** sobre lo que se va a confirmar (`npm install` en la raíz lo instala).

Los niveles N3 y N4 —integración y aislamiento— exigen un proyecto Supabase real y **se omiten** en el pipeline. Un caso omitido no cubre su requisito: la validación del aislamiento se ejecuta aparte, contra un entorno real, antes de cada hito.

`.github/workflows/deploy.yml` publica tras el pipeline (RNF-305): `main` en _staging_ —y ahí ejecuta N3 y N7 contra lo publicado, de modo que un fallo bloquea la promoción— y `release` en producción. Sin los secretos de despliegue configurados, esos pasos se omiten en lugar de fallar.

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

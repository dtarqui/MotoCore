# MotoCore Frontend

SPA de React para la gestión de organizaciones de servicio de motocicletas.

> **Estado:** el SPA consume el backend en [`server/`](../server/README.md), con **Supabase Auth** para la sesión y los **selectores de organización y taller** enviando `X-Org-Id` / `X-Workshop-Id` en cada petición (ADR-005).
>
> Rutas expuestas: clientes e inventario (el corte vertical), talleres, equipo y auditoría. Los módulos de **motocicletas, órdenes e historial** conservan su interfaz en el repositorio pero **no están enrutados**: todavía no tienen endpoints en el backend nuevo, y una pantalla accesible que falla al cargar es peor que una que aún no está.
>
> **Terminología:** el texto visible sigue el [Glosario](../docs/ingenieria/01-glosario.md) — la unidad de aislamiento es la **organización** (`organizations`) y el local físico es el **taller** (`workshops`). Los términos «empresa» y «sucursal» están retirados del proyecto. Los identificadores del contrato y del esquema se conservan en inglés y **no** se traducen.

## Stack

- React 19 + TypeScript + Vite
- TailwindCSS 4
- React Query (`@tanstack/react-query`) para estado de servidor
- React Router 7
- Vitest + React Testing Library para las pruebas
- UI propia sobre Radix + `class-variance-authority` + `tailwind-merge` (estilo shadcn/ui) en `src/shared/ui`

## Cómo ejecutar

```bash
npm install
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm test          # suite de Vitest
npm run lint
npm run build     # tsc -b + vite build
npm run preview   # sirve el build de producción
```

Copia `.env.example` a `.env` y completa:

| Variable | Para qué |
|---|---|
| `VITE_API_BASE_URL` | URL del backend `server/`. Por defecto `http://localhost:8787` (su dev-server) |
| `VITE_SUPABASE_URL` | Proyecto Supabase, para el inicio de sesión |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima — es pública por diseño: el acceso lo deciden las políticas de la base de datos, no el secreto de la clave |

**Nunca** pongas la clave *service-role* en este archivo: se empaqueta en el navegador y esa clave salta las políticas de aislamiento.

### Con Docker

```bash
docker build -t motocore-frontend .
# o desde la raíz del repo, junto con el stack .NET legacy:
docker compose up --build
```

Multi-stage: build con `node:20-alpine`, se sirve con `nginx:alpine` (`nginx.conf` incluye fallback de rutas para el SPA).

### Generar tipos desde la API (OpenAPI) — inactivo

El script `generate:api-types` apunta al `swagger.json` del **backend .NET legacy** (`localhost:7222`), que ya no es el backend de este SPA. El nuevo (`server/`, Hono) no publica un documento OpenAPI, así que hoy los tipos de la API se declaran a mano en cada módulo (`<modulo>-api.ts`).

Queda pendiente decidir si se publica OpenAPI desde `server/` y se retoma la generación, o si se retira el script. Ver [src/shared/api/README.md](src/shared/api/README.md).

### Empaquetado multiplataforma (PWA / Capacitor / Electron)

- **PWA**: ya instalable (`public/manifest.webmanifest`) — sin service worker todavía, no funciona offline.
- **Capacitor / Electron**: `capacitor.config.ts` y `electron/main.js` son placeholders documentados, sin las dependencias instaladas todavía (deliberado). Cada archivo tiene las instrucciones de los siguientes pasos en un comentario.

## Estructura

```
src/
├── app/
│   ├── layouts/       # AppShell (layout autenticado con navegación)
│   └── providers/     # QueryProvider, AppProviders
├── modules/
│   ├── auth/            # login, registro, sesión, rutas protegidas por rol
│   ├── clientes/        # clientes — nivel organización
│   ├── inventario/      # repuestos y movimientos — nivel taller
│   ├── organizaciones/  # selectores de contexto, talleres y equipo
│   ├── auditoria/       # registro de acciones críticas (solo Owner)
│   ├── dashboard/       # resumen del contexto activo
│   ├── motocicletas/    # sin enrutar — a la espera de endpoints
│   ├── ordenes/         # sin enrutar — a la espera de endpoints
│   └── historial/       # sin enrutar — se usa embebido en motocicletas
├── router/             # definición de rutas (React Router)
├── test/               # setup de Vitest
└── shared/
    ├── config/          # API_BASE_URL, navegación
    ├── lib/             # apiRequest, contexto activo, utils
    └── ui/              # componentes de UI reutilizables
```

## El contexto activo

Es la pieza que materializa la jerarquía en la interfaz, y conviene entenderla antes de tocar cualquier módulo.

`shared/lib/active-context.ts` guarda la organización y el taller activos **fuera de React**, para que `apiRequest` pueda adjuntarlos como cabeceras sin recibirlos por parámetro en cada llamada. Se persisten en el almacenamiento local, de modo que recargar la página no pierda el contexto; el valor guardado es solo una preferencia, porque el servidor revalida la membresía en cada petición.

Dos reglas que no deben romperse:

- **Cambiar de organización limpia el taller activo.** El que estaba elegido pertenecía a la organización anterior; conservarlo dejaría al operador trabajando sobre un local ajeno al contexto que cree tener.
- **`X-Workshop-Id` se envía solo en los endpoints de nivel taller**, pasando `withWorkshop: true` a `apiRequest`. En clientes no se envía, y esa ausencia es precisamente lo que demuestra RF-502.

`ContextSelectors` **deriva** la selección efectiva en cada render en lugar de duplicarla en estado: si la organización o el taller elegidos dejan de ser válidos, cae en el primero disponible sin sincronizar estados entre sí.

## Convención de módulos

Cada módulo de feature sigue el mismo patrón (ver `clientes/` como referencia):

- `types.ts` — tipos de dominio y payloads.
- `<modulo>-api.ts` — funciones que llaman a la API vía `apiRequest` de `shared/lib/api-client.ts` (adjunta la credencial y el contexto, y traduce los Problem Details a `ApiError` conservando el código de negocio).
- `pages/` — páginas de React Router.
- `components/` (opcional) — piezas de UI reutilizadas solo dentro del módulo.

Al agregar un módulo nuevo, replica esta estructura en vez de improvisar una distinta.

### Rutas: el contexto no va en la URL

El §2.3 del [contrato](../docs/ingenieria/10-contrato-api.md) reserva el identificador de la organización en la ruta **solo para la organización misma**. Los recursos interiores se piden a rutas planas —`/api/workshops`, `/api/members`, `/api/clients`, `/api/inventory/...`— y el contexto viaja por cabecera. Al escribir un `<modulo>-api.ts` nuevo, no anides `/api/organizations/${orgId}/...`: hay una prueba de regresión que lo detecta.

Las bajas lógicas auditadas se invocan con `POST /…/deactivate`, no con `PATCH`. La excepción son los **vínculos** —quitar un miembro o una asignación—, que siguen siendo `DELETE`.

## Autenticación y roles

`modules/auth` maneja el registro, el inicio de sesión y la sesión contra **Supabase Auth**; la API solo verifica el token (ADR-004). Las rutas se protegen con `ProtectedRoute` (requiere sesión) y `RoleRoute` (requiere alguno de los roles `owner`, `mechanic`, `receptionist`) — ver `router/index.tsx`.

La protección por rol en el cliente es **cosmética**: evita mostrar una pantalla que fallaría al cargar. La restricción real la aplican la API y las políticas de la base de datos. Nunca la trates como control de acceso.

## Estado de servidor con React Query

Cada página usa `useQuery`/`useMutation` directamente (no hay una capa de hooks intermedia). Convención de `queryKey`: un array con el nombre del recurso en plural y, si aplica, el id relacionado — `['clients']`, `['workshops', orgId]`, `['parts']`. Tras una mutación exitosa se invalida la query relacionada en vez de actualizar el caché a mano.

Al cambiar de organización se invalida **todo** el caché: los datos que hubiera son de la organización anterior. Al cambiar de taller solo se invalidan `['parts']` y `['movements']`, porque los datos de nivel organización siguen siendo válidos.

## UI compartida (`src/shared/ui`)

Componentes propios sobre Radix + `class-variance-authority` + `tailwind-merge`, estilo shadcn/ui: `Button`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardFooter`), `Badge`, `Alert` (+ `AlertTitle`/`AlertDescription`), `Table` (+ subcomponentes), `Input`, `PageHeader`. No hay componente de `Select` propio — los formularios usan `<select>` nativo con clases de Tailwind calcadas del estilo de `Input`.

## Pruebas

```bash
npm test          # una pasada
npm run test:watch
```

Vitest sobre jsdom, con React Testing Library. El entorno se configura en `vite.config.ts` y el setup común en `src/test/setup.ts`, que limpia el DOM y el almacenamiento local entre casos: el contexto activo se persiste, y sin esa limpieza un caso heredaría la organización que dejó otro.

Qué cubre, y por qué esas cosas y no otras:

| Archivo | Qué asegura |
|---|---|
| `shared/lib/active-context.test.ts` | Que cambiar de organización **limpia** el taller activo — el fallo más dañino del modelo jerárquico en la interfaz |
| `shared/lib/api-client.test.ts` | Que la credencial y el contexto viajan como fija el §2 del contrato, y que el código de negocio del error sobrevive al cliente |
| `modules/organizaciones/organizaciones-api.test.ts` | Regresión de la regla de rutas (§2.3) y del método de las bajas lógicas (§2.6) |
| `modules/organizaciones/ContextSelectors.test.tsx` | HU-05 y HU-07: que el contexto elegido sea el que viaja después en las cabeceras |
| `modules/auditoria/auditoria-api.test.ts` | Que las seis acciones de RF-703 tengan etiqueta y no queden identificadores crudos en pantalla |

El [plan de pruebas](../docs/ingenieria/11-plan-pruebas.md) no exige automatizar la interfaz: RNF-402 y RNF-403 se verifican por inspección (N0), y RNF-401 y RNF-404 con operadores reales (N5). Esta suite cubre lo que esa evaluación **no** puede comprobar —que el contexto elegido sea exactamente el que se envía— y actúa como red frente a regresiones del contrato. No la sustituye.

## Estado de las features

Enrutadas y conectadas al backend: **clientes**, **inventario**, **talleres**, **equipo** y **auditoría**, más el registro y el inicio de sesión con Supabase Auth y los selectores de contexto activo.

Sin enrutar, a la espera de sus endpoints: **motocicletas**, **órdenes**, **historial** y el detalle del **dashboard**. Están fuera del alcance del proyecto de grado (RF-800). Ver el [análisis del mercado](../docs/ingenieria/09-analisis-mercado.md) para el orden de prioridad de las funcionalidades pendientes.

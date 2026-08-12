# MotoCore Frontend

SPA de React para la gestión de talleres de motocicletas.

> **Nota de estado:** hoy consume la API REST del backend **.NET legacy** ([backend/](../backend/README.md)). Pendiente, como parte del pivote: migrar la auth a **Supabase** y apuntar al backend nuevo en [`server/`](../server/README.md), más el **selector de organización** (multiempresa). Ver [CLAUDE.md](../CLAUDE.md).

## Stack

- React 19 + TypeScript + Vite
- TailwindCSS 4
- React Query (`@tanstack/react-query`) para estado de servidor
- React Router 7
- UI propia sobre Radix + `class-variance-authority` + `tailwind-merge` (estilo shadcn/ui) en `src/shared/ui`

## Cómo ejecutar

```bash
npm install
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm run build     # tsc -b + vite build
npm run lint
npm run preview   # sirve el build de producción
```

Configura `VITE_API_BASE_URL` en `.env` apuntando al backend (por defecto `https://localhost:7222`, ver [backend/README.md](../backend/README.md)).

### Con Docker

```bash
docker build -t motocore-frontend .
# o desde la raíz del repo, junto con backend + postgres:
docker compose up --build
```

Multi-stage: build con `node:20-alpine`, se sirve con `nginx:alpine` (`nginx.conf` incluye fallback de rutas para el SPA).

### Generar tipos desde la API (OpenAPI)

```bash
npm run generate:api-types
```

Requiere el backend corriendo localmente. Ver [src/shared/api/README.md](src/shared/api/README.md) para el detalle.

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
│   ├── auth/           # login, registro, sesión, rutas protegidas por rol
│   ├── clientes/        # CRUD de clientes
│   ├── motocicletas/    # CRUD de motocicletas
│   ├── ordenes/         # órdenes de trabajo (estados, cierre, entrega)
│   ├── inventario/      # repuestos y movimientos de stock
│   ├── talleres/        # datos del taller y administración de equipo
│   ├── historial/       # historial de mantenimiento (se usa embebido en motocicletas)
│   └── dashboard/       # métricas generales
├── router/             # definición de rutas (React Router)
└── shared/
    ├── config/          # API_BASE_URL, navegación
    ├── lib/             # apiRequest (cliente HTTP compartido), utils
    └── ui/              # componentes de UI reutilizables
```

## Convención de módulos

Cada módulo de feature sigue el mismo patrón (ver `clientes/` o `motocicletas/` como referencia):

- `types.ts` — tipos de dominio y payloads.
- `<modulo>-api.ts` — funciones que llaman a la API vía `apiRequest` de `shared/lib/api-client.ts` (maneja el token Bearer y los `ProblemDetails` del backend).
- `pages/` — páginas de React Router.
- `components/` (opcional) — piezas de UI reutilizadas solo dentro del módulo.

Al agregar un módulo nuevo, replica esta estructura en vez de improvisar una distinta.

## Autenticación y roles

`modules/auth` maneja login/registro/sesión (`AuthContext.tsx`, `auth-storage.ts`). Las rutas se protegen con `ProtectedRoute` (requiere sesión) y `RoleRoute` (requiere alguno de los roles `Owner`, `Mechanic`, `Receptionist`) — ver `router/index.tsx`. Dentro de cada página, usa `useAuth().hasAnyRole([...])` para condicionar acciones puntuales (botones de editar/eliminar) cuando toda la ruta no debe restringirse pero sí una acción específica.

## Estado de servidor con React Query

Cada página usa `useQuery`/`useMutation` directamente (no hay una capa de hooks intermedia). Convención de `queryKey`: un array con el nombre del recurso en plural y, si aplica, el id relacionado — por ejemplo `['clients']`, `['motorcycles']`, `['maintenance-history', motorcycleId]`. Tras una mutación exitosa, se invalida la query relacionada con `queryClient.invalidateQueries({ queryKey: [...] })` en vez de actualizar el cache manualmente — más simple de razonar, aunque implica un round-trip extra al backend. El `QueryClient` (en `app/providers/QueryProvider.tsx`) desactiva `refetchOnWindowFocus` y limita reintentos a 1.

## UI compartida (`src/shared/ui`)

Componentes propios sobre Radix + `class-variance-authority` + `tailwind-merge`, estilo shadcn/ui: `Button`, `Card` (+ `CardHeader`/`CardTitle`/`CardContent`/`CardFooter`), `Badge`, `Alert` (+ `AlertTitle`/`AlertDescription`), `Table` (+ subcomponentes), `Input`, `PageHeader`. No hay componente de `Select` propio — los formularios usan `<select>` nativo con clases de Tailwind calcadas del estilo de `Input` (ver `MotocicletasPage` u `OrdenesPage` como referencia).

## Testing

No hay suite de tests en el frontend todavía (ni Vitest ni React Testing Library) — ver [docs/roadmap-competitivo.md](../docs/roadmap-competitivo.md). El backend sí tiene cobertura real; esta es la asimetría más notoria del proyecto hoy.

## Estado real de las features

Todos los módulos listados arriba están conectados a la API real del backend (hoy el .NET; **pendiente** migrar auth a Supabase y apuntar al backend nuevo en `server/`, más el selector de organización — ver [CLAUDE.md](../CLAUDE.md)). Ver [docs/roadmap-competitivo.md](../docs/roadmap-competitivo.md) para el roadmap priorizado.

# MotoCore — Cliente web

SPA en React + TypeScript para la gestión de organizaciones de servicio de motocicletas. Consume la interfaz de programación de [`server/`](../server/README.md), con **Supabase Auth** para la sesión y los **selectores de organización y taller** enviando `X-Org-Id` y `X-Workshop-Id` en cada petición (ADR-005).

> **La especificación gobierna este código**, no al revés ([`docs/`](../docs/README.md)). El texto visible sigue el [Glosario](../docs/ingenieria/01-glosario.md): la unidad de aislamiento es la **organización** y el local físico es el **taller**; «empresa» y «sucursal» están retirados del proyecto. Los identificadores del contrato y del esquema se conservan en inglés y **no** se traducen.
>
> **Alcance construido**: el corte vertical —clientes (nivel organización) e inventario (nivel taller)—, más talleres, equipo y auditoría. Motocicletas, órdenes de trabajo e historial de mantenimiento **no están en el repositorio**: quedan fuera del alcance del proyecto de grado (RF-800).

## Stack

- React 19 + TypeScript + Vite
- TailwindCSS 4
- **TanStack Query** para el estado de servidor (ADR-010)
- React Router 7
- Vitest + React Testing Library para las pruebas de componente (nivel N6)
- UI propia sobre Radix, `class-variance-authority` y `tailwind-merge` en `src/shared/ui`

## Cómo ejecutar

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # nivel N6
npm run lint
npm run build     # tsc -b + vite build
npm run preview   # sirve la compilación de producción (con service worker)
```

Copia `.env.example` a `.env` y completa:

| Variable                        | Para qué                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`             | URL de la interfaz de programación. Por defecto `http://localhost:8787`                                                         |
| `VITE_SUPABASE_URL`             | Proyecto Supabase, para el inicio de sesión                                                                                     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave **publicable** — es pública por diseño: el acceso lo deciden las políticas de la base de datos, no el secreto de la clave |

**Nunca** pongas aquí la clave **secreta**: se empaqueta en el navegador y esa clave salta las políticas de aislamiento (RNF-103).

## El contexto activo

Es la pieza que materializa la jerarquía en la interfaz, y conviene entenderla antes de tocar cualquier módulo.

`shared/lib/active-context.ts` guarda la organización y el taller activos **fuera de React**, para que `apiRequest` pueda adjuntarlos como cabeceras sin recibirlos por parámetro en cada llamada. Se persisten en el almacenamiento local, de modo que recargar la página no pierda el contexto; el valor guardado es solo una preferencia, porque el servidor revalida la membresía en cada petición.

Tres reglas que no deben romperse:

- **Cambiar de organización limpia el taller activo.** El que estaba elegido pertenecía a la organización anterior; conservarlo dejaría al operador trabajando sobre un local ajeno al contexto que cree tener (CP-N401.1).
- **`X-Workshop-Id` se envía solo en los endpoints de nivel taller**, pasando `withWorkshop: true` a `apiRequest`. En clientes no se envía, y esa ausencia es precisamente lo que demuestra RF-502.
- **El contexto activo forma parte de la clave de cada consulta** (ADR-010): `['clients', orgId, …]`, `['parts', orgId, workshopId, …]`. Dos organizaciones producen claves distintas, de modo que ninguna respuesta puede servirse desde la caché de otra. Al cambiar de organización se invalida **todo** el caché; al cambiar de taller, solo `parts` y `movements`.

`ContextSelectors` **deriva** la selección efectiva en cada render en lugar de duplicarla en estado: si la organización o el taller elegidos dejan de ser válidos, cae en el primero disponible sin sincronizar estados entre sí.

## Convención de módulos

Cada módulo sigue el mismo patrón (ver `clientes/` como referencia):

- `types.ts` — tipos de dominio y payloads, en **`snake_case`**, tal como viajan por el contrato (§2.4). No hay capa de traducción que mantener en dos sitios.
- `<modulo>-api.ts` — funciones que llaman a la interfaz vía `apiRequest`, que adjunta credencial y contexto y traduce el Problem Details a `ApiError` conservando el código de negocio.
- `pages/` — páginas de React Router.
- `components/` (opcional) — piezas reutilizadas solo dentro del módulo.

### Rutas: el contexto no va en la URL

El §2.3 del [contrato](../docs/ingenieria/10-contrato-api.md) reserva el identificador de la organización en la ruta **solo para la organización misma**. Los recursos interiores se piden a rutas planas —`/api/workshops`, `/api/members`, `/api/clients`, `/api/inventory/...`— y el contexto viaja por cabecera. Al escribir un `<modulo>-api.ts` nuevo, no anides `/api/organizations/${orgId}/...`: hay una prueba de regresión que lo detecta.

Las bajas lógicas auditadas se invocan con `POST /…/deactivate`, no con `PATCH`. La excepción son los **vínculos** —quitar un miembro o una asignación—, que siguen siendo `DELETE`.

## Autenticación y roles

`modules/auth` maneja el registro, el inicio de sesión y la sesión contra **Supabase Auth**; la interfaz de programación solo verifica la credencial (ADR-004). Las rutas se protegen con `ProtectedRoute` (requiere sesión) y `RoleRoute` (requiere alguno de los roles).

La protección por rol en el cliente es **cosmética**: evita mostrar una pantalla que fallaría al cargar. La restricción real la aplican la interfaz y las políticas de la base de datos. Nunca la trates como control de acceso.

## Instalable como PWA (RNF-403)

- `public/manifest.webmanifest` declara nombre, `start_url`, `display: standalone` e iconos de **192 y 512 px**, más uno _maskable_.
- `public/sw.js` es el _service worker_, registrado desde `main.tsx` **solo en producción** —en desarrollo interceptaría la recarga en caliente de Vite—.
- El worker cachea **únicamente el armazón** de la aplicación. Ninguna respuesta de la interfaz se guarda ahí: la caché de datos de negocio vive en memoria y se vacía al cerrar la sesión (ADR-010). Persistirla dejaría datos de una organización en el equipo del operador.

## Pruebas (nivel N6)

```bash
npm test
npm run test:watch
```

Vitest sobre jsdom con React Testing Library. El entorno se configura en `vite.config.ts` y el setup común en `src/test/setup.ts`, que limpia el DOM y el almacenamiento local entre casos: sin esa limpieza un caso heredaría el contexto que dejó otro.

| Archivo                                             | Qué asegura                                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `shared/lib/active-context.test.ts`                 | Que cambiar de organización **limpia** el taller activo — el fallo más dañino del modelo jerárquico en la interfaz             |
| `shared/lib/api-client.test.ts`                     | Que la credencial y el contexto viajan como fija el §2 del contrato, y que el código de negocio del error sobrevive al cliente |
| `modules/organizaciones/organizaciones-api.test.ts` | Regresión de la regla de rutas (§2.3) y del método de las bajas lógicas (§2.6)                                                 |
| `modules/organizaciones/ContextSelectors.test.tsx`  | HU-05 y HU-07, y la invalidación de la caché al cambiar de contexto (CP-N401.1, CP-N401.2)                                     |
| `modules/auditoria/auditoria-api.test.ts`           | Que las seis acciones de RF-703 tengan etiqueta y no queden identificadores crudos en pantalla                                 |

Este nivel evalúa **el cumplimiento del contrato desde el lado del cliente**, no la interfaz de usuario: un participante puede completar las tareas con éxito mientras el cliente envía una cabecera equivocada. El diseño responsivo, la instalabilidad y la accesibilidad se auditan en N7 (Playwright y axe-core), y la usabilidad del cambio de contexto, con operadores reales (N5).

## Tipos de la interfaz

Se declaran **a mano** en cada módulo (`<modulo>-api.ts` y `types.ts`), siguiendo el [contrato](../docs/ingenieria/10-contrato-api.md), que es la fuente de verdad. Cuando el servidor publique su descripción OpenAPI (§7 del contrato), podrán derivarse de ahí.

## Diagramas de arquitectura (`/arquitectura`)

Ruta pública, fuera de `AppShell` y de `ProtectedRoute`, pensada para proyectar el proyecto en una presentación: tres diagramas HTML autocontenidos en `public/diagramas/` —arquitectura en ejecución, aislamiento entre organizaciones y condiciones de validación C0–C3—. No es una funcionalidad del producto y no consume la interfaz de programación.

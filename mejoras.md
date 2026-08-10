# Recomendaciones de Mejora

Análisis del estado del repositorio al 2026-07-30. El MVP ya está funcional end-to-end (backend con 8 módulos + tests + CI + Docker, frontend con 8 módulos conectados a la API real — ver [CLAUDE.md](CLAUDE.md) para el detalle técnico y el historial de qué se hizo). Este documento mira hacia adelante: qué falta para pasar de "MVP verificado" a "listo para producción real con datos de talleres".

## Prioridad alta

### 1. Vulnerabilidades conocidas en paquetes NuGet del backend
Durante el build con Docker aparecieron advertencias `NU1903` de severidad alta:
- `Microsoft.OpenApi` 2.4.1 (usado en `MotoCore.Api`) — [GHSA-v5pm-xwqc-g5wc](https://github.com/advisories/GHSA-v5pm-xwqc-g5wc).
- `System.Security.Cryptography.Xml` 9.0.0 (dependencia transitiva de `MotoCore.Infrastructure`) — múltiples advisories.

No son explotables directamente desde el uso actual del código (no se procesa XML ni OpenAPI de fuentes no confiables), pero son fáciles de resolver: actualizar a la versión parchada más reciente compatible con .NET 10 y volver a correr `dotnet test` + el build de Docker para confirmar que nada se rompe.

### 2. Cobertura de tests incompleta en servicios de negocio
Hoy solo `AuthService`, `WorkOrderService`, `InventoryService` y `AuditLogService` tienen tests dedicados (más el aislamiento multi-tenant). **`ClientService`, `MotorcycleService`, `UserService`, `WorkshopService` y `MaintenanceHistoryService` no tienen ningún test propio** — se ejercitan indirectamente desde `MultiTenantIsolationTests`, pero sus reglas de negocio específicas (por ejemplo, `WorkshopService.InviteUserToWorkshopAsync` rechazando roles inválidos, o `UserService.UpdateUserRoleAsync` con las reglas de "no puedes cambiar tu propio rol") no están cubiertas.

Además, toda la suite actual prueba la capa de **servicios** directamente — no hay ni un test de integración HTTP (`WebApplicationFactory<Program>`) que ejercite el ruteo real, las políticas de autorización por rol declaradas en los controllers, ni los filtros de validación (`WithValidation<T>`). Es la única forma de detectar, por ejemplo, que un endpoint quedó sin `RequireRateLimiting` o con el rol equivocado en `RequireAuthorization`.

### 3. Gestión de secretos antes de cualquier despliegue real
`docker-compose.yml` y `appsettings.json` usan un `Jwt:SigningKey` y una contraseña de Postgres con valores de ejemplo hardcodeados (`MotoCore-Development-Signing-Key-Replace-In-Production-12345`, `postgres`/`postgres`). Están bien para desarrollo local, pero hoy no hay ningún mecanismo que impida desplegar así a producción por accidente. Antes de cualquier ambiente real: mover estos valores a variables de entorno gestionadas por el proveedor de hosting (o un vault), y considerar una validación de arranque que falle si `Jwt:SigningKey` sigue siendo el valor de ejemplo en `ASPNETCORE_ENVIRONMENT=Production`.

## Prioridad media

### 4. El frontend no tiene ningún test
El backend tiene una suite real (xUnit, 25 tests). El frontend no tiene ni un solo test — ni unitario ni de componente. Con 8 módulos ya conectados a la API real y lógica no trivial en varios (`OrdenesPage` con transiciones de estado, `InventarioPage` con cálculo de stock bajo, `MaintenanceHistoryPanel`), agregar Vitest + React Testing Library y cubrir al menos los flujos críticos (login, crear orden, cambiar estado) evitaría regresiones silenciosas en la UI.

### 5. Ampliar el audit trail más allá de Workshops
Hoy `AuditLogService` solo se invoca desde `WorkshopService` (eliminar taller, remover miembro, cambiar rol de miembro). Quedan sin auditar: cambios de rol de usuario vía `UserService.UpdateUserRoleAsync`, y eliminaciones en `ClientService`, `MotorcycleService` e `InventoryService.DeletePartAsync` — todas acciones "destructivas" que un dueño de taller podría querer poder rastrear después. El patrón ya existe (`auditLogService.LogAsync(...)`); es cuestión de inyectar `IAuditLogService` en esos 4 servicios y llamar el mismo método en los puntos de eliminación/cambio de rol.

### 6. Adoptar el cliente API generado desde OpenAPI
El tooling ya está listo (`npm run generate:api-types`, ver `frontend/src/shared/api/README.md`) pero nunca se generó el archivo ni se migró ningún `types.ts`. Con el backend corriendo localmente, correr el script y migrar el módulo más simple (`clientes`) primero serviría como prueba de concepto antes de migrar el resto.

### 7. Implementar paginación en los endpoints de listado
Diseño recomendado (para no romper compatibilidad con el frontend actual):
- Query params opcionales `page` y `pageSize` en `GET /api/clients`, `/api/motorcycles`, `/api/work-orders`, `/api/inventory/parts`, `/api/inventory/movements` — sin parámetros, comportamiento actual sin cambios (devuelve todo).
- Cuando se piden, mantener la respuesta como un array plano (no envolver en un objeto) y exponer la metadata vía headers (`X-Total-Count`, `X-Page`, `X-Page-Size`), siguiendo la convención de la API de GitHub — así ningún consumidor existente se rompe.
- Backend: agregar `GetByWorkshopIdPagedAsync(...)` a cada repositorio (método nuevo, no reemplazar el existente) con `.Skip().Take()` + `CountAsync()`.
- Recién ahí vale la pena agregar controles de paginación en las tablas del frontend.

No es urgente hoy (el volumen de datos por taller es bajo), pero conviene tenerlo diseñado antes de que sea un problema real.

### 8. Docker: health checks propios y mejor manejo de dependencias entre contenedores
Solo el contenedor de Postgres tiene `healthcheck` en `docker-compose.yml`; el `frontend` depende del `backend` con `condition: service_started` (no `service_healthy`) porque el backend no expone un `HEALTHCHECK` en su `Dockerfile`. Agregar uno (`curl -f http://localhost:8080/health || exit 1`, con `curl` instalado en la imagen runtime o usando el propio `dotnet` para un chequeo mínimo) permitiría que `depends_on` espere a que el backend esté realmente listo antes de arrancar el frontend.

## Prioridad baja

### 9. Service worker para PWA offline real
El manifest (`public/manifest.webmanifest`) ya hace la app instalable, pero sin service worker no funciona offline ni cachea assets. `vite-plugin-pwa` es la ruta más directa si se decide invertir en esto.

### 10. Capacitor y Electron: pasar de placeholder a funcional
`capacitor.config.ts` y `electron/main.js` documentan los siguientes pasos pero no tienen las dependencias instaladas. Solo vale la pena avanzar si hay una necesidad real de apps nativas/de escritorio — instalar los paquetes y generar los proyectos nativos es un compromiso de mantenimiento continuo (actualizaciones de plataforma, firma de código, distribución en stores).

### 11. Autenticación: 2FA y OAuth real
`docs/seguridad.md` y `backend/README.md` ya listan esto como pendiente. El catálogo de proveedores externos (`ExternalAuthProviderCatalog`) existe pero ambos proveedores (`google`, `facebook`) están `Enabled: false` — falta la implementación real del flujo OAuth, no solo el listado.

### 12. Tests end-to-end (Playwright o Cypress)
Ni backend ni frontend tienen pruebas que crucen la pila completa (UI real API real base de datos real). Dado que ya existe un `docker-compose.yml` que levanta todo el stack, sería la base natural para correr E2E en CI antes de un despliegue.

### 13. Reducir vulnerabilidades en devDependencies del frontend
Instalar `openapi-typescript` trajo consigo vulnerabilidades conocidas en su cadena de dependencias (`@redocly/openapi-core` `minimatch`/`brace-expansion`, `picomatch`). Son herramientas de build, no se incluyen en el bundle de producción, pero conviene correr `npm audit fix` periódicamente y revisar si versiones más nuevas del paquete las resuelven.

### 14. Observabilidad avanzada
El logging estructurado (JSON console) y los health checks básicos cubren lo esencial para depurar localmente. Para un ambiente real con múltiples instancias, lo siguiente sería: agregación centralizada de logs (no solo stdout), tracing distribuido (OpenTelemetry), y métricas de negocio (órdenes creadas por hora, tiempo de respuesta por endpoint) más allá de lo que un health check binario puede mostrar.

---

**Cómo priorizar**: si el objetivo inmediato es una demo o piloto con un taller real, los puntos 1 y 3 (parchear vulnerabilidades, sacar secretos de los defaults) son los de menor esfuerzo y mayor impacto antes de exponer el sistema fuera de tu máquina. Si el objetivo es escalar el equipo que mantiene el proyecto, el punto 2 (cerrar los huecos de test) y el 4 (agregar tests al frontend) son los que más protegen contra regresiones a medida que más gente toca el código.

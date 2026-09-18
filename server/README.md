# MotoCore — Interfaz de programación (Node/TypeScript + Supabase)

Monolito modular en **Hono** desplegado como funciones serverless en **Vercel**, sobre **Supabase** (PostgreSQL + Auth + RLS), con multi-tenancy **jerárquica**: una cuenta administra varias **organizaciones** y cada organización opera varios **talleres** (ADR-006, ADR-009).

> **La especificación gobierna este código**, no al revés ([`docs/`](../docs/README.md)): terminología en el [Glosario](../docs/ingenieria/01-glosario.md), reglas en [Requisitos](../docs/ingenieria/02-requisitos.md), esquema en [Modelo de datos](../docs/ingenieria/05-modelo-datos.md) y, sobre todo, la interfaz en el [Contrato](../docs/ingenieria/10-contrato-api.md). Cuando el código difiera de lo especificado, **se corrige el código**.
>
> **Alcance construido**: identidad, organizaciones, talleres, miembros y el corte vertical de negocio —**clientes** (nivel organización) e **inventario** (nivel taller)— más el registro de auditoría. Motocicletas, órdenes de trabajo, historial y panel de métricas están fuera del alcance del proyecto de grado (RF-800).

## Stack

- **Hono** — interfaz HTTP en TypeScript, nativa de entornos serverless (ADR-003).
- **Supabase** — PostgreSQL, Auth (registro, sesión y renovación) y RLS para el aislamiento (ADR-004).
- **Zod** — validación de entrada; los esquemas son los DTO y de ellos se derivan los tipos.
- **Vitest** — pruebas de los niveles N1, N2, N3 y N4.

## Estructura: controlador, servicio y repositorio

Cada módulo de dominio tiene las mismas tres capas (Arquitectura, secciones 4 y 5). El orden de las dependencias es siempre el mismo, y es lo que mantiene las reglas de negocio independientes del marco y del proveedor de datos:

| Archivo                  | Responsabilidad                                                           | De qué depende                     |
| ------------------------ | ------------------------------------------------------------------------- | ---------------------------------- |
| `<modulo>.routes.ts`     | Traduce HTTP: lee cabeceras, cuerpo y parámetros, y devuelve la respuesta | Del servicio                       |
| `<modulo>.service.ts`    | Reglas de negocio y de rol; valida la entrada con su esquema              | De la **interfaz** del repositorio |
| `<modulo>.repository.ts` | Acceso a datos y traducción de los errores del motor                      | Del cliente de datos               |
| `<modulo>.schemas.ts`    | Esquemas Zod de entrada (los DTO)                                         | De nada                            |

```
src/
├── app.ts              Monta los módulos y el manejador de errores
├── platform.ts         Raíz de composición: acceso, cuentas, organizaciones y auditoría
├── lib/                Transversal: credencial, contexto activo, errores, clientes de datos
└── modules/            identity · organizations · workshops · members · clients · inventory · audit
```

**Un módulo no invoca el repositorio de otro.** Lo que se comparte —la creación atómica de una organización, la escritura de auditoría, la verificación de membresía— viaja por `platform.ts`, que es también el punto donde el banco de pruebas sustituye una pieza sin que exista ningún interruptor en producción.

## Los dos clientes de datos, y por qué importa cuál se usa

Es la decisión más fácil de romper sin darse cuenta al añadir un endpoint (ADR-008).

| Cliente                                              | Respeta RLS      | Cuándo                                                                            |
| ---------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| `c.get('db')` — atado a la credencial de la petición | **Sí**           | Toda lectura y escritura de datos de negocio                                      |
| `serviceClient(uso)` — clave secreta                 | **No, la salta** | Siete excepciones, enumeradas en el tipo `PrivilegedUse` de `src/lib/supabase.ts` |

Si un handler consulta con la clave secreta, las políticas **no intervienen** y el aislamiento pasa a depender solo del control de la aplicación. Por eso cada llamada declara **cuál** de las siete excepciones la justifica: `membership-verification`, `registration`, `organization-creation`, `member-profiles`, `account-lookup`, `inventory-atomic` y `audit-write`.

La de más peso es la primera: **la propia verificación de membresía consulta con clave secreta**. Es deliberado — si dependiera de RLS para funcionar, las dos capas dejarían de ser independientes, que es justo lo que RNF-102 exige demostrar. Esa independencia se verifica en `test/defense-in-depth.test.ts` (CP-N102).

## Contexto activo: la regla de rutas

El §2.3 del contrato fija una regla que atraviesa toda la interfaz: **el identificador de la organización aparece en la ruta solo cuando el recurso es la organización misma**. Todo lo interior a ella se dirige a una ruta plana y el contexto viaja por cabecera:

| Cabecera                      | Contenido                   | Cuándo                                                     |
| ----------------------------- | --------------------------- | ---------------------------------------------------------- |
| `Authorization: Bearer <jwt>` | Credencial de Supabase Auth | Siempre, salvo el registro y `/health`                     |
| `X-Org-Id`                    | Organización activa         | Toda operación sobre datos internos de una organización    |
| `X-Workshop-Id`               | Taller activo               | Operaciones de nivel taller (inventario y sus movimientos) |

El servidor **nunca asume un contexto por defecto**: si falta la cabecera exigida, rechaza la petición (ADR-005).

## Endpoints

Los cuerpos de petición y de respuesta usan la misma grafía que el esquema (`snake_case`); los parámetros de consulta, `camelCase` (§2.4 del contrato). Las colecciones se devuelven bajo una clave en plural (`clients`, `workshops`, `parts`, `members`, `entries`).

### Identidad y organizaciones

| Método      | Ruta                                | Acceso          | Descripción                                                                  |
| ----------- | ----------------------------------- | --------------- | ---------------------------------------------------------------------------- |
| GET         | `/health`                           | —               | Comprobación de disponibilidad                                               |
| POST        | `/api/auth/register`                | —               | Cuenta + 1.ª organización + 1.er taller + membresía `owner`, en un solo acto |
| GET         | `/api/auth/me`                      | Credencial      | Perfil y organizaciones con su rol                                           |
| GET / POST  | `/api/organizations`                | Credencial      | Listar por membresía · crear (el solicitante queda `owner`)                  |
| GET / PATCH | `/api/organizations/{orgId}`        | Miembro / Owner | Detalle · editar. **Acción auditada**                                        |
| POST        | `/api/organizations/{orgId}/switch` | Miembro         | Valida el contexto y devuelve el rol                                         |

### Talleres, miembros y clientes — requieren `X-Org-Id`

| Método      | Ruta                                               | Rol                           | Descripción                                                          |
| ----------- | -------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| GET / POST  | `/api/workshops`                                   | Miembro / Owner               | Listar (`includeInactive`) · crear                                   |
| GET / PATCH | `/api/workshops/{workshopId}`                      | Miembro / Owner               | Detalle · editar                                                     |
| POST        | `/api/workshops/{workshopId}/deactivate`           | Owner                         | Baja lógica. **Auditada**                                            |
| GET / POST  | `/api/workshops/{workshopId}/assignments`          | Miembro / Owner               | Asignados · asignar (idempotente: `201` si crea, `200` si ya estaba) |
| DELETE      | `/api/workshops/{workshopId}/assignments/{userId}` | Owner                         | Retirar la asignación                                                |
| GET         | `/api/members`                                     | Miembro                       | Listar con rol y estado (`includeInactive`)                          |
| POST        | `/api/members/invite`                              | Owner                         | Incorporar una cuenta existente. **Auditada**                        |
| PATCH       | `/api/members/{userId}/role`                       | Owner                         | Cambiar el rol. **Auditada**                                         |
| DELETE      | `/api/members/{userId}`                            | Owner                         | Revocar la membresía. **Auditada**                                   |
| GET / POST  | `/api/clients`                                     | Miembro / Owner, Receptionist | Listar (`search`, `includeInactive`) · crear                         |
| GET / PATCH | `/api/clients/{clientId}`                          | Miembro / Owner, Receptionist | Detalle · editar                                                     |
| POST        | `/api/clients/{clientId}/deactivate`               | Owner, Receptionist           | Baja lógica. **Auditada**                                            |

Que las rutas de clientes **no** exijan `X-Workshop-Id` es deliberado: su ausencia es la evidencia de RF-502 — el cliente pertenece a la organización, no al local.

### Inventario — nivel taller, requiere `X-Org-Id` **y** `X-Workshop-Id`

| Método      | Ruta                                      | Rol                           | Descripción                                              |
| ----------- | ----------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| GET / POST  | `/api/inventory/parts`                    | Miembro / Owner, Receptionist | Listar (`search`, `lowStock`, `includeInactive`) · crear |
| GET / PATCH | `/api/inventory/parts/{partId}`           | Miembro / Owner, Receptionist | Detalle · editar el catálogo, **nunca la existencia**    |
| GET / POST  | `/api/inventory/parts/{partId}/movements` | Miembro                       | Historial · registrar movimiento                         |
| POST        | `/api/inventory/parts/{partId}/transfer`  | **Owner**                     | Transferir a otro taller de la organización              |

Tipos de movimiento registrables directamente: `compra`, `venta`, `ajuste`, `devolucion` y `merma`. **`transferencia` no se acepta** ahí: la generan las transferencias, como par de movimientos vinculados por `transfer_id` (RF-604, RF-608). El destino de una transferencia es el repuesto con el **mismo número de parte** en el taller receptor.

### Auditoría — nivel organización, requiere `X-Org-Id`, **solo Owner**

| Método | Ruta         | Descripción                                                                           |
| ------ | ------------ | ------------------------------------------------------------------------------------- |
| GET    | `/api/audit` | Acciones críticas de la organización activa. Filtros: `action`, `workshopId`, `limit` |

Es la única lectura reservada a un rol, y la restricción se aplica **también en la base de datos** (RF-704). No se expone ninguna escritura: el registro lo escribe solo el servidor y es de solo inserción. Las seis acciones que registra (RF-703) son `member.invited`, `member.role_changed`, `member.removed`, `organization.updated`, `workshop.deactivated` y `client.deactivated`.

## Errores

Toda respuesta de error sigue **Problem Details** (RFC 9457) con el código estable `modulo.razon` en `title`. El catálogo completo es el del [§4 del contrato](../docs/ingenieria/10-contrato-api.md) y **la interfaz no emite ningún código fuera de él**: un fallo inesperado del motor se propaga como `server.error` (500) en lugar de inventar un código.

Tres reglas que conviene tener presentes al tocar este código:

- **No divulgación (RNF-105).** Un recurso de otra organización responde `404` del módulo, indistinguible de uno inexistente; también un identificador mal formado. El `403 organization.access_denied` se reserva para cuando el solicitante _declara_ operar sobre una organización ajena: ahí no revela nada que él no haya afirmado.
- **Orden de las comprobaciones (§2.2).** Cabeceras presentes → membresía → taller → rol → validación del cuerpo. Un rol insuficiente recibe `403` aunque el cuerpo sea inválido.
- **Transiciones de estado (§2.6).** Una baja lógica auditada se expone como `POST /…/deactivate`, no como `PATCH`. La excepción son los **vínculos** —membresía y asignación a taller—, que se revocan con `DELETE`.

El **inicio de sesión** se hace desde el cliente con Supabase Auth, no contra esta interfaz (ADR-004): aquí solo se **verifica** la credencial recibida.

## Puesta en marcha

1. **Crear un proyecto Supabase dedicado**: el esquema instala un disparador sobre `auth.users`, común a toda aplicación que comparta el proyecto.
2. **Aplicar las migraciones en orden**, con `npm run db:migrate` (usa `DATABASE_URL`) o pegándolas en el SQL Editor:

   ```
   supabase/migrations/0001_identidad_y_jerarquia.sql   Cuentas, organizaciones, talleres, membresías, funciones y políticas
   supabase/migrations/0002_negocio.sql                 Clientes (organización) e inventario (taller) con sus funciones atómicas
   supabase/migrations/0003_auditoria.sql               Registro de acciones críticas, lectura reservada al Owner
   supabase/migrations/0004_permisos.sql                Permisos de esquema, de tabla y de columna
   ```

   Son **cuatro**, agrupadas por tema y no por orden histórico; el orden lo dan las dependencias, y la `0004` va la última porque concede sobre todo lo anterior. Ninguna es opcional: sin la `0003` la auditoría no queda reservada al Owner y CP-704.2 no puede pasar; sin la `0004` el esquema hereda los privilegios por defecto del proyecto, que conceden de más.

   Después, `npm run db:verify` —solo lectura— comprueba en **15 filas** que las nueve tablas, las 21 políticas, los permisos y las restricciones quedaron en su sitio. Las últimas comprueban lo que el esquema **niega**: que `anon` no tenga privilegios, que el historial inmutable no se pueda escribir desde el cliente y que `current_stock` no se pueda modificar sin un movimiento.

   > **Partir de cero sobre un proyecto ya usado**: `supabase/reset.sql` retira solo los objetos `mt_` y las cuentas que tenían perfil en MotoCore. Es **destructivo e irreversible**, y vive fuera de `migrations/` para que nunca se aplique en un despliegue.

3. **Configurar el entorno**: copiar `.env.example` a `.env` y completar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `AUTH_AUTO_CONFIRM_EMAIL` y `CORS_ALLOWED_ORIGINS`. Toda diferencia entre entornos vive en variables, ninguna en el código (RNF-303).
4. **Instalar y ejecutar**:

   ```bash
   npm install
   npm run dev          # http://localhost:8787
   npm run typecheck
   npm test
   npm run test:unit    # solo N1 y N2, sin base de datos
   npm run test:coverage
   ```

## Pruebas

Los niveles siguen el [plan de pruebas](../docs/ingenieria/11-plan-pruebas.md). Cada caso lleva su identificador `CP-nnn` en el nombre, para leer la evidencia contra la matriz de trazabilidad sin traducción intermedia.

**Sin Supabase** — corren en cada integración:

| Archivo                       | Nivel | Qué cubre                                                                                                                                                   |
| ----------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/unit/*.service.test.ts` | N1    | Las reglas de negocio y de rol de cada servicio, con repositorios en memoria. Es lo que mide la cobertura de RNF-207                                        |
| `test/contract/api.test.ts`   | N2    | La interfaz completa con la plataforma sustituida: credencial, contexto obligatorio, rol, forma del error, validación, regla de rutas y orígenes permitidos |

**Solo con credenciales** — se omiten si faltan, y **un caso omitido no cubre su requisito** (§7.2 del plan):

| Archivo                         | Nivel        | Qué cubre                                                                                                             |
| ------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `test/integration.test.ts`      | N3 y N4 (C1) | Flujo completo y reglas de negocio contra Supabase real; vía 1 del aislamiento                                        |
| `test/rls.test.ts`              | N4 (C3)      | **Aislamiento por acceso directo al motor**, sin pasar por la interfaz: CP-702, CP-N101, CP-402.2, CP-N106 y CP-704.2 |
| `test/defense-in-depth.test.ts` | N4 (C2)      | **CP-N102**: con la capa de aplicación anulada, las políticas siguen filtrando                                        |

Los dos últimos sostienen la premisa central del proyecto: uno demuestra que el aislamiento se mantiene cuando se prescinde de la interfaz, y el otro que se mantiene **dentro** de la interfaz aunque su control de membresía falle. En ninguno se usa la clave secreta: saltaría las políticas y la prueba pasaría siempre.

Los archivos se ejecutan **uno a uno** (`fileParallelism: false`): N3 y N4 registran cuentas contra el proveedor de identidad, que limita la tasa de altas, y en paralelo fallaban por una causa ajena a lo verificado.

## Despliegue en Vercel

- Este directorio es un proyecto Vercel independiente. `vercel.json` reescribe todas las rutas a `api/index.ts`, que ejecuta la aplicación Hono completa.
- Configurar en Vercel las mismas variables del `.env`, con `CORS_ALLOWED_ORIGINS` apuntando al dominio del cliente web de ese entorno. **Nunca** commitear la clave secreta (RNF-103).

## Trabajo posterior

- Publicar la **descripción OpenAPI 3.1** que el contrato exige en su §7 (entregable del objetivo 3).
- Construir los módulos de RF-800 —motocicletas, órdenes de trabajo, historial y panel— con sus tablas `mt_`, su `organization_id` y su `grant` explícito en la `0004`.

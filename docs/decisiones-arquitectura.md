# Decisiones de arquitectura (ADR)

Registro de las decisiones técnicas relevantes del proyecto, con las alternativas que se consideraron y las consecuencias asumidas. Formato ADR (*Architecture Decision Record*): sirve para que nadie —incluido el autor dentro de seis meses— tenga que adivinar por qué algo está hecho así.

> Terminología: [glosario.md](glosario.md). Arquitectura resultante: [arquitectura.md](arquitectura.md).

---

## ADR-001 — Migrar el backend de .NET a Node/TypeScript

**Estado**: aceptada e implementada (base multitenant).

**Contexto.** El objetivo de despliegue es Vercel, que ejecuta funciones serverless en Node.js, Python, Go y Ruby — **no** tiene runtime de .NET. El backend existente era ASP.NET Core.

**Alternativas consideradas**
1. Mantener .NET y desplegar el backend en otra plataforma (Railway, Render, Fly.io, Azure), dejando solo el frontend en Vercel.
2. Reescribir el backend en Node/TypeScript para Vercel.
3. Reescribir en Python.

**Decisión**: opción 2.

**Justificación.** Unifica el lenguaje con el frontend (ya en TypeScript) y es el runtime con mejor soporte nativo en Vercel.

**Consecuencias.** Se descarta la base de código .NET como línea activa (se preserva en la rama `feat/backend-net-hardening` como referencia de la lógica de negocio). Toda la lógica debe reimplementarse y volver a probarse, módulo por módulo.

---

## ADR-002 — Aislamiento multi-tenant con RLS *y* verificación en la API

**Estado**: aceptada e implementada.

**Contexto.** El backend .NET aislaba tenants únicamente en código de aplicación (una verificación de membresía al inicio de cada método de servicio), sin respaldo en la base de datos: si un método olvidaba el filtro, no había red de seguridad.

**Alternativas consideradas**
1. Aislamiento solo en la capa de aplicación (como el backend .NET).
2. Row-Level Security como único mecanismo.
3. Ambos: RLS + verificación explícita en la API (defensa en profundidad).

**Decisión**: opción 3.

**Justificación.** RLS protege aunque el código tenga un error; la verificación en la API permite devolver errores de negocio específicos (`organization.access_denied`, `organization.insufficient_permissions`) en lugar de un resultado vacío ambiguo, y no deja el sistema dependiendo de una única configuración.

**Consecuencias.** La regla de aislamiento se mantiene en dos lugares (políticas SQL y código TypeScript), con el costo de mantenimiento que eso implica. Se compensa con pruebas automatizadas que cubren ambas capas.

**Pendiente asociado.** Falta una comparación explícita y documentada frente a las alternativas de aislamiento *database-per-tenant* y *schema-per-tenant* — ver [tesis/01-definicion-y-alcance.md](tesis/01-definicion-y-alcance.md) §1.10.3.

---

## ADR-003 — Hono como framework de API

**Estado**: aceptada e implementada.

**Contexto.** Se necesita un framework de API en TypeScript, desplegable como funciones serverless en Vercel, sin obligar a migrar el frontend existente (React + Vite).

**Alternativas consideradas**
1. **Next.js** (API routes): unifica frontend y backend, pero exige migrar el frontend de Vite a Next.
2. **Express**: muy conocido, pero con peor soporte de tipos y de entornos serverless/edge.
3. **Hono**: TypeScript-first, soporte de primera para Vercel Functions, permite dejar el frontend intacto.

**Decisión**: opción 3.

**Justificación.** Minimiza el alcance del cambio (no arrastra una reescritura del frontend) y da tipado de extremo a extremo en el backend.

**Consecuencias.** Framework menos difundido que Express o Next.js: mayor curva de aprendizaje para quien retome el proyecto, y menos material de referencia disponible.

---

## ADR-004 — Supabase Auth en lugar de un esquema JWT propio

**Estado**: aceptada e implementada.

**Contexto.** El backend .NET implementaba JWT y refresh tokens propios. La confirmación de email y el reset de contraseña estaban implementados a medias: el envío de correo era un *stub* que solo escribía en logs, así que ningún usuario recibía nada.

**Alternativas consideradas**
1. Reimplementar el esquema JWT propio en el nuevo backend.
2. Delegar en Supabase Auth (registro, login, refresh, confirmación de email, OAuth).

**Decisión**: opción 2.

**Justificación.** Resuelve de fábrica funcionalidad que estaba incompleta, y se integra directamente con las políticas RLS mediante `auth.uid()`.

**Consecuencias.** Acoplamiento a Supabase como proveedor de identidad. Migrar usuarios a otro proveedor implicaría migrar credenciales, no solo datos. Se acepta porque no hay usuarios productivos todavía.

---

## ADR-005 — Organización activa por header `X-Org-Id`

**Estado**: aceptada e implementada (middleware disponible para los módulos de negocio).

**Contexto.** En el modelo multiempresa, cada request debe saber sobre qué organización opera. El backend .NET resolvía el tenant tomando *el primer taller* del token, sin selección explícita — lo que hacía imposible el cambio de organización.

**Alternativas consideradas**
1. Incluir la organización activa como *claim* dentro del token (obliga a reemitir el token en cada cambio de organización).
2. Rutas anidadas por organización (`/api/orgs/{orgId}/clients`).
3. Header `X-Org-Id` por request, validado contra la membresía.

**Decisión**: opción 3.

**Justificación.** Permite cambiar de organización sin reemitir tokens, mantiene las rutas estables y deja la validación en un único middleware reutilizable.

**Consecuencias.** El cliente debe recordar y enviar la organización activa en cada llamada de negocio. El servidor nunca asume una organización por defecto: si falta el header, la petición se rechaza explícitamente.

---

## ADR-006 — Multi-tenancy jerárquica: una organización con varios talleres

**Estado**: aceptada — **pendiente de implementación** (requiere migración de esquema; el código actual asume 1 organización = 1 taller).

**Contexto.** El modelo inicial asumía que una organización representaba un único taller: la tabla `organizations` tiene una sola dirección, teléfono y email. Sin embargo, el operador objetivo puede administrar varias empresas y **cada empresa puede tener varias sucursales** (locales físicos donde se presta el servicio). Sin modelar la sucursal, dos locales de la misma empresa tendrían que registrarse como organizaciones separadas, perdiendo la visión consolidada de clientes e historial — que es justamente el beneficio de centralizar.

**Alternativas consideradas**
1. **Mantener 1 organización = 1 taller.** Cada sucursal es una organización independiente. Simple, pero fragmenta clientes e historial entre sucursales de la misma empresa y obliga al usuario a cambiar de organización para ver a un mismo cliente.
2. **Taller como segunda unidad de aislamiento** (tenant anidado): las políticas RLS filtrarían por taller. Máxima separación, pero impide compartir clientes entre sucursales y duplica la complejidad de las políticas.
3. **Jerarquía organización → talleres, con el aislamiento solo a nivel de organización.** El taller es una subdivisión operativa: determina *dónde* ocurre una operación, no *quién* puede verla.

**Decisión**: opción 3.

**Justificación.** Conserva un único límite de seguridad (la organización), lo que mantiene las políticas RLS simples y auditables, y a la vez habilita la operación multi-sucursal. Los datos que deben viajar con el cliente (clientes, motocicletas, historial) quedan a nivel de organización; los que son físicos de un local (órdenes de trabajo, inventario) quedan a nivel de taller.

**Alcance de los datos** — ver la tabla completa en [glosario.md](glosario.md):

| Nivel organización | Nivel taller |
|---|---|
| Clientes, motocicletas, historial de mantenimiento, miembros y roles, auditoría | Órdenes de trabajo, inventario y movimientos de stock |

**Consecuencias**
- Se añade la tabla `workshops` (`organization_id`, nombre, dirección, teléfono, activo) y una tabla de asignación de miembros a talleres.
- Las tablas de nivel taller llevan `workshop_id` **además** de `organization_id`; se mantiene `organization_id` en todas para que las políticas RLS sigan evaluándose sobre un solo criterio.
- Se requiere un **taller activo** por request (header `X-Workshop-Id`) para las operaciones de nivel taller, validado como perteneciente a la organización activa.
- La numeración de órdenes de trabajo pasa a ser correlativa **por taller** (y año), no por organización.
- Las unicidades cambian de nivel: número de parte de inventario es único por taller; email de cliente y placa de motocicleta son únicos por organización.
- **La implementación actual no contempla esto todavía** — el esquema y los módulos ya construidos asumen el modelo plano. Es la primera tarea técnica de la siguiente iteración.

**Impacto académico.** Convierte el proyecto de una multi-tenancy plana a una **jerárquica**, lo que enriquece el aporte: el reto pasa a ser mantener un aislamiento verificable entre tenants mientras se soporta una subdivisión interna con reglas de alcance distintas por tipo de dato. Ver [tesis/01-definicion-y-alcance.md](tesis/01-definicion-y-alcance.md).

---

## Decisiones pendientes

| Tema | Estado |
|---|---|
| Proveedor de WhatsApp Business API (Twilio / Meta directo / 360dialog) | Pendiente — ver [roadmap-competitivo.md](roadmap-competitivo.md) |
| Enfoque de integración con facturación electrónica del SIN (proveedor autorizado vs. implementación propia de firma digital y XML) | Pendiente — requiere validar la RND vigente |
| ¿La asignación de un miembro a talleres debe restringir lo que ve, o solo ser informativa? | Pendiente — hoy se define como operativa, sin efecto en permisos (ADR-006) |

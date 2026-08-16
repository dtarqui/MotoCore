# Glosario

Terminología unificada del proyecto. **Fuente de verdad de los términos**: si otro documento usa una palabra distinta para lo mismo, se corrige ese documento, no este.

> **Alcance de este documento**: fija el **lenguaje del dominio** y su uso interno. Las definiciones formales de las tecnologías, con su fuente académica o normativa citable, están en el [Marco conceptual](../anteproyecto/03-marco-teorico-y-conceptual.md) §3.1 — aquí no se duplican.

## Términos del modelo multiempresa

| Término | Definición | Notas |
|---|---|---|
| **Cuenta** | La identidad de una persona en la plataforma (email + contraseña). Vive en `auth.users` de Supabase, con datos de perfil en `profiles`. | Una persona = una cuenta, sin importar en cuántas organizaciones participe. |
| **Organización** | La **empresa** que opera el negocio. Es la **unidad de aislamiento de datos** (el *tenant*). Tabla `organizations`. | **Una cuenta puede crear y pertenecer a varias organizaciones** — este es el cambio central del modelo ERP. |
| **Taller** | Una **sucursal o local físico** donde se presta el servicio. Pertenece a una organización. Tabla `workshops`. | **Una organización puede tener varios talleres** (relación 1:N). El taller **no** es una unidad de aislamiento: es una subdivisión operativa dentro de la organización. |
| **Membresía** | La relación entre una cuenta y una organización, con un rol. Tabla `memberships`, única por `(organization_id, user_id)`. | Es lo que autoriza el acceso. Sin membresía activa no hay acceso a los datos de esa organización. El rol es **de organización**, no de taller. |
| **Asignación a taller** | Vínculo operativo entre un miembro y uno o varios talleres de su organización (p. ej. en qué sucursal trabaja un mecánico). | No otorga ni restringe permisos por sí sola: los permisos vienen del rol de la membresía. Sirve para operación y reportes. |
| **Organización activa** | La organización sobre la que opera el usuario en un momento dado. Se envía por request en el header `X-Org-Id` y se valida contra la membresía. | Permite cambiar de empresa sin cerrar sesión (RNF-401). El servidor nunca la asume por defecto. |
| **Taller activo** | La sucursal sobre la que se está operando dentro de la organización activa. Se indica por request (header `X-Workshop-Id`) y debe pertenecer a la organización activa. | Necesario para las operaciones que ocurren en un local concreto (órdenes, inventario). |
| **Tenant** | Sinónimo técnico de *organización*. Se usa al hablar de arquitectura (multi-tenant, aislamiento entre tenants). | Preferir "organización" en documentación de producto; "tenant" en documentación técnica. |

## Jerarquía y alcance de los datos

```
Cuenta (auth.users)
   └── membresía (rol) ──> Organización  ← unidad de aislamiento (tenant)
                              └── Taller (sucursal)  ← subdivisión operativa
```

**Regla**: el aislamiento se aplica **siempre** a nivel de organización. El taller determina *dónde* ocurre la operación, no *quién* puede verla.

| Dato | Nivel | Por qué |
|---|---|---|
| Clientes | **Organización** | Un cliente de la empresa puede ser atendido en cualquiera de sus sucursales; centralizarlos es el beneficio principal de tener varias. |
| Motocicletas | **Organización** | Siguen al cliente; su historial debe ser visible en cualquier sucursal. |
| Historial de mantenimiento | **Organización** | La trazabilidad de la moto no se pierde si el cliente cambia de sucursal. |
| Órdenes de trabajo | **Taller** | El servicio se ejecuta en un local concreto; la numeración y la carga de trabajo son por sucursal. |
| Inventario y movimientos de stock | **Taller** | Cada sucursal tiene existencias físicas propias. |
| Miembros y roles | **Organización** | El rol se otorga sobre la empresa; la asignación a talleres es operativa. |
| Auditoría | **Organización** (con referencia al taller cuando aplica) | Debe poder revisarse de forma consolidada. |

Estas asignaciones de nivel constituyen la decisión de diseño registrada en [ADR-006](07-decisiones-diseno.md); cualquier cambio en el alcance de una entidad se resuelve ahí y se refleja después en este glosario.

## Roles

Los identificadores de rol se mantienen **en inglés** en el modelo de datos y en la interfaz de programación; en la documentación y en el texto visible al usuario se emplea su equivalente en español.

| Rol | Alcance |
|---|---|
| **Owner** | Administra la organización: datos de la empresa, miembros y roles. Es quien la creó. |
| **Mechanic** | Trabajo técnico: diagnósticos, avance y cierre de órdenes de trabajo. |
| **Receptionist** | Atención: alta de clientes y motocicletas, apertura de órdenes, entrega. |

El rol es **por organización**, no global: la misma cuenta puede ser Owner en una organización y Mechanic en otra.

## Términos de arquitectura

Uso interno de cada término. La definición formal con su fuente citable está en el [Marco conceptual](../anteproyecto/03-marco-teorico-y-conceptual.md) §3.1.

| Término | Uso en este proyecto |
|---|---|
| **RLS** (Row-Level Security) | Mecanismo de PostgreSQL que restringe, en el propio motor de base de datos, qué filas puede leer o escribir cada usuario. Es la capa de fondo del aislamiento entre organizaciones. |
| **Serverless** | Modelo de despliegue donde el backend corre como funciones efímeras bajo demanda, sin servidor propio que administrar y sin costo fijo cuando no hay tráfico. |
| **Defensa en profundidad** | Aquí: el aislamiento se aplica **dos veces** — políticas RLS en la base de datos *y* verificación de membresía en la API. Si una falla, la otra sostiene. Su fundamento está en §3.2.4 del marco teórico. |
| **Problem Details** | Formato estándar de respuesta de error (RFC 9457, que sustituye al RFC 7807) que usa la API. Los códigos siguen el patrón `modulo.razon` (ej. `organization.access_denied`). |
| **Contexto activo** | El par organización activa + taller activo que acompaña a cada petición. El servidor no asume ninguno por defecto: si falta, rechaza la petición. |

## Términos del mercado boliviano

| Término | Definición |
|---|---|
| **SIN** | Servicio de Impuestos Nacionales de Bolivia — regula la facturación electrónica. |
| **CUIS** | Código Único de Inicio de Sistema, otorgado por el SIN al contribuyente. |
| **CUFD** | Código Único de Facturación Diaria, se obtiene cada jornada. |
| **CUF** | Código Único de Facturación, se genera por cada factura emitida. |
| **RND** | Resolución Normativa de Directorio — la normativa del SIN. Cambia con el tiempo: **verificar la vigente antes de implementar**. |

## Precisiones de uso

Términos que conviene emplear con exactitud para no confundir los dos niveles de la jerarquía:

| En lugar de | Usar | Motivo |
|---|---|---|
| "Multi-taller" | **"Multiempresa"** (varias empresas por cuenta) o **"multi-sucursal"** (varias sucursales por empresa) | Es ambiguo: confunde dos niveles distintos. Emplear el término correspondiente al nivel del que se habla. |
| "Taller" como sinónimo de la unidad de aislamiento | **"Empresa"** u **"organización"** | La unidad de aislamiento es la empresa; el taller es una sucursal dentro de ella. |
| "Usuario de la empresa" | **"Miembro"** | El acceso lo otorga la membresía, no la mera existencia de la cuenta. |

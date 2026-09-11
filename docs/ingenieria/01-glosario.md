# Glosario

Terminología unificada del proyecto. **Fuente de verdad de los términos**: si otro documento usa una palabra distinta para lo mismo, se corrige ese documento, no este.

> **Alcance de este documento**: fija el **lenguaje del dominio** y su uso interno. Las definiciones formales de las tecnologías, con su fuente académica o normativa citable, están en el [Marco conceptual](../anteproyecto/03-marco-teorico-y-conceptual.md) §3.1 — aquí no se duplican.

## Términos del modelo multiorganización

| Término | Definición | Notas |
|---|---|---|
| **Cuenta** | La identidad de una persona en la plataforma (email + contraseña). Vive en `auth.users` de Supabase, con datos de perfil en `mt_profiles`. | Una persona = una cuenta, sin importar en cuántas organizaciones participe. |
| **Organización** | La entidad que opera el negocio de servicio de motocicletas. Es la **unidad de aislamiento de datos** (el *tenant*). Tabla `mt_organizations`. | **Una cuenta puede crear y pertenecer a varias organizaciones** — este es el cambio central del modelo ERP. |
| **Taller** | El **local físico** donde se presta el servicio. Pertenece a una organización. Tabla `mt_workshops`. | **Una organización puede tener varios talleres** (relación 1:N). El taller **no** es una unidad de aislamiento: es una subdivisión operativa dentro de la organización. |
| **Membresía** | La relación entre una cuenta y una organización, con un rol. Tabla `mt_memberships`, única por `(organization_id, user_id)`. | Es lo que autoriza el acceso. Sin membresía activa no hay acceso a los datos de esa organización. El rol es **de organización**, no de taller. |
| **Asignación a taller** | Vínculo operativo entre un miembro y uno o varios talleres de su organización (p. ej. en qué taller trabaja un mecánico). | No otorga ni restringe permisos por sí sola: los permisos vienen del rol de la membresía. Sirve para operación y reportes. |
| **Organización activa** | La organización sobre la que opera el usuario en un momento dado. Se envía por request en el header `X-Org-Id` y se valida contra la membresía. | Permite cambiar de organización sin cerrar sesión (RNF-401). El servidor nunca la asume por defecto. |
| **Taller activo** | El taller sobre el que se está operando dentro de la organización activa. Se indica por request (header `X-Workshop-Id`) y debe pertenecer a la organización activa. | Necesario para las operaciones que ocurren en un local concreto (órdenes, inventario). |
| **Tenant** | Sinónimo técnico de *organización*. Se usa al hablar de arquitectura (multi-tenant, aislamiento entre tenants). | Preferir "organización" en documentación de producto; "tenant" en documentación técnica. |

> **Un solo nombre por concepto.** Cada nivel de la jerarquía tiene **un** término en español y **un** identificador técnico, y no se admiten sinónimos: nivel 1 es **organización** (`mt_organizations`, cabecera `X-Org-Id`, códigos `organization.*`) y nivel 2 es **taller** (`mt_workshops`, cabecera `X-Workshop-Id`, códigos `workshop.*`). Los identificadores se conservan en inglés porque nombran objetos del esquema y del contrato; en prosa se emplea siempre la forma en español. Los términos **empresa** y **sucursal** quedan retirados del proyecto.

## Jerarquía y alcance de los datos

```
Cuenta (auth.users)
   └── membresía (rol) ──> Organización  ← unidad de aislamiento (tenant)
                              └── Taller  ← subdivisión operativa (local físico)
```

**Regla**: el aislamiento se aplica **siempre** a nivel de organización. El taller determina *dónde* ocurre la operación, no *quién* puede verla.

| Dato | Nivel | Por qué |
|---|---|---|
| Clientes | **Organización** | Un cliente de la organización puede ser atendido en cualquiera de sus talleres; centralizarlos es el beneficio principal de tener varios. |
| Motocicletas | **Organización** | Siguen al cliente; su historial debe ser visible en cualquier taller. |
| Historial de mantenimiento | **Organización** | La trazabilidad de la moto no se pierde si el cliente cambia de taller. |
| Órdenes de trabajo | **Taller** | El servicio se ejecuta en un local concreto; la numeración y la carga de trabajo son por taller. |
| Inventario y movimientos de stock | **Taller** | Cada taller tiene existencias físicas propias. |
| Miembros y roles | **Organización** | El rol se otorga sobre la organización; la asignación a talleres es operativa. |
| Auditoría | **Organización** (con referencia al taller cuando aplica) | Debe poder revisarse de forma consolidada. |

Estas asignaciones de nivel constituyen la decisión de diseño registrada en [ADR-006](07-decisiones-diseno.md); cualquier cambio en el alcance de una entidad se resuelve ahí y se refleja después en este glosario.

## Roles

Los identificadores de rol se mantienen **en inglés** en el modelo de datos y en la interfaz de programación; en la documentación y en el texto visible al usuario se emplea su equivalente en español.

| Rol | Alcance |
|---|---|
| **Owner** | Administra la organización: sus datos, sus talleres, sus miembros y sus roles. Es quien la creó. |
| **Mechanic** | Trabajo técnico: diagnósticos, avance y cierre de órdenes de trabajo. |
| **Receptionist** | Atención: alta de clientes y motocicletas, apertura de órdenes, entrega. |

El rol es **por organización**, no global: la misma cuenta puede ser Owner en una organización y Mechanic en otra.

**Owner es único por organización**: solo hay un propietario activo en cada una, y no lo sostiene únicamente la interfaz —la base de datos lo hace cumplir con un índice único parcial (ver [Modelo de datos](05-modelo-datos.md) y [Seguridad](06-seguridad.md)).

> Las responsabilidades sobre **motocicletas y órdenes de trabajo** describen el producto completo; esos módulos quedan fuera del alcance del proyecto de grado (RF-801 y RF-802, ver [Requisitos](02-requisitos.md)). Dentro del corte vertical, los tres roles se ejercen sobre **clientes e inventario**, con el reparto de permisos que fijan RF-505 y RF-609.

## Términos de arquitectura

Uso interno de cada término. La definición formal con su fuente citable está en el [Marco conceptual](../anteproyecto/03-marco-teorico-y-conceptual.md) §3.1.

| Término | Uso en este proyecto |
|---|---|
| **RLS** (Row Level Security) | Mecanismo de PostgreSQL que restringe, en el propio motor de base de datos, qué filas puede leer o escribir cada usuario. Es la capa de fondo del aislamiento entre organizaciones. |
| **Serverless** | Modelo de despliegue donde el backend corre como funciones efímeras bajo demanda, sin servidor propio que administrar y sin costo fijo cuando no hay tráfico. |
| **Defensa en profundidad** | Aquí: el aislamiento se aplica **dos veces** — políticas RLS en la base de datos *y* verificación de membresía en la API. Si una falla, la otra sostiene. Su fundamento está en §3.2.4 del marco teórico. |
| **Inmutabilidad del aislamiento** | Propiedad que **el título del proyecto nombra**: la separación entre organizaciones **no puede desactivarse desde la aplicación**. No existe interruptor, configuración ni ruta de código que la apague, porque reside en el motor de base de datos y se evalúa sobre la identidad de quien consulta. Es verificable: anulando la verificación de membresía de la capa de aplicación, las políticas siguen filtrando (RNF-102, caso CP-N102). **No confundir con el historial inmutable**, que es una propiedad de dos tablas y no del aislamiento. |
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
| "Empresa" | **"Organización"** | Término retirado. La unidad de aislamiento se llama organización en todo el proyecto, igual que la tabla `mt_organizations` y la cabecera `X-Org-Id`. |
| "Sucursal" | **"Taller"** | Término retirado. El local físico se llama taller en todo el proyecto, igual que la tabla `mt_workshops`. |
| "Multi-taller" a secas | **"Multiorganización"** (varias organizaciones por cuenta) o **"varios talleres por organización"** | Es ambiguo: confunde los dos niveles. Emplear el término del nivel del que se habla. |
| "Taller" como unidad de aislamiento | **"Organización"** | La unidad de aislamiento es la organización; el taller es un local dentro de ella y no constituye frontera de seguridad. |
| "Usuario de la organización" | **"Miembro"** | El acceso lo otorga la membresía, no la mera existencia de la cuenta. |

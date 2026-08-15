# Decisiones de diseño (ADR)

Registro de las decisiones estructurales del proyecto, con las alternativas evaluadas, el criterio de selección y las consecuencias asumidas. Formato ADR (*Architecture Decision Record*): documenta **por qué** el sistema se diseña de una manera y no de otra, de modo que la decisión pueda revisarse con la misma información con que se tomó.

> Terminología: [01-glosario.md](01-glosario.md). Arquitectura resultante: [04-arquitectura.md](04-arquitectura.md). Requisitos que la originan: [02-requisitos.md](02-requisitos.md).

---

## ADR-001 — Plataforma de ejecución y lenguaje del backend

**Estado**: aceptada.

**Contexto.** El sistema debe desplegarse sobre una infraestructura sin administración de servidores y con costo proporcional al uso (RNF-301, RNF-302), dado que se dirige a talleres con bajo presupuesto de tecnología. La plataforma de despliegue seleccionada ejecuta funciones serverless en Node.js, Python, Go y Ruby.

**Alternativas consideradas**

| Alternativa | Ventajas | Inconvenientes |
|---|---|---|
| **Node.js con TypeScript** | Tipado estático de extremo a extremo; mismo lenguaje que la interfaz de usuario, lo que evita duplicar modelos y reduce el costo de mantenimiento para un equipo reducido; soporte nativo en la plataforma serverless | Ecosistema de dependencias amplio, que exige disciplina en su selección |
| **Python** | Sintaxis concisa; ecosistema maduro | Tipado opcional; obligaría a mantener dos lenguajes entre servidor y cliente |
| **Plataforma con servidor administrado** (contenedores o máquina virtual) | Libertad total de lenguaje y runtime | Introduce costo fijo mensual y trabajo de operación, contrario a RNF-302 |

**Decisión**: Node.js con TypeScript sobre funciones serverless.

**Justificación.** Es la única alternativa que satisface simultáneamente el requisito de costo proporcional al uso y el de tipado estático verificable (RNF-201), y unifica el lenguaje entre servidor y cliente, lo que resulta determinante en un proyecto desarrollado por una sola persona.

**Consecuencias.** El diseño queda condicionado por el modelo de ejecución serverless: las funciones son efímeras y sin estado, por lo que no puede mantenerse estado en memoria entre peticiones ni depender de conexiones persistentes a la base de datos.

---

## ADR-002 — Aislamiento multi-tenant con RLS *y* verificación en la API

**Estado**: aceptada.

**Contexto.** El aislamiento entre empresas es el requisito no funcional crítico del sistema (RNF-101). La práctica habitual en arquitecturas de esquema compartido consiste en filtrar por el identificador de inquilino en cada consulta, desde el código de aplicación; ese enfoque depende de que **ninguna** consulta omita el filtro, y un solo descuido produce una fuga de datos. La literatura reciente documenta además que la seguridad a nivel de fila, aun siendo un control efectivo, no está exenta de vías de fuga indirectas (ver estado del arte).

**Alternativas consideradas**
1. Aislamiento únicamente en la capa de aplicación.
2. Row-Level Security como único mecanismo.
3. Ambos: RLS + verificación explícita en la API (defensa en profundidad).

**Decisión**: opción 3.

**Justificación.** RLS protege aunque el código tenga un error; la verificación en la API permite devolver errores de negocio específicos (`organization.access_denied`, `organization.insufficient_permissions`) en lugar de un resultado vacío ambiguo, y no deja el sistema dependiendo de una única configuración.

**Consecuencias.** La regla de aislamiento se mantiene en dos lugares (políticas SQL y código TypeScript), con el costo de mantenimiento que eso implica. Se compensa con pruebas automatizadas que cubren ambas capas.

**Relación con los objetivos.** La comparación fundamentada frente a las alternativas de base por inquilino y esquema por inquilino corresponde al objetivo específico 1, y se desarrolla en el estado del arte.

---

## ADR-003 — Hono como framework de API

**Estado**: aceptada.

**Contexto.** Se requiere un marco de trabajo para exponer la interfaz de programación, que sea desplegable como funciones serverless (ADR-001) y que preserve el tipado estático exigido por RNF-201.

**Alternativas consideradas**
1. **Next.js** (rutas de API): unifica interfaz de usuario y servidor en un solo proyecto, a costa de acoplar ambas capas a un mismo marco y su ciclo de versiones.
2. **Express**: el más difundido del ecosistema, con abundante material de referencia, pero con soporte de tipos añadido a posteriori y menor afinidad con entornos serverless.
3. **Hono**: diseñado desde su origen para TypeScript y para entornos serverless, con adaptadores oficiales para la plataforma de despliegue seleccionada.

**Decisión**: opción 3.

**Justificación.** Ofrece tipado de extremo a extremo sin capas de compatibilidad, y mantiene la interfaz de usuario desacoplada del marco del servidor, de modo que cada una puede evolucionar por separado.

**Consecuencias.** Al ser menos difundido que Express o Next.js, hay menos material de referencia disponible y una curva de aprendizaje mayor para quien continúe el proyecto.

---

## ADR-004 — Delegación de la gestión de identidad

**Estado**: aceptada.

**Contexto.** El sistema necesita registro, inicio de sesión, renovación de sesión, confirmación de correo electrónico y recuperación de contraseña (RF-101 a RF-104). Implementar estos flujos de forma propia implica, además del desarrollo, resolver el almacenamiento seguro de credenciales, la rotación de credenciales de renovación y la integración con un proveedor de correo saliente.

**Alternativas consideradas**
1. **Implementación propia** basada en JSON Web Tokens y credenciales de renovación gestionadas por el sistema.
2. **Delegación en un proveedor de identidad gestionado**, integrado con el mismo motor de base de datos.

**Decisión**: opción 2.

**Justificación.** Reduce superficie de código sensible —el sistema nunca recibe ni almacena contraseñas (RNF-104)— y el identificador de usuario autenticado queda disponible dentro del motor de base de datos, lo que permite que las políticas de seguridad a nivel de fila lo evalúen directamente. Esto último es condición necesaria para ADR-002.

**Consecuencias.** Se introduce dependencia de un proveedor externo para la identidad. Un cambio de proveedor exigiría migrar credenciales, no solo datos. El riesgo se registra y se mitiga aislando el acceso al proveedor tras una capa propia (ver [08-plan-trabajo.md](08-plan-trabajo.md), riesgo R3).

---

## ADR-005 — Selección del contexto de trabajo por cabecera de petición

**Estado**: aceptada.

**Contexto.** En un modelo donde una cuenta pertenece a varias empresas, cada petición debe indicar sobre cuál de ellas opera. Resolver el contexto de forma implícita —por ejemplo, tomando la primera empresa asociada a la cuenta— impide el cambio explícito de contexto y hace ambiguo el alcance de cada operación.

**Alternativas consideradas**
1. Incluir la empresa activa como declaración dentro del token de sesión: obliga a reemitir el token en cada cambio de contexto.
2. Anidar la empresa en la ruta de cada recurso (`/api/empresas/{id}/clientes`): hace explícito el contexto, pero acopla la estructura de rutas a la jerarquía y complica su evolución.
3. Indicar la empresa activa mediante una cabecera de petición, validada contra la membresía.

**Decisión**: opción 3 — cabecera `X-Org-Id` para la empresa activa y `X-Workshop-Id` para la sucursal activa.

**Justificación.** Permite cambiar de contexto sin reemitir el token de sesión, mantiene estables las rutas de los recursos y concentra la validación en un único punto reutilizable por todos los módulos.

**Consecuencias.** El cliente debe conservar y enviar el contexto activo en cada llamada de negocio. El servidor **nunca asume un contexto por defecto**: si la cabecera falta, la petición se rechaza de forma explícita (RF-303).

---

## ADR-006 — Jerarquía de dos niveles: empresa con varias sucursales

**Estado**: aceptada.

**Contexto.** El operador al que se dirige el sistema puede administrar varias empresas y, dentro de cada una, **varias sucursales** (locales físicos donde se presta el servicio). La cuestión de diseño es dónde situar el límite de aislamiento cuando el inquilino tiene una subdivisión interna: si se sitúa demasiado abajo, se fragmenta la información del cliente entre locales; si no se modela la subdivisión, no puede distinguirse dónde ocurre cada operación.

**Alternativas consideradas**
1. **Una empresa equivale a un local.** Cada sucursal se registra como una empresa independiente. Es la opción más simple, pero fragmenta clientes e historial entre locales de un mismo operador y obliga a cambiar de contexto para atender al mismo cliente — anula el beneficio de centralizar.
2. **La sucursal como segunda unidad de aislamiento** (inquilino anidado): las políticas de seguridad filtrarían también por sucursal. Ofrece la separación más estricta, pero impide compartir clientes e historial entre locales de la misma empresa y duplica la complejidad de las políticas, aumentando la probabilidad de error en su definición.
3. **Jerarquía empresa → sucursales con el aislamiento situado únicamente en la empresa.** La sucursal actúa como criterio de alcance operativo: determina *dónde* ocurre una operación, no *quién* puede verla.

**Decisión**: opción 3.

**Justificación.** Conserva **un único límite de seguridad** —la empresa—, lo que mantiene las políticas de aislamiento simples y auditables, y a la vez habilita la operación en varios locales. Los datos que acompañan al cliente permanecen a nivel de empresa; los que corresponden a la existencia física de un local, a nivel de sucursal.

**Alcance de los datos por nivel** — tabla completa en [01-glosario.md](01-glosario.md):

| Nivel empresa | Nivel sucursal |
|---|---|
| Clientes, motocicletas, historial de mantenimiento, miembros y roles, auditoría | Órdenes de trabajo, inventario y movimientos de existencias |

**Consecuencias**
- El modelo incorpora una entidad de sucursal dependiente de la empresa, y una entidad de asignación de miembros a sucursales.
- Las entidades de nivel sucursal referencian **tanto** a la sucursal como a la empresa; conservar la referencia a la empresa en todas las tablas permite que las políticas de aislamiento se evalúen siempre sobre un único criterio.
- Cada petición de nivel sucursal requiere indicar la sucursal activa, validada como perteneciente a la empresa activa (ADR-005).
- Las restricciones de unicidad se definen según el nivel de cada entidad: el número de parte de inventario es único por sucursal; el correo del cliente, único por empresa.
- La numeración de órdenes de trabajo es correlativa por sucursal y año.

**Alcance del aporte.** El modelo pasa de una multi-tenancy plana a una **jerárquica**: el reto de diseño consiste en sostener un aislamiento verificable entre empresas mientras se soporta una subdivisión interna con reglas de alcance distintas según el tipo de entidad (ver [anteproyecto/01-definicion-y-alcance.md](anteproyecto/01-definicion-y-alcance.md)).

---

## Decisiones abiertas

Se documentan para dejar constancia de que están identificadas; su resolución corresponde a etapas posteriores al alcance actual.

| Tema | Situación |
|---|---|
| Proveedor de mensajería por WhatsApp | Abierta — depende de funcionalidad fuera del alcance actual (ver [09-analisis-mercado.md](09-analisis-mercado.md)) |
| Enfoque de integración con la facturación electrónica del SIN: proveedor autorizado frente a implementación propia de firma digital y generación de XML | Abierta — requiere validar la normativa vigente antes de decidir |
| Si la asignación de un miembro a sucursales debe restringir lo que puede ver, o mantenerse informativa | Abierta — el diseño actual la define como operativa, sin efecto sobre los permisos (ADR-006) |

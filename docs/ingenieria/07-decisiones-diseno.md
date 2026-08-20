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

**Contexto.** El aislamiento entre organizaciones es el requisito no funcional crítico del sistema (RNF-101). La práctica habitual en arquitecturas de esquema compartido consiste en filtrar por el identificador de inquilino en cada consulta, desde el código de aplicación; ese enfoque depende de que **ninguna** consulta omita el filtro, y un solo descuido produce una fuga de datos. La literatura reciente documenta además que la seguridad a nivel de fila, aun siendo un control efectivo, no está exenta de vías de fuga indirectas (ver estado del arte).

**Alternativas consideradas**
1. Aislamiento únicamente en la capa de aplicación.
2. Row-Level Security como único mecanismo.
3. Ambos: RLS + verificación explícita en la API (defensa en profundidad).

**Decisión**: opción 3.

**Justificación.** RLS protege aunque el código tenga un error; la verificación en la API permite devolver errores de negocio específicos (`organization.access_denied`, `organization.insufficient_permissions`) en lugar de un resultado vacío ambiguo, y no deja el sistema dependiendo de una única configuración.

**Consecuencias.** La regla de aislamiento se mantiene en dos lugares (políticas SQL y código TypeScript), con el costo de mantenimiento que eso implica. Se compensa con pruebas automatizadas que cubren ambas capas.

Esta decisión establece **que** hay dos capas, no **cómo** participa la segunda en el camino de la interfaz: eso depende de la identidad con que el servidor consulta la base de datos, y se resuelve en ADR-008.

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

**Contexto.** En un modelo donde una cuenta pertenece a varias organizaciones, cada petición debe indicar sobre cuál de ellas opera. Resolver el contexto de forma implícita —por ejemplo, tomando la primera organización asociada a la cuenta— impide el cambio explícito de contexto y hace ambiguo el alcance de cada operación.

**Alternativas consideradas**
1. Incluir la organización activa como declaración dentro del token de sesión: obliga a reemitir el token en cada cambio de contexto.
2. Anidar la organización en la ruta de cada recurso (`/api/organizaciones/{id}/clientes`): hace explícito el contexto, pero acopla la estructura de rutas a la jerarquía y complica su evolución.
3. Indicar la organización activa mediante una cabecera de petición, validada contra la membresía.

**Decisión**: opción 3 — cabecera `X-Org-Id` para la organización activa y `X-Workshop-Id` para el taller activo.

**Justificación.** Permite cambiar de contexto sin reemitir el token de sesión, mantiene estables las rutas de los recursos y concentra la validación en un único punto reutilizable por todos los módulos.

**Consecuencias.** El cliente debe conservar y enviar el contexto activo en cada llamada de negocio. El servidor **nunca asume un contexto por defecto**: si la cabecera falta, la petición se rechaza de forma explícita (RF-303). La regla de rutas que se deriva de esta decisión —qué identificadores pueden aparecer en la ruta y cuáles viajan solo por cabecera— está fijada en el [Contrato de la interfaz de programación](10-contrato-api.md) §2.3.

---

## ADR-006 — Jerarquía de dos niveles: organización con varios talleres

**Estado**: aceptada.

**Contexto.** El operador al que se dirige el sistema puede administrar varias organizaciones y, dentro de cada una, **varios talleres** (locales físicos donde se presta el servicio). La cuestión de diseño es dónde situar el límite de aislamiento cuando el inquilino tiene una subdivisión interna: si se sitúa demasiado abajo, se fragmenta la información del cliente entre locales; si no se modela la subdivisión, no puede distinguirse dónde ocurre cada operación.

**Alternativas consideradas**
1. **Una organización equivale a un local.** Cada taller se registra como una organización independiente. Es la opción más simple, pero fragmenta clientes e historial entre locales de un mismo operador y obliga a cambiar de contexto para atender al mismo cliente — anula el beneficio de centralizar.
2. **El taller como segunda unidad de aislamiento** (inquilino anidado): las políticas de seguridad filtrarían también por taller. Ofrece la separación más estricta, pero impide compartir clientes e historial entre locales de la misma organización y duplica la complejidad de las políticas, aumentando la probabilidad de error en su definición.
3. **Jerarquía organización → talleres con el aislamiento situado únicamente en la organización.** El taller actúa como criterio de alcance operativo: determina *dónde* ocurre una operación, no *quién* puede verla.

**Decisión**: opción 3.

**Justificación.** Conserva **un único límite de seguridad** —la organización—, lo que mantiene las políticas de aislamiento simples y auditables, y a la vez habilita la operación en varios locales. Los datos que acompañan al cliente permanecen a nivel de organización; los que corresponden a la existencia física de un local, a nivel de taller.

El reparto concreto de cada entidad entre los dos niveles, que se deriva de esta decisión, está en el [Glosario](01-glosario.md).

**Consecuencias**
- El modelo incorpora una entidad de taller dependiente de la organización, y una entidad de asignación de miembros a talleres.
- Las entidades de nivel taller referencian **tanto** al taller como a la organización; conservar la referencia a la organización en todas las tablas permite que las políticas de aislamiento se evalúen siempre sobre un único criterio.
- Cada petición de nivel taller requiere indicar el taller activo, validada como perteneciente a la organización activa (ADR-005).
- Las restricciones de unicidad se definen según el nivel de cada entidad: el número de parte de inventario es único por taller; el correo del cliente, único por organización.
- La numeración de órdenes de trabajo queda fijada como correlativa **por taller** (RF-802): se sigue del nivel asignado a esa entidad, aunque el módulo esté fuera del alcance actual.

**Alcance del aporte.** El modelo pasa de una multi-tenancy plana a una **jerárquica**: el reto de diseño consiste en sostener un aislamiento verificable entre organizaciones mientras se soporta una subdivisión interna con reglas de alcance distintas según el tipo de entidad (ver [anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md)).

---

## ADR-007 — Atomicidad de las operaciones compuestas en el motor de base de datos

**Estado**: aceptada.

**Contexto.** Tres operaciones del sistema deben ser atómicas o no ocurrir: el registro de una cuenta —que crea organización, primer taller y membresía propietaria (RF-101)—, el registro de un movimiento de existencias —que inserta el movimiento y actualiza la existencia del repuesto (RF-604)— y la transferencia entre talleres, que genera dos movimientos vinculados (RF-608). La biblioteca cliente del proveedor de datos expone cada sentencia como una petición HTTP independiente y **no admite transacciones que abarquen varias sentencias**.

**Alternativas consideradas**

| Alternativa | Ventajas | Inconvenientes |
|---|---|---|
| **Secuencia de llamadas con compensación** desde la capa de aplicación | Toda la lógica de negocio permanece en un solo lenguaje y es fácil de probar sin base de datos | No es atómica: una interrupción entre dos pasos deja el sistema en un estado intermedio. La compensación es a su vez una operación que puede fallar, y en un entorno de funciones efímeras el proceso puede terminar antes de ejecutarla |
| **Funciones almacenadas invocadas por procedimiento remoto** | Cada función es una transacción implícita: o se completa entera o no deja rastro. Permite además bloquear la fila afectada para serializar operaciones concurrentes | Reparte la lógica de negocio entre dos lenguajes; las reglas alojadas en la base de datos solo pueden probarse contra un motor real |
| **Relajar el requisito** y aceptar consistencia eventual | Simplifica la implementación | La existencia dejaría de poder reconstruirse desde su historial, que es justamente la garantía que el historial inmutable debe ofrecer |

**Decisión**: funciones almacenadas invocadas por procedimiento remoto, restringidas a las operaciones que exigen atomicidad.

**Justificación.** Es la única alternativa que satisface el requisito tal como está especificado. El caso del inventario lo ilustra: sin una transacción, dos ventas simultáneas del mismo repuesto pueden leer la misma existencia previa y dejar el stock por encima del real, con dos movimientos que no explican el saldo resultante. La función resuelve además ese caso concreto bloqueando la fila del repuesto mientras dura la operación.

**Consecuencias**
- La lógica de negocio queda repartida entre el motor de base de datos y la capa de aplicación. Se acota el reparto: en la base de datos viven **solo** las operaciones que exigen atomicidad; el resto permanece en la aplicación.
- Las funciones se ejecutan con privilegios del creador y se conceden **únicamente** a la identidad del servidor, nunca a usuarios autenticados.
- Las reglas alojadas en funciones **no se pueden verificar sin un motor real**. Sus pruebas quedan condicionadas a la disponibilidad de credenciales, y por tanto no cubren el requisito hasta que se ejecutan.
- Los errores de negocio se levantan desde la función con el mismo catálogo de códigos `modulo.razon`, para que el contrato de error no dependa de dónde se aplicó la regla.

---

## ADR-008 — Identidad con la que la interfaz consulta los datos

**Estado**: aceptada.

**Contexto.** ADR-002 fija que el aislamiento se aplica en dos capas. Queda por decidir algo que esa decisión no resuelve y que determina si la segunda capa **participa realmente** en el camino de la interfaz: con qué identidad consulta el servidor la base de datos.

El proveedor de datos ofrece dos credenciales. La **clave de servicio** salta las políticas por diseño —está pensada para tareas administrativas—; la **credencial de la petición** actúa con la identidad de quien llama, de modo que las políticas se evalúan sobre ella. La elección no es un detalle de implementación: si toda consulta usa la clave de servicio, las políticas no intervienen en ninguna petición de la interfaz, y la defensa en profundidad se reduce a un solo control por vía. El sistema seguiría aislando, pero RNF-102 —«deshabilitar la verificación de la capa de aplicación no produce fuga»— sería falso para el camino de la interfaz.

**Alternativas consideradas**

| Alternativa | Ventajas | Inconvenientes |
|---|---|---|
| **Clave de servicio en todo el servidor** | Un solo cliente, sin casos especiales; ninguna consulta puede fallar por una política mal escrita | Las políticas no intervienen en el camino de la interfaz: el aislamiento pasa a depender **solo** del control de la aplicación. Incumple RNF-102 y deja sin sustento la segunda cláusula de la hipótesis |
| **Credencial de la petición en todo el servidor** | Máxima coherencia: una sola regla, sin excepciones que recordar | Imposible: el registro ocurre antes de que exista sesión; la creación de una organización exige escribir una membresía que la política aún no permite —el solicitante todavía no es miembro—; y varias funciones están concedidas solo a la identidad del servidor (ADR-007, RNF-106) |
| **Reparto: credencial de la petición para los datos de negocio, clave de servicio para un conjunto cerrado de excepciones** | Las políticas actúan en el camino de la interfaz; lo privilegiado queda acotado y enumerado | Introduce dos clientes y, con ellos, la posibilidad de equivocarse al añadir un endpoint. Exige que las excepciones estén documentadas una a una |

**Decisión**: la tercera. Los datos de negocio se leen y escriben con la **credencial de la petición**; la clave de servicio queda restringida a **siete excepciones** enumeradas en el código, cada una con su motivo.

**Justificación.** Es la única alternativa que hace verdadera la afirmación de ADR-002 sobre el camino de la interfaz sin bloquear operaciones que ninguna política puede autorizar. Las excepciones no son un residuo: cada una corresponde a un caso donde la política **no puede** conceder el acceso —porque aún no hay sesión, porque el solicitante todavía no es miembro, o porque la operación está deliberadamente reservada al servidor.

**La primera excepción merece énfasis**, porque parece una inconsistencia y es lo contrario: **la propia verificación de membresía de la capa de aplicación consulta con clave de servicio**. Si consultara con la credencial de la petición, el control de la aplicación dependería de las políticas para funcionar, y las dos capas dejarían de ser independientes. La independencia es justo lo que RNF-102 exige demostrar, de modo que hacer aquí lo «coherente» destruiría la propiedad que se busca.

**Consecuencias**

- Conviven dos clientes de datos, y **elegir el equivocado desactiva silenciosamente una capa de seguridad**. Se mitiga concentrando la decisión: el cliente de la petición se construye una sola vez, en el middleware de autenticación, y viaja en el contexto; las excepciones están enumeradas en un único lugar del código.
- Una consulta legítima puede fallar si su política está mal escrita. Antes, con la clave de servicio, ese error quedaba oculto; ahora se manifiesta. Es el precio de que las políticas intervengan de verdad.
- Un rechazo de una política se manifiesta como error del motor, no como error de negocio. Como el control de la aplicación se evalúa **antes**, en operación normal es este el que responde con su código; que responda la política indica una discrepancia entre ambas capas, y por eso se propaga como fallo del servidor y no se traduce a un código de negocio.
- El cliente del servidor puede reutilizarse entre peticiones; el de la petición, no — depende de la credencial de quien llama. Se construye **una sola vez por petición**, en el middleware de autenticación, y viaja en el contexto: crearlo por consulta multiplicaría ese costo en un entorno de funciones efímeras. El cliente no abre conexiones persistentes, de modo que la sobrecarga es la de instanciar un objeto, no la de un arranque de conexión.
- La independencia de las dos capas pasa a ser **verificable**: el caso CP-N102 anula el control de la aplicación en el banco de pruebas y comprueba que las políticas siguen filtrando. Sin esta decisión, ese caso no podría existir.

---

## Decisiones abiertas

Se documentan para dejar constancia de que están identificadas; su resolución corresponde a etapas posteriores al alcance actual.

| Tema | Situación |
|---|---|
| Proveedor de mensajería por WhatsApp | Abierta — depende de funcionalidad fuera del alcance actual (ver [09-analisis-mercado.md](09-analisis-mercado.md)) |
| Enfoque de integración con la facturación electrónica del SIN: proveedor autorizado frente a implementación propia de firma digital y generación de XML | Abierta — requiere validar la normativa vigente antes de decidir |
| Si la asignación de un miembro a talleres debe restringir lo que puede ver, o mantenerse informativa | **Cerrada**: se mantiene **operativa**, sin efecto sobre los permisos. Restringir por taller introduciría una segunda frontera de autorización y contradiría el principio de un único límite de aislamiento (ADR-006). Si el negocio llegara a exigirlo, sería un ADR nuevo, no un ajuste de este |

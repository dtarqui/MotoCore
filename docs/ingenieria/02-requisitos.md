# Requisitos

Especificación de requerimientos del proyecto: actores, requisitos funcionales, reglas de negocio, requisitos no funcionales, requisitos de seguridad, priorización y trazabilidad. Es el eslabón entre el alcance ([anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) §1.8) y la arquitectura ([Arquitectura](04-arquitectura.md)): traduce el alcance en enunciados verificables **antes** de decidir cómo se construye.

> Terminología: [Glosario](01-glosario.md) · Historias de usuario: [Historias de usuario](03-historias-usuario.md) · Interfaz por la que se ejercen: [Contrato](10-contrato-api.md) · Casos de prueba, nivel y evidencia: [Plan de pruebas](11-plan-pruebas.md)

## Convenciones

- **Formato del requisito funcional** — *El sistema debe [acción] [objeto] [condición o restricción]*, redactado como comportamiento observable, no como descripción de pantalla.
- **Criterio de aceptación** — en formato **Dado–Cuando–Entonces**, de modo que el requisito nace con su prueba asociada.
- **Prioridad (MoSCoW)** — `Must`: bloquea la salida a producción · `Should`: alto valor, no bloqueante · `Could`: deseable si hay margen.
- **Alcance** — dentro (`Sí`) o fuera (`No`) del proyecto de grado (definición y alcance §1.8). Los requisitos fuera de alcance se documentan porque definen el producto completo.
- **Nivel** — si el dato que gobierna el requisito es de **organización** o de **taller**. Se declara en los bloques del corte vertical (RF-300, RF-500, RF-600); los demás son de nivel organización.

---

## 1. Actores

| Actor | Tipo | Objetivo en el sistema | Nivel de acceso |
|---|---|---|---|
| **Propietario** (`Owner`) | Humano | Administrar sus organizaciones: talleres, miembros, roles y auditoría | Autenticado; privilegiado dentro de cada organización que posee |
| **Recepcionista** (`Receptionist`) | Humano | Registrar y mantener clientes y el catálogo de repuestos | Autenticado; permisos por rol dentro de la organización |
| **Mecánico** (`Mechanic`) | Humano | Consultar clientes e inventario y registrar movimientos de existencias | Autenticado; permisos por rol dentro de la organización |
| **Miembro** | Humano | Cualquiera de los tres roles anteriores, cuando el requisito no distingue | Autenticado con membresía activa |
| **Cuenta sin membresía** | Humano | Ninguno sobre la organización: es el actor contra el que se verifica el aislamiento | Autenticado; sin acceso a la organización |
| **Visitante** | Humano | Registrarse | Sin credencial; solo el registro |
| **Proveedor de identidad** | Máquina | Autenticar, emitir y renovar credenciales de sesión | Externo |
| **Servidor con credencial privilegiada** | Proceso interno | Ejecutar las excepciones enumeradas de [ADR-008](07-decisiones-diseno.md): alta de cuenta, primera membresía, operaciones atómicas y escritura de auditoría | Interno, sin exposición pública |

---

## 2. Requisitos funcionales

### RF-100 · Identidad y cuentas

| ID | Actor | Requisito | Criterio de aceptación | Prioridad | Alcance |
|---|---|---|---|---|---|
| RF-101 | Visitante | El sistema debe registrar una cuenta con correo y contraseña y crear en el mismo acto su primera organización, su primer taller y la membresía `Owner`. | **Dado** un correo sin cuenta, **cuando** el visitante se registra con el nombre de su organización, **entonces** su perfil devuelve una organización con rol `owner` y un taller; **dado** un fallo en cualquier paso, **entonces** no queda ningún registro creado. | Must | Sí |
| RF-102 | Miembro | El sistema debe permitir iniciar sesión y renovar la sesión sin intervención del usuario. | **Dadas** credenciales válidas, **cuando** el usuario inicia sesión en el proveedor de identidad, **entonces** la interfaz acepta la credencial emitida; **dada** una credencial próxima a expirar, **cuando** se usa, **entonces** se renueva de forma transparente. | Must | Sí |
| RF-103 | Cualquiera | El sistema debe verificar la credencial en cada petición y rechazar las que no la traigan válida. | **Dada** una petición sin credencial o con credencial inválida a un recurso protegido, **cuando** se recibe, **entonces** responde `401`. | Must | Sí |
| RF-104 | Miembro | El sistema debe devolver el perfil de la cuenta autenticada con las organizaciones donde tiene membresía activa y su rol en cada una. | **Dada** una cuenta con dos membresías activas y una revocada, **cuando** consulta su perfil, **entonces** recibe solo las dos organizaciones activas, cada una con su rol. | Must | Sí |

### RF-200 · Organizaciones

| ID | Actor | Requisito | Criterio de aceptación | Prioridad | Alcance |
|---|---|---|---|---|---|
| RF-201 | Cuenta autenticada | El sistema debe permitir crear organizaciones adicionales, dejando al solicitante como `Owner`. | **Dada** una cuenta con una organización, **cuando** crea otra, **entonces** la nueva aparece en su listado con rol `owner`. | Must | Sí |
| RF-202 | Miembro | El sistema debe listar las organizaciones de la cuenta según su membresía activa, no según quién las creó. | **Dado** un miembro invitado, **cuando** lista sus organizaciones, **entonces** ve la organización aunque no la haya creado; **dado** un miembro removido, **entonces** deja de verla. | Must | Sí |
| RF-203 | Miembro | El sistema debe permitir seleccionar la organización activa y confirmar el rol del solicitante en ella. | **Dada** una organización con membresía activa, **cuando** el usuario la activa, **entonces** recibe la organización y su rol; **dada** una sin membresía, **entonces** recibe `403 organization.access_denied`. | Must | Sí |
| RF-204 | Owner | El sistema debe permitir al `Owner` editar los datos de su organización. | **Dado** el `Owner`, **cuando** edita la organización, **entonces** el cambio se refleja; **dado** un miembro no `Owner`, **cuando** lo intenta, **entonces** recibe `403`. | Should | Sí |

### RF-300 · Talleres

| ID | Actor | Requisito | Criterio de aceptación | Prioridad | Alcance | Nivel |
|---|---|---|---|---|---|---|
| RF-301 | Owner | El sistema debe permitir crear y editar talleres dentro de la organización activa. | **Dado** el `Owner`, **cuando** crea un taller, **entonces** aparece en el listado de la organización; **dado** un no `Owner`, **cuando** intenta crear o editar, **entonces** recibe `403`. | Must | Sí | Organización |
| RF-302 | Miembro | El sistema debe listar solo los talleres de la organización activa. | **Dadas** dos organizaciones con talleres, **cuando** se lista con una de ellas activa, **entonces** no aparece ningún taller de la otra. | Must | Sí | Organización |
| RF-303 | Miembro | El sistema debe exigir el taller activo en las operaciones de nivel taller y rechazar un taller ajeno a la organización activa. | **Dada** una operación de nivel taller sin `X-Workshop-Id`, **cuando** se envía, **entonces** responde `400 workshop.missing_active_workshop`; **dado** un taller de otra organización, **entonces** responde `404 workshop.not_found`. | Must | Sí | Organización |
| RF-304 | Owner | El sistema debe permitir asignar y retirar miembros de talleres sin alterar sus permisos. | **Dado** un miembro asignado a un taller, **cuando** consulta datos de la organización, **entonces** ve exactamente lo mismo que antes de la asignación. | Should | Sí | Organización |
| RF-305 | Owner | El sistema debe permitir desactivar un taller conservando su historial. | **Dado** un taller desactivado, **cuando** se listan los talleres activos, **entonces** no aparece; **cuando** se consultan sus datos, **entonces** siguen disponibles. | Should | Sí | Organización |

### RF-400 · Miembros y control de acceso

| ID | Actor | Requisito | Criterio de aceptación | Prioridad | Alcance |
|---|---|---|---|---|---|
| RF-401 | Owner | El sistema debe permitir incorporar una cuenta existente a la organización con rol `Mechanic` o `Receptionist`. | **Dada** una cuenta sin membresía, **cuando** el `Owner` la invita, **entonces** accede a la organización que antes le respondía `403`. | Must | Sí |
| RF-402 | Owner | El sistema debe impedir que una organización tenga más de un propietario activo. | **Dada** una invitación con rol `owner`, **cuando** se envía, **entonces** se rechaza por validación; **dada** una inserción directa de un segundo propietario activo, **cuando** llega al motor, **entonces** se rechaza. | Must | Sí |
| RF-403 | Owner | El sistema debe permitir cambiar el rol de un miembro. | **Dado** un `Mechanic`, **cuando** el `Owner` lo cambia a `Receptionist`, **entonces** el nuevo rol surte efecto en la siguiente petición. | Must | Sí |
| RF-404 | Owner | El sistema debe permitir remover a un miembro de la organización. | **Dado** un miembro removido, **cuando** intenta operar sobre la organización, **entonces** recibe `403`. | Must | Sí |
| RF-405 | Owner | El sistema debe impedir cambiar el rol del `Owner` o removerlo. | **Dado** el `Owner` de la organización, **cuando** se intenta cambiar su rol o removerlo, **entonces** responde `403 member.owner_protected`. | Must | Sí |
| RF-406 | Mechanic, Receptionist | El sistema debe reservar la gestión de miembros al `Owner`. | **Dado** un `Mechanic`, **cuando** intenta invitar, **entonces** recibe `403 member.insufficient_permissions`. | Must | Sí |
| RF-407 | Miembro | El sistema debe listar los miembros de la organización activa con su rol y estado. | **Dado** cualquier miembro, **cuando** consulta el equipo, **entonces** recibe solo miembros de la organización activa, con rol y estado. | Should | Sí |

### RF-500 · Clientes *(corte vertical — nivel organización)*

| ID | Actor | Requisito | Criterio de aceptación | Prioridad | Alcance | Nivel |
|---|---|---|---|---|---|---|
| RF-501 | Owner, Receptionist | El sistema debe registrar clientes en la organización activa. | **Dado** un cliente registrado, **cuando** se consulta por identificador, **entonces** se recupera con sus datos. | Must | Sí | Organización |
| RF-502 | Miembro | El sistema debe mostrar los clientes desde cualquier taller de la organización. | **Dado** un cliente creado con el taller A activo, **cuando** se listan los clientes con el taller B activo, **entonces** aparece. | Must | Sí | Organización |
| RF-503 | Owner, Receptionist | El sistema debe mantener el correo del cliente único por organización, sin colisión entre organizaciones. | **Dado** un correo ya registrado en la organización, **cuando** se registra de nuevo, **entonces** responde `409 client.duplicate_email`; **dado** el mismo correo en otra organización, **entonces** se acepta. | Must | Sí | Organización |
| RF-504 | Owner, Receptionist | El sistema debe permitir editar, buscar y dar de baja lógica a un cliente. | **Dado** un cliente dado de baja, **cuando** se listan los activos, **entonces** no aparece y su registro se conserva; **dada** una búsqueda por nombre o correo, **entonces** opera solo dentro de la organización activa. | Must | Sí | Organización |
| RF-505 | Mechanic | El sistema debe limitar al `Mechanic` a consultar clientes. | **Dado** un `Mechanic`, **cuando** intenta crear un cliente, **entonces** recibe `403`; **cuando** consulta el listado, **entonces** lo obtiene. | Should | Sí | Organización |

### RF-600 · Inventario *(corte vertical — nivel taller)*

| ID | Actor | Requisito | Criterio de aceptación | Prioridad | Alcance | Nivel |
|---|---|---|---|---|---|---|
| RF-601 | Owner, Receptionist | El sistema debe registrar repuestos en el taller activo. | **Dado** un repuesto registrado, **cuando** se consulta, **entonces** está asociado al taller activo en el que se creó. | Must | Sí | Taller |
| RF-602 | Miembro | El sistema debe mantener separado el inventario de cada taller. | **Dado** un repuesto del taller A, **cuando** se opera con el taller B de la misma organización, **entonces** no aparece. | Must | Sí | Taller |
| RF-603 | Owner, Receptionist | El sistema debe mantener el número de parte único por taller. | **Dado** un número de parte existente en el taller, **cuando** se repite, **entonces** responde `409 inventory.duplicate_part_number`; **dado** el mismo número en otro taller, **entonces** se acepta. | Must | Sí | Taller |
| RF-604 | Miembro | El sistema debe registrar movimientos de existencias como historial inmutable, con los tipos compra, venta, ajuste, devolución y merma; la transferencia la genera RF-608. | **Dado** cada uno de los cinco tipos directos, **cuando** se registra, **entonces** queda con existencia anterior y posterior; **dado** el tipo `transferencia` enviado directamente, **entonces** se rechaza; **dado** un movimiento existente, **cuando** se intenta modificar o borrar, **entonces** no es posible. | Must | Sí | Taller |
| RF-605 | Miembro | El sistema debe recalcular la existencia según el tipo de movimiento. | **Dado** cada tipo de movimiento, **cuando** se registra, **entonces** compra y devolución suman, venta y merma restan y ajuste fija el valor. | Must | Sí | Taller |
| RF-606 | Miembro | El sistema debe rechazar un movimiento que deje la existencia negativa. | **Dada** una existencia menor que la salida solicitada, **cuando** se registra, **entonces** responde `409 inventory.insufficient_stock` y el stock no cambia. | Must | Sí | Taller |
| RF-607 | Miembro | El sistema debe señalar los repuestos en o por debajo del mínimo. | **Dado** un listado con `lowStock`, **cuando** se consulta, **entonces** devuelve solo los repuestos del taller activo con existencia menor o igual al mínimo. | Should | Sí | Taller |
| RF-608 | Owner | El sistema debe transferir existencias entre talleres de la misma organización. | **Dada** existencia suficiente en el origen, **cuando** se transfiere, **entonces** descuenta en origen y suma en destino en una sola transacción; **dado** un destino de otra organización, **entonces** responde `403 inventory.cross_organization_transfer`. | Could | Sí | Taller |
| RF-609 | Owner, Receptionist, Mechanic | El sistema debe reservar el catálogo de repuestos a `Owner` y `Receptionist` y la transferencia al `Owner`, y permitir a cualquier miembro consultar el inventario y registrar movimientos. | **Dado** un `Mechanic`, **cuando** intenta crear o editar un repuesto, **entonces** recibe `403 inventory.insufficient_permissions`; **cuando** registra un movimiento, **entonces** se acepta. La cláusula de transferencia solo se ejerce si RF-608 se construye. | Should | Sí | Taller |

### RF-700 · Aislamiento y auditoría

| ID | Actor | Requisito | Criterio de aceptación | Prioridad | Alcance |
|---|---|---|---|---|---|
| RF-701 | Cuenta sin membresía | El sistema debe impedir que una cuenta sin membresía activa lea o escriba datos de la organización a través de la interfaz. | **Dada** una cuenta sin membresía, **cuando** declara el contexto ajeno, **entonces** recibe `403 organization.access_denied`; **cuando** referencia un recurso ajeno desde su propio contexto, **entonces** recibe el `404` del módulo ([Contrato](10-contrato-api.md) §5). | Must | Sí |
| RF-702 | Cuenta sin membresía | El sistema debe sostener el aislamiento también en el acceso directo a la base de datos. | **Dada** la identidad de otra cuenta, **cuando** consulta directamente las tablas de negocio, **entonces** obtiene cero filas ajenas. | Must | Sí |
| RF-703 | Servidor con credencial privilegiada | El sistema debe registrar con autor, acción y fecha las seis acciones críticas: invitación de un miembro, cambio de rol, remoción de un miembro, modificación de la organización (RF-204), desactivación de un taller (RF-305) y baja lógica de un cliente (RF-504). | **Dada** cada una de las seis acciones, **cuando** se ejecuta, **entonces** queda registrada; **dada** la eliminación de la entidad o del usuario referenciado, **entonces** el registro persiste. | Should | Sí |
| RF-704 | Owner | El sistema debe reservar la consulta del registro de auditoría al `Owner`, también por acceso directo. | **Dado** un `Mechanic` o `Receptionist`, **cuando** consulta la auditoría por la interfaz, **entonces** recibe `403`; **cuando** la consulta directamente en la base, **entonces** obtiene cero filas. | Should | Sí |

### RF-800 · Fuera del alcance del proyecto de grado

Documentados para dar contexto al diseño; su construcción es trabajo posterior (ver [Análisis del mercado](09-analisis-mercado.md)).

| ID | Requisito | Prioridad | Alcance |
|---|---|---|---|
| RF-801 | Gestión de motocicletas asociadas a clientes (nivel organización). | Must | No |
| RF-802 | Órdenes de trabajo con estados y numeración correlativa por taller (nivel taller). | Must | No |
| RF-803 | Historial de mantenimiento consolidado por motocicleta (nivel organización). | Should | No |
| RF-804 | Presupuestos con aprobación del cliente mediante enlace. | Must | No |
| RF-805 | Emisión de factura electrónica del SIN (CUIS/CUFD/CUF, XML firmado). | Must | No |
| RF-806 | Mensajería con el cliente por WhatsApp Business API. | Must | No |
| RF-807 | Agendamiento de citas y portal del cliente. | Should | No |
| RF-808 | Panel de métricas con consolidado por organización y filtro por taller. | Should | No |

---

## 3. Reglas de negocio

Restricciones del dominio que condicionan los requisitos sin ser funcionalidades en sí mismas. Se documentan aparte porque sobreviven a los cambios de interfaz y suelen aplicar a varios requisitos a la vez.

| ID | Regla | Requisitos que condiciona |
|---|---|---|
| RN-01 | Una organización tiene **un solo propietario activo**, que es quien la creó | RF-101, RF-201, RF-402 |
| RN-02 | El propietario no puede ser removido ni cambiado de rol | RF-405 |
| RN-03 | Solo se incorpora a cuentas existentes, y con rol `Mechanic` o `Receptionist` | RF-401, RF-402 |
| RN-04 | Reincorporar a un miembro removido **reactiva** su membresía con el nuevo rol; no la duplica | RF-401 |
| RN-05 | El rol es de la organización; la asignación a talleres **no otorga ni restringe permisos** | RF-304 |
| RN-06 | El nombre de taller es único por organización | RF-301 |
| RN-07 | El correo de cliente es único por organización | RF-503 |
| RN-08 | El número de parte es único por taller | RF-603 |
| RN-09 | Compra y devolución suman; venta y merma restan; ajuste fija un valor absoluto | RF-605 |
| RN-10 | La existencia **nunca** queda negativa | RF-606 |
| RN-11 | La existencia solo cambia registrando un movimiento, y los movimientos no se modifican ni se borran | RF-604 |
| RN-12 | Crear un repuesto con existencia inicial mayor que cero genera su movimiento de entrada | RF-601, RF-604 |
| RN-13 | La transferencia ocurre solo entre talleres de la misma organización, genera dos movimientos vinculados y es atómica | RF-608 |
| RN-14 | La baja de talleres, clientes y repuestos es **lógica** y conserva el historial | RF-305, RF-504 |
| RN-15 | El registro de auditoría es de solo inserción y lo escribe únicamente el servidor | RF-703, RF-704 |
| RN-16 | El registro de cuenta, organización, taller y membresía es atómico: ocurre entero o no ocurre | RF-101 |

---

## 4. Requisitos no funcionales

**Sin métrica y umbral no es un requisito, es un deseo.** Cada RNF declara su categoría, la métrica con su umbral y cómo se verifica.

### RNF-100 · Seguridad

| ID | Categoría | Requisito | Métrica y umbral | Cómo se verifica | Prioridad | Alcance |
|---|---|---|---|---|---|---|
| RNF-101 | Seguridad | El aislamiento entre organizaciones se aplica en el motor de base de datos, no solo en la aplicación. | **7 de 7** tablas de negocio censadas en el [Modelo de datos](05-modelo-datos.md) con políticas activas · **0 filas ajenas** por consulta directa | Acceso directo con identidad ajena (CP-N101) | Must | Sí |
| RNF-102 | Seguridad | El aislamiento es **inmutable**: se sostiene con la verificación de la capa de aplicación deshabilitada. | **100 %** de casos de aislamiento en verde bajo C2 · **0 filas ajenas** | Banco de pruebas con la verificación sustituida (CP-N102) | Must | Sí |
| RNF-103 | Seguridad | Las credenciales privilegiadas no se exponen al cliente ni al repositorio. | **0** secretos en el repositorio y en el paquete del cliente | Búsqueda de secretos e inspección (CP-N103) | Must | Sí |
| RNF-104 | Seguridad | El sistema nunca recibe ni persiste contraseñas en texto plano. | **0** rutas de código que reciban o persistan contraseñas | Inspección: gestión delegada, ADR-004 (CP-N104) | Must | Sí |
| RNF-105 | Seguridad | Los errores no revelan la existencia de recursos de otras organizaciones. | **100 %** de respuestas idénticas en estado, código y cuerpo entre recurso ajeno e inexistente | Prueba de integración (CP-N105) | Must | Sí |
| RNF-106 | Seguridad | La búsqueda de cuentas por correo no es explotable para enumeración. | **0** operaciones de búsqueda de cuentas invocables desde el cliente | Inspección (CP-N106) | Must | Sí |

### RNF-200 · Mantenibilidad y calidad

| ID | Categoría | Requisito | Métrica y umbral | Cómo se verifica | Prioridad | Alcance |
|---|---|---|---|---|---|---|
| RNF-201 | Mantenibilidad | El código está tipado estáticamente y sin errores de tipo. | **0** errores del verificador de tipos | Pipeline (CP-N201) | Must | Sí |
| RNF-202 | Mantenibilidad | Toda regla de aislamiento y de negocio tiene prueba automatizada. | **100 %** de requisitos `Must` de alcance `Sí` con al menos un caso en verde | Pipeline y matriz del plan de pruebas (CP-N202) | Must | Sí |
| RNF-203 | Mantenibilidad | Cada integración al ramal principal ejecuta el pipeline y un fallo la bloquea. | **100 %** de integraciones con pipeline ejecutado · **0** publicaciones sin pipeline aprobado | Configuración del pipeline (CP-N203) | Must | Sí |
| RNF-204 | Mantenibilidad | Los errores se devuelven en formato uniforme y con códigos estables. | **100 %** de respuestas de error en Problem Details (RFC 9457) con un código del catálogo del contrato | Prueba de contrato (CP-N204) | Must | Sí |
| RNF-205 | Mantenibilidad | La entrada de toda operación de escritura se valida antes de tocar la base de datos. | **100 %** de cuerpos inválidos responden `400` con detalle por campo y **sin efectos secundarios** | Prueba de contrato (CP-N205) | Must | Sí |
| RNF-206 | Mantenibilidad | Las decisiones estructurales quedan registradas con alternativas y consecuencias. | **1** ADR por cada decisión estructural | Inspección (CP-N206) | Must | Sí |
| RNF-207 | Mantenibilidad | Los servicios de dominio del servidor están cubiertos por pruebas. | Cobertura de líneas **≥ 80 %** | Informe de cobertura en el pipeline (CP-N207) | Must | Sí |
| RNF-208 | Seguridad | Las dependencias no tienen vulnerabilidades conocidas graves. | **0** vulnerabilidades críticas o altas | Auditoría de dependencias en el pipeline (CP-N208) | Must | Sí |

### RNF-300 · Despliegue, operación y costo

| ID | Categoría | Requisito | Métrica y umbral | Cómo se verifica | Prioridad | Alcance |
|---|---|---|---|---|---|---|
| RNF-301 | Operación | El backend se despliega sin administrar servidores. | **0** servidores que aprovisionar u operar | Inspección del despliegue (CP-N301) | Must | Sí |
| RNF-302 | Costo | El costo de infraestructura es proporcional al uso, sin costo fijo por organización. | **USD 0** de costo fijo por organización en la capa gratuita · escalado a cero sin tráfico | Inspección (CP-N302) · objetivo complementario 6 | Must | Sí |
| RNF-303 | Operación | La configuración por entorno se realiza sin modificar el código. | **0** cambios de código para pasar de *staging* a producción | Inspección (CP-N303) | Must | Sí |
| RNF-304 | Operación | El esquema evoluciona mediante migraciones versionadas reproducibles. | Base reconstruida desde cero aplicando el **100 %** de las migraciones en orden | Reconstrucción antes de cada hito (CP-N304) | Must | Sí |
| RNF-305 | Operación | La publicación en *staging* y producción es automática tras el pipeline. | Rama `main` → *staging* · rama `release` → producción · **0** publicaciones sin pipeline aprobado | Inspección de la configuración (CP-N305) | Should | Sí |

### RNF-400 · Usabilidad y compatibilidad

| ID | Categoría | Requisito | Métrica y umbral | Cómo se verifica | Prioridad | Alcance |
|---|---|---|---|---|---|---|
| RNF-401 | Usabilidad | El cambio de organización y de taller está disponible sin cerrar sesión. | **0** reautenticaciones al cambiar de contexto · flujo T1 en verde | Contrato desde el cliente y extremo a extremo (CP-N401) | Must | Sí |
| RNF-402 | Compatibilidad | La interfaz es utilizable en navegador de escritorio y móvil. | **0** desbordamientos horizontales a **360 px** y **1280 px** en las pantallas del corte vertical, en los motores **Chromium** y **WebKit** | Auditoría con Playwright (CP-N402) | Must | Sí |
| RNF-403 | Compatibilidad | La aplicación es instalable como PWA. | Manifiesto con nombre, iconos de **192 px** y **512 px**, `start_url` y `display: standalone` · *service worker* registrado | Auditoría con Playwright (CP-N403) | Should | Sí |
| RNF-404 | Usabilidad | El cambio de contexto resulta operable por un usuario del rubro sin formación previa. | Tasa de éxito **≥ 80 %** por tarea · puntuación SUS **≥ 68** (Brooke, 1996, en la versión en español validada por Sevilla-González et al., 2020; baremo de Bangor et al., 2008) con **α > 0,8** | Evaluación con operadores, objetivo complementario 5 (CP-N404.1 a CP-N404.3) | Should | Sí |
| RNF-405 | Compatibilidad | La interfaz cumple los criterios de accesibilidad aplicables a las pantallas del corte vertical. | **0** incumplimientos graves o críticos de **WCAG 2.1 nivel AA** en las pantallas del corte vertical | Auditoría automatizada en el ejecutor extremo a extremo (CP-N405) | Should | Sí |

### RNF-500 · Rendimiento *(fuera de alcance)*

| ID | Categoría | Requisito | Nota | Alcance |
|---|---|---|---|---|
| RNF-501 | Rendimiento | Las operaciones habituales responden en un tiempo aceptable para uso interactivo. | Rendimiento, disponibilidad y escalabilidad se especifican **cuando el dominio lo justifica**, y este no lo hace: es un sistema de gestión interna de talleres, sin tráfico masivo ni exigencia de latencia estricta. Fijar un umbral inflaría el alcance sin aportar valor. Se documenta como criterio cualitativo | No |

---

## 5. Requisitos de seguridad

Atraviesan todas las capas y son bloqueantes para exponer el entorno de producción a operadores.

| Aspecto | Especificación | Requisitos |
|---|---|---|
| **Autenticación** | Credencial de sesión emitida por el proveedor de identidad —JWT firmado (RFC 7519)— y verificada en cada petición; el servidor no emite credenciales propias | RF-102, RF-103, ADR-004 |
| **Expiración de sesiones** | Credencial de acceso de corta duración, renovada automáticamente mediante una credencial de renovación rotativa gestionada por el proveedor; una credencial expirada responde `401 auth.invalid_token` | RF-102, RF-103 |
| **Autorización** | Control de acceso basado en roles **por organización** —`Owner`, `Receptionist`, `Mechanic`— verificado en la aplicación, más políticas de seguridad a nivel de fila en el motor | RF-406, RF-505, RF-609, RNF-101, RNF-102 |
| **Protección de datos** | TLS en tránsito; cifrado en reposo provisto por el proveedor de datos (AES-256 —declaración verificada el 14 de septiembre de 2026—, según su [declaración de seguridad](https://supabase.com/security)); datos personales mínimos —nombre, correo y teléfono de contacto—; credencial privilegiada solo en el servidor | RNF-103, RNF-104 |
| **Trazabilidad** | Registro de las seis acciones críticas con autor, acción y fecha; de solo inserción; **retención mientras exista la organización** | RF-703, RF-704, RN-15 |
| **Superficie de exposición** | **Públicos**: registro de cuenta y comprobación de disponibilidad. **Autenticados**: todo lo demás. **Internos**: búsqueda de cuentas por correo y funciones atómicas, invocables solo por el servidor. **Orígenes permitidos**: solo los del cliente web en *staging* y producción. Un límite de tasa propio sobre el registro exige estado compartido entre funciones efímeras y queda fuera del alcance ([Seguridad](06-seguridad.md), «Fuera del alcance») | RNF-106, ADR-007, ADR-008 |

La realización técnica de cada punto está en [Seguridad](06-seguridad.md) y [Arquitectura](04-arquitectura.md).

---

## 6. Priorización y MVP

El **MVP** lo componen los requisitos funcionales `Must` **más** los no funcionales que bloquean la salida a producción: un requisito no funcional bloqueante pesa tanto como una funcionalidad crítica.

| Clase | Requisitos |
|---|---|
| **MVP — funcionales `Must`** | RF-101 a RF-104, RF-201 a RF-203, RF-301 a RF-303, RF-401 a RF-406, RF-501 a RF-504, RF-601 a RF-606, RF-701, RF-702 |
| **MVP — no funcionales bloqueantes** | RNF-101 a RNF-106 (seguridad), RNF-201 a RNF-205 y RNF-207 (calidad), RNF-208 (dependencias), RNF-301 a RNF-304 (operación), RNF-401 y RNF-402 (usabilidad y compatibilidad) |
| **`Should`** | RF-204, RF-304, RF-305, RF-407, RF-505, RF-607, RF-609, RF-703, RF-704, RNF-305, RNF-403, RNF-404, RNF-405 |
| **`Could`** | RF-608 |
| **`Won't` (este período)** | RF-801 a RF-808, RNF-501 |

RNF-206 es `Must` como práctica de documentación, pero no bloquea la salida a producción. RNF-404 es `Should` de forma deliberada: la hipótesis del proyecto es sobre el **aislamiento**, y la usabilidad se evalúa en un objetivo complementario descartable.

---

## 7. Trazabilidad requisito → objetivo → componente

Cada requisito se rastrea **hacia atrás** hasta el objetivo específico que lo especifica, construye o valida, y **hacia adelante** hasta el componente de arquitectura que lo materializa ([Arquitectura](04-arquitectura.md)). Un requisito sin objetivo es alcance no problematizado; un objetivo sin requisitos, un objetivo no materializado.

| Requisitos | Objetivos | Componente de arquitectura |
|---|---|---|
| RF-101 a RF-104 | O2 especifica · O3 construye · O4 valida RF-103 | Módulo de identidad · middleware de autenticación · función atómica de registro |
| RF-201 a RF-204 | O2 · O3 | Módulo de organizaciones · middleware de contexto activo |
| RF-301 a RF-305 | O2 · O3 | Módulo de talleres · middleware de contexto activo |
| RF-401 a RF-407 | O2 · O3 | Módulo de miembros · índice único parcial del propietario |
| RF-501 a RF-505 | O2 · O3 · O4 valida RF-502 | Módulo de clientes |
| RF-601 a RF-609 | O2 · O3 · O4 valida RF-602 | Módulo de inventario · funciones atómicas de movimiento y transferencia |
| RF-701, RF-702 | O2 · O3 · **O4** | Políticas de seguridad a nivel de fila · funciones de verificación de membresía · verificación de membresía de la aplicación · cliente de datos de la petición |
| RF-703, RF-704 | O2 · O3 · O4 valida RF-704 | Módulo de auditoría · política de lectura del propietario |
| RNF-101 a RNF-106 | O2 · O3 · **O4** | Políticas del motor · middlewares · reparto de clientes de datos (ADR-008) |
| RNF-201 a RNF-208 | O3 | Pipeline de integración continua |
| RNF-301 a RNF-305 | O3 · O6 evalúa RNF-302 | Despliegue en Vercel y Supabase |
| RNF-401 a RNF-403 y RNF-405 | O3 · O5 evalúa RNF-401 | Cliente web: selectores de contexto, manifiesto y accesibilidad |
| RNF-404 | **O5** | Evaluación con operadores |

El objetivo 1 no genera requisitos propios: **fundamenta** RNF-101, RNF-102, la línea base de la validación y el alcance funcional.

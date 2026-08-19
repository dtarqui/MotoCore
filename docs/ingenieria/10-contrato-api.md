# Contrato de la interfaz de programación

Especificación normativa de la interfaz que expone el sistema. Traduce los requisitos ([02-requisitos.md](02-requisitos.md)) y las decisiones ya tomadas —contexto por cabecera (ADR-005), identidad delegada (ADR-004), formato de error uniforme (RNF-204)— en un contrato verificable.

> Terminología: [Glosario](01-glosario.md) · Estructura: [Arquitectura](04-arquitectura.md) · Entidades: [Modelo de datos](05-modelo-datos.md) · Autorización: [Seguridad](06-seguridad.md) · Casos de prueba: [Plan de pruebas](11-plan-pruebas.md)
>
> **Este documento especifica, no describe.** Define la interfaz que el sistema debe ofrecer; no registra el estado de avance de su construcción. Cuando la implementación difiera de lo aquí fijado, es la implementación la que se corrige.

---

## 1. Principios del contrato

Cuatro principios, cada uno heredado de una decisión anterior. Ninguna regla de este documento puede contradecirlos.

| Principio | Origen | Consecuencia en la interfaz |
|---|---|---|
| **Ausencia de estado** | Estilo REST (marco teórico §3.2.1) | Cada petición porta todo lo necesario para ser atendida. El servidor no conserva contexto entre llamadas, ni siquiera la organización sobre la que se opera. |
| **Contexto explícito** | ADR-005 | La organización y el taller activos viajan en cabeceras. El servidor **nunca** asume un valor por defecto. |
| **Identidad verificada, no emitida** | ADR-004 | La interfaz no expone registro de sesión ni renovación de credenciales: solo **verifica** la credencial que recibe. |
| **Error uniforme** | RNF-204 | Toda respuesta de error usa Problem Details con un código estable `modulo.razon`. |

---

## 2. Convenciones

### 2.1 Autenticación

Toda operación exige una credencial de sesión válida en la cabecera `Authorization`, con el esquema `Bearer`. Se exceptúan únicamente el registro de cuenta (RF-101) y la comprobación de disponibilidad del servicio.

| Situación | Estado | Código |
|---|---|---|
| Cabecera `Authorization` ausente | `401` | `auth.missing_token` |
| Credencial inválida, expirada o revocada | `401` | `auth.invalid_token` |

El inicio de sesión, la renovación de la sesión, la confirmación de correo y la recuperación de contraseña (RF-102) ocurren **contra el proveedor de identidad**, no contra esta interfaz (ADR-004). La aplicación cliente obtiene allí la credencial y la presenta aquí en cada llamada (RF-103).

### 2.2 Contexto activo

| Cabecera | Contenido | Cuándo es obligatoria |
|---|---|---|
| `X-Org-Id` | Identificador de la **organización activa** | En toda operación sobre datos internos de una organización |
| `X-Workshop-Id` | Identificador del **taller activo** | En toda operación sobre entidades de **nivel taller** (inventario y sus movimientos) |

Reglas de validación, en este orden:

1. Si falta la cabecera exigida, la petición se rechaza —no se elige una organización ni un taller por defecto (ADR-005, RF-303).
2. `X-Org-Id` se valida contra la **membresía activa** del solicitante. Sin membresía activa no hay acceso (RF-701).
3. `X-Workshop-Id` se valida como **perteneciente a la organización activa**. Un taller de otra organización se trata como inexistente (RF-303, RNF-105).
4. El **rol** de la membresía determina si la operación concreta está permitida (RF-406, RF-505).

| Situación | Estado | Código |
|---|---|---|
| Falta `X-Org-Id` en una operación que lo exige | `400` | `organization.missing_active_org` |
| Falta `X-Workshop-Id` en una operación de nivel taller | `400` | `workshop.missing_active_workshop` |
| Sin membresía activa en la organización indicada | `403` | `organization.access_denied` |
| Membresía activa, pero el rol no habilita la operación | `403` | `<modulo>.insufficient_permissions` |
| El taller indicado no pertenece a la organización activa | `404` | `workshop.not_found` |

### 2.3 Regla de rutas

El identificador de la organización aparece en la ruta **solo cuando el recurso es la organización misma** dentro de la colección de la cuenta: `/api/organizations`, `/api/organizations/{orgId}` y su cambio de contexto. Todo recurso **interior** a una organización —talleres, miembros, clientes, inventario, auditoría— se dirige sin identificadores de contexto en la ruta y se resuelve por cabecera.

Es la aplicación literal de ADR-005: se descartó anidar la organización en la ruta de cada recurso (`/api/organizaciones/{id}/clientes`) porque acopla la estructura de rutas a la jerarquía. Admitir la ruta anidada para unos recursos y la cabecera para otros dejaría **dos** mecanismos de contexto conviviendo, y la validación dejaría de estar concentrada en un punto único.

### 2.4 Representación

- Los cuerpos de petición y de respuesta son JSON.
- Los campos de los cuerpos de petición y respuesta usan la misma grafía que el modelo de datos (`snake_case`), de modo que el contrato y el esquema hablen un solo vocabulario. Los **parámetros de consulta y los segmentos de ruta** son la excepción declarada: van en `camelCase` (`includeInactive`, `lowStock`, `{workshopId}`), por no corresponder a columnas del esquema.
- Las respuestas de colección devuelven la lista bajo una clave nombrada por el recurso en plural (`clients`, `workshops`, `parts`, `members`), nunca un arreglo desnudo: así la representación admite agregar metadatos sin romper a los consumidores.
- Los identificadores son UUID.
- Las marcas de tiempo se serializan en formato ISO 8601 con zona horaria.

### 2.5 Listados

| Parámetro | Aplica a | Efecto |
|---|---|---|
| `search` | Clientes, repuestos | Búsqueda parcial e insensible a mayúsculas sobre los campos identificatorios del recurso (RF-504) |
| `includeInactive` | Recursos con baja lógica | Incluye los registros dados de baja; por omisión se excluyen (RF-305, RF-504) |
| `lowStock` | Repuestos | Restringe a los repuestos en o por debajo del mínimo (RF-607) |

Ningún listado devuelve registros fuera del contexto activo, con independencia de los parámetros recibidos.

### 2.6 Métodos y códigos de estado

| Método | Uso | Éxito |
|---|---|---|
| `GET` | Consulta | `200` |
| `POST` | Creación de un recurso | `201` |
| `POST` sobre una sub-ruta de acción | Transición de estado explícita y auditable: `switch`, `deactivate`, `movements`, `transfer` | `200` (`201` si crea un registro nuevo) |
| `PATCH` | Modificación parcial de los campos de un recurso | `200` |
| `DELETE` | Revocación de un vínculo (membresía, asignación) | `204` |

Las transiciones de estado no se modelan como edición de un campo: la baja lógica de un taller o de un cliente es una acción con consecuencias de auditoría (RF-703), y el contrato la distingue de un `PATCH` ordinario.

**Excepción declarada: la revocación de un vínculo.** La remoción de un miembro y el retiro de una asignación a taller son también acciones auditadas y reversibles —reincorporar a alguien reactiva su membresía en lugar de duplicarla (§3.4)—, pero se exponen como `DELETE` y no como `POST /…/deactivate`. El motivo es que lo que se revoca no es el estado de un recurso propio, sino **la relación** entre una cuenta y una organización: `DELETE` sobre la membresía expresa esa semántica con exactitud, y la baja lógica es un detalle de cómo se conserva el historial, no lo que la operación significa. La regla general rige para las entidades; la excepción, para los vínculos.

| Estado | Significado en esta interfaz |
|---|---|
| `400` | Entrada inválida (RNF-205) o falta una cabecera de contexto obligatoria |
| `401` | Sin credencial válida (RF-103) |
| `403` | Credencial válida, pero sin membresía o sin rol suficiente |
| `404` | El recurso no existe **o no pertenece al contexto activo** (RNF-105) |
| `409` | La operación contradice una regla de negocio sobre el estado actual (duplicados, existencia insuficiente) |
| `500` | La operación falló por causa del servidor y **no dejó nada aplicado** — el caso previsto es el registro atómico interrumpido (§4) |

### 2.7 Formato de error

Toda respuesta de error sigue Problem Details (RFC 9457, que sustituye al RFC 7807), con el código estable `modulo.razon` como portador de la causa. El cuerpo lleva el tipo del problema, el código, el estado y un detalle legible; las respuestas de validación agregan el detalle **por campo**, para que el cliente pueda señalar el campo culpable sin interpretar el mensaje (RNF-205).

El código es la parte **estable** del contrato: el texto del detalle puede reformularse, el código no.

---

## 3. Recursos

En las tablas siguientes, la columna **Contexto** indica qué cabeceras son obligatorias además de la credencial: `—` ninguna, `Org` requiere `X-Org-Id`, `Org+Tal` requiere además `X-Workshop-Id`. La columna **Rol** indica el rol mínimo; `Miembro` significa cualquier rol con membresía activa.

### 3.1 Identidad y cuenta

| Método | Ruta | Contexto | Rol | Requisito | Resultado |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | — | *(sin credencial)* | RF-101 | Crea la cuenta, su primera organización, su primer taller y la membresía `owner`, **en un solo acto** (ADR-007) |
| `GET` | `/api/auth/me` | — | *(cuenta autenticada)* | RF-104, RF-202 | Perfil de la cuenta y lista de organizaciones donde tiene membresía activa, con el rol en cada una |

El registro es atómico: si cualquiera de los cuatro pasos falla, no queda ninguno aplicado (HU-01). La contraseña se valida antes de crear nada y nunca se persiste en el sistema (RNF-104).

### 3.2 Organizaciones

| Método | Ruta | Contexto | Rol | Requisito | Resultado |
|---|---|---|---|---|---|
| `GET` | `/api/organizations` | — | *(cuenta autenticada)* | RF-202 | Organizaciones de la cuenta **según membresía activa**, no según quién las creó |
| `POST` | `/api/organizations` | — | *(cuenta autenticada)* | RF-201 | Crea una organización; el solicitante queda como `owner` |
| `GET` | `/api/organizations/{orgId}` | — | Miembro | RF-202 | Datos de la organización |
| `PATCH` | `/api/organizations/{orgId}` | — | Owner | RF-204 | Modifica los datos de la organización. **Acción auditada** (RF-703) |
| `POST` | `/api/organizations/{orgId}/switch` | — | Miembro | RF-203 | Confirma la organización como activa y devuelve el rol del solicitante en ella |

`switch` no cambia estado en el servidor —no hay sesión que actualizar (§1)—: **valida** que la cuenta pueda operar sobre esa organización y devuelve el rol, para que el cliente guarde el contexto y lo envíe en las llamadas siguientes.

### 3.3 Talleres

| Método | Ruta | Contexto | Rol | Requisito | Resultado |
|---|---|---|---|---|---|
| `GET` | `/api/workshops` | Org | Miembro | RF-302 | Talleres de la organización activa |
| `POST` | `/api/workshops` | Org | Owner | RF-301 | Crea un taller |
| `GET` | `/api/workshops/{workshopId}` | Org | Miembro | RF-302 | Datos del taller |
| `PATCH` | `/api/workshops/{workshopId}` | Org | Owner | RF-301 | Modifica los datos del taller |
| `POST` | `/api/workshops/{workshopId}/deactivate` | Org | Owner | RF-305 | Baja lógica: deja de listarse como activo, su historial se conserva. **Acción auditada** (RF-703) |
| `GET` | `/api/workshops/{workshopId}/assignments` | Org | Miembro | RF-304 | Miembros asignados al taller |
| `POST` | `/api/workshops/{workshopId}/assignments` | Org | Owner | RF-304 | Asigna un miembro al taller |
| `DELETE` | `/api/workshops/{workshopId}/assignments/{userId}` | Org | Owner | RF-304 | Retira la asignación, sin afectar la membresía |

La asignación a talleres es **operativa**: no otorga ni restringe permisos, y no filtra lo que el miembro puede ver (ADR-006, decisión cerrada en [07-decisiones-diseno.md](07-decisiones-diseno.md)).

### 3.4 Miembros

| Método | Ruta | Contexto | Rol | Requisito | Resultado |
|---|---|---|---|---|---|
| `GET` | `/api/members` | Org | Miembro | RF-407 | Miembros de la organización activa, con rol y estado |
| `POST` | `/api/members/invite` | Org | Owner | RF-401, RF-402, RF-406 | Incorpora a una cuenta **existente** con rol `mechanic` o `receptionist`. **Acción auditada** (RF-703) |
| `PATCH` | `/api/members/{userId}/role` | Org | Owner | RF-403, RF-405 | Cambia el rol de un miembro. **Acción auditada** |
| `DELETE` | `/api/members/{userId}` | Org | Owner | RF-404, RF-405 | Revoca la membresía; el acceso se pierde de inmediato. **Acción auditada** |

Reglas de protección del propietario, exigibles en las tres operaciones de escritura (RF-402, RF-405):

- No se admite `owner` como rol de invitación ni como destino de un cambio de rol.
- El propietario de la organización no puede ser removido ni ver su rol modificado.
- Reincorporar a alguien removido antes **reactiva** su membresía con el nuevo rol, en lugar de duplicarla (HU-09).

La búsqueda de la cuenta por correo que exige la invitación se resuelve **solo en el servidor**, con credenciales privilegiadas: no se expone como operación consultable, para no ofrecer un mecanismo de enumeración de cuentas (RNF-106).

### 3.5 Clientes — nivel organización

| Método | Ruta | Contexto | Rol | Requisito | Resultado |
|---|---|---|---|---|---|
| `GET` | `/api/clients` | Org | Miembro | RF-502, RF-504 | Clientes de la organización activa, **con independencia del taller activo** |
| `POST` | `/api/clients` | Org | Owner, Receptionist | RF-501, RF-503, RF-505 | Registra un cliente en la organización activa |
| `GET` | `/api/clients/{clientId}` | Org | Miembro | RF-502 | Datos del cliente |
| `PATCH` | `/api/clients/{clientId}` | Org | Owner, Receptionist | RF-504, RF-505 | Modifica los datos de contacto |
| `POST` | `/api/clients/{clientId}/deactivate` | Org | Owner, Receptionist | RF-504 | Baja lógica: se excluye de los listados activos, el registro se conserva. **Acción auditada** (RF-703) |

Que estas operaciones **no** exijan `X-Workshop-Id` es deliberado y es lo que demuestra RF-502: el cliente pertenece a la organización, y su ausencia en el contrato es la evidencia del alcance por nivel. El correo es único por organización y no colisiona entre organizaciones distintas (RF-503): el duplicado dentro de la misma organización devuelve `409 client.duplicate_email`.

### 3.6 Inventario — nivel taller

| Método | Ruta | Contexto | Rol | Requisito | Resultado |
|---|---|---|---|---|---|
| `GET` | `/api/inventory/parts` | Org+Tal | Miembro | RF-602, RF-607 | Repuestos **del taller activo**; con `lowStock`, solo los que están en o bajo el mínimo |
| `POST` | `/api/inventory/parts` | Org+Tal | Owner, Receptionist | RF-601, RF-603, RF-609 | Registra un repuesto en el taller activo |
| `GET` | `/api/inventory/parts/{partId}` | Org+Tal | Miembro | RF-602 | Datos del repuesto |
| `PATCH` | `/api/inventory/parts/{partId}` | Org+Tal | Owner, Receptionist | RF-601, RF-609 | Modifica el catálogo del repuesto, **nunca su existencia** |
| `GET` | `/api/inventory/parts/{partId}/movements` | Org+Tal | Miembro | RF-604 | Historial de movimientos del repuesto |
| `POST` | `/api/inventory/parts/{partId}/movements` | Org+Tal | Miembro | RF-604, RF-605, RF-606 | Registra un movimiento y recalcula la existencia, **en una sola transacción** (ADR-007) |
| `POST` | `/api/inventory/parts/{partId}/transfer` | Org+Tal | Owner | RF-608, RF-609 | Transfiere existencias a otro taller de la misma organización |

Reglas que el contrato debe hacer cumplir:

- La existencia **solo** se modifica registrando un movimiento. `PATCH` sobre el repuesto no la altera: toda existencia debe poder reconstruirse desde su historial.
- Tipos registrables directamente: `compra`, `venta`, `ajuste`, `devolucion`, `merma`. El tipo `transferencia` **no se acepta** en esta operación: lo genera la transferencia entre talleres (RF-604).
- `compra` y `devolucion` suman; `venta` y `merma` restan; `ajuste` fija un valor absoluto (RF-605).
- Un movimiento que dejaría la existencia negativa se rechaza con `409 inventory.insufficient_stock` y **no** altera el stock (RF-606).
- Al crear un repuesto con existencia inicial mayor que cero se genera automáticamente su movimiento de entrada (HU-16).
- La transferencia genera dos movimientos vinculados —salida en origen, entrada en destino— en una sola transacción, y ambos talleres deben pertenecer a la misma organización (RF-608, ADR-007).
- El número de parte es único por taller; el duplicado devuelve `409 inventory.duplicate_part_number` (RF-603).

### 3.7 Auditoría

| Método | Ruta | Contexto | Rol | Requisito | Resultado |
|---|---|---|---|---|---|
| `GET` | `/api/audit` | Org | **Owner** | RF-703, RF-704 | Registro de acciones críticas de la organización activa, con autor, acción y fecha |

Es la única lectura de la interfaz reservada a un rol. La restricción **no** se sostiene solo aquí: se aplica también en el motor de base de datos, de modo que el acceso directo tampoco la eluda (RF-704, [05-modelo-datos.md](05-modelo-datos.md)).

El registro es de **solo inserción**: el contrato no expone ninguna operación de modificación ni de borrado sobre él.

---

## 4. Catálogo de códigos de error

Los códigos son parte estable del contrato. Un código nuevo se agrega; uno existente no cambia de significado.

| Código | Estado | Cuándo |
|---|---|---|
| `auth.missing_token` | `401` | Falta la credencial |
| `auth.invalid_token` | `401` | Credencial inválida o expirada |
| `auth.email_already_registered` | `409` | El correo ya tiene cuenta (RF-101) |
| `auth.registration_failed` | `500` | El registro no pudo completarse entero; no queda nada aplicado. No es `409`: no contradice ninguna regla de negocio sobre el estado actual, sino que la operación falló del lado del servidor |
| `organization.missing_active_org` | `400` | Falta `X-Org-Id` |
| `organization.access_denied` | `403` | Sin membresía activa en la organización indicada |
| `organization.insufficient_permissions` | `403` | El rol no habilita la operación sobre la organización |
| `organization.not_found` | `404` | La organización no existe o el solicitante no es miembro |
| `workshop.missing_active_workshop` | `400` | Falta `X-Workshop-Id` |
| `workshop.not_found` | `404` | El taller no existe o no pertenece a la organización activa |
| `workshop.duplicate_name` | `409` | Ya existe un taller con ese nombre en la organización (RF-301) |
| `workshop.insufficient_permissions` | `403` | Solo el `Owner` administra talleres |
| `member.not_found` | `404` | No hay cuenta con ese correo, o no es miembro de la organización (RF-401) |
| `member.already_active` | `409` | La persona ya es miembro activo |
| `member.owner_role_forbidden` | `403` | Se intentó invitar o promover a `owner` (RF-402) |
| `member.owner_protected` | `403` | Se intentó cambiar el rol del propietario o removerlo (RF-405) |
| `member.insufficient_permissions` | `403` | Solo el `Owner` gestiona miembros (RF-406) |
| `client.not_found` | `404` | El cliente no existe o pertenece a otra organización |
| `client.duplicate_email` | `409` | Correo repetido dentro de la organización (RF-503) |
| `client.insufficient_permissions` | `403` | El rol no permite crear ni modificar clientes (RF-505) |
| `inventory.part_not_found` | `404` | El repuesto no existe o pertenece a otro taller |
| `inventory.duplicate_part_number` | `409` | Número de parte repetido en el taller (RF-603) |
| `inventory.invalid_movement_type` | `400` | Tipo de movimiento no registrable directamente (RF-604) |
| `inventory.invalid_quantity` | `400` | Cantidad ausente, nula o negativa |
| `inventory.insufficient_stock` | `409` | El movimiento dejaría la existencia en negativo (RF-606) |
| `inventory.cross_organization_transfer` | `403` | Destino de transferencia fuera de la organización (RF-608) |
| `inventory.same_workshop_transfer` | `400` | Origen y destino son el mismo taller |
| `inventory.insufficient_permissions` | `403` | El rol no permite administrar el catálogo ni transferir (RF-609) |
| `audit.insufficient_permissions` | `403` | Solo el `Owner` consulta la auditoría (RF-704) |
| `validation.invalid_body` | `400` | La entrada no satisface el esquema; el detalle acompaña por campo (RNF-205) |

---

## 5. Reglas de no divulgación

La elección entre `403` y `404` no es estilística: comunica —o no— la existencia de datos ajenos. La regla es una sola: **el error revela como mucho lo que el solicitante ya tiene derecho a saber** (RNF-105).

| Situación | Respuesta | Por qué |
|---|---|---|
| Contexto de una organización donde no hay membresía | `403 organization.access_denied` | El solicitante declaró operar sobre esa organización; negarle el acceso no revela nada que no haya afirmado él mismo |
| Recurso de **otra** organización, estando autenticado en la propia | `404` del módulo correspondiente | Un `403` confirmaría que ese identificador existe en alguna parte. La respuesta debe ser indistinguible de la de un recurso inexistente |
| Taller de otra organización en `X-Workshop-Id` | `404 workshop.not_found` | Mismo motivo |
| Miembro activo, rol insuficiente | `403 <modulo>.insufficient_permissions` | El recurso está dentro de su organización: su existencia no es información privilegiada, solo la operación lo es |
| Credenciales de inicio de sesión incorrectas | Error genérico, sin indicar el campo | No revela si el correo tiene cuenta (HU-02) |
| Invitación a un correo sin cuenta | `404 member.not_found` | El sistema informa que no puede invitarlo, sin exponer la búsqueda de cuentas como operación (RNF-106) |

**Prueba de la regla**: para un identificador cualquiera, la respuesta de un recurso ajeno y la de un recurso inexistente deben ser idénticas en estado, código y cuerpo. Su verificación está en [11-plan-pruebas.md](11-plan-pruebas.md).

---

## 6. Evolución del contrato

- **Lo estable**: las rutas, los métodos, los códigos de error y el significado de los estados. Un cambio en cualquiera de ellos rompe a los consumidores.
- **Lo ampliable sin ruptura**: agregar campos opcionales a una respuesta, agregar parámetros de listado con valor por omisión, y agregar códigos de error nuevos para situaciones antes no distinguidas.
- **Lo prohibido sin decisión registrada**: cambiar el significado de un código existente, mover el contexto activo de la cabecera a la ruta, o exponer desde el cliente una operación reservada al servidor. Los tres contradicen decisiones vigentes (ADR-005, RNF-103, RNF-106) y exigirían un ADR nuevo, no un ajuste de este documento.

Las entidades de los módulos fuera del alcance (RF-800) se incorporarán siguiendo estas mismas reglas: nivel organización o nivel taller según el criterio del [Glosario](01-glosario.md), contexto por cabecera y códigos `modulo.razon`. El contrato está diseñado para admitirlas sin modificar lo ya especificado.

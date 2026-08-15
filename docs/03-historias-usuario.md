# Historias de usuario

Historias organizadas por épica, con criterios de aceptación verificables y trazabilidad a los requisitos ([Requisitos](02-requisitos.md)).

> Solo se detallan las historias **dentro del alcance** del proyecto de grado. Las funcionalidades excluidas (§1.8.3) están en `requisitos.md` como RF-800.

## Actores

| Actor | Descripción |
|---|---|
| **Propietario** (`Owner`) | Administra una o varias empresas: crea sucursales, gestiona miembros y roles. |
| **Recepcionista** (`Receptionist`) | Atiende al cliente: lo registra y consulta su información. |
| **Mecánico** (`Mechanic`) | Trabajo técnico; consulta clientes e inventario de su sucursal. |

Los roles se nombran en inglés en el sistema (ver [Glosario](01-glosario.md)); aquí se usa la traducción para legibilidad de la narrativa.

## Estimación

Escala de puntos de historia (Fibonacci): `1` trivial · `2` sencilla · `3` moderada · `5` compleja · `8` muy compleja, candidata a dividirse.

---

## Épica 1 — Acceso y cuenta

### HU-01 · Registro con creación de empresa
**Como** propietario de un taller
**quiero** registrarme y que el sistema cree mi empresa y mi primera sucursal en un solo paso
**para** empezar a operar sin configuración adicional.

*Requisitos*: RF-101 · *Puntos*: 5

**Criterios de aceptación**
- Dado un email no registrado, cuando envío el formulario con nombre de empresa, entonces se crean la cuenta, la empresa, una sucursal inicial y mi membresía como `Owner`.
- Dado un email ya registrado, cuando intento registrarme, entonces recibo un error indicando que la cuenta ya existe y no se crea ninguna empresa.
- Dado un fallo al crear la empresa, entonces la cuenta no queda creada a medias (la operación no deja registros huérfanos).
- Dada una contraseña de menos de 8 caracteres, entonces la petición se rechaza indicando el campo inválido.

### HU-02 · Inicio de sesión
**Como** usuario registrado
**quiero** iniciar sesión y mantener la sesión activa
**para** trabajar sin volver a autenticarme constantemente.

*Requisitos*: RF-102, RF-103 · *Puntos*: 2

**Criterios de aceptación**
- Dadas credenciales válidas, obtengo acceso y el sistema reconoce mi identidad en las peticiones siguientes.
- Dadas credenciales inválidas, recibo un error de autenticación sin detalle sobre cuál campo falló.
- Dada una petición sin credenciales a un recurso protegido, recibo `401`.
- Dada una sesión próxima a expirar, esta se renueva sin que yo intervenga.

### HU-03 · Ver mi perfil y mis empresas
**Como** usuario autenticado
**quiero** ver mis datos y la lista de empresas a las que pertenezco con mi rol en cada una
**para** saber dónde puedo trabajar y con qué permisos.

*Requisitos*: RF-104, RF-202 · *Puntos*: 2

**Criterios de aceptación**
- Veo mi perfil y todas las empresas donde tengo membresía **activa**.
- Cada empresa muestra el rol que tengo en ella.
- Una empresa donde fui removido deja de aparecer.
- Aparecen tanto las empresas que creé como aquellas a las que fui invitado.

---

## Épica 2 — Gestión de empresas y sucursales

### HU-04 · Crear una empresa adicional
**Como** propietario con más de un negocio
**quiero** crear otra empresa bajo la misma cuenta
**para** administrarlas sin manejar credenciales separadas.

*Requisitos*: RF-201 · *Puntos*: 3

**Criterios de aceptación**
- Al crear una empresa quedo automáticamente como su `Owner`.
- La nueva empresa aparece en mi listado junto a las anteriores.
- Los datos de una empresa no son visibles desde otra, aun siendo yo el propietario de ambas.

### HU-05 · Cambiar de empresa activa
**Como** propietario de varias empresas
**quiero** cambiar entre ellas sin cerrar sesión
**para** operar sobre la que necesito en cada momento.

*Requisitos*: RF-203 · *Puntos*: 3

**Criterios de aceptación**
- Al seleccionar una empresa, el sistema confirma el cambio e informa mi rol en ella.
- Las operaciones posteriores afectan únicamente a la empresa seleccionada.
- Si intento activar una empresa donde no tengo membresía, recibo un error de autorización.

### HU-06 · Crear y administrar sucursales
**Como** propietario
**quiero** registrar las sucursales de mi empresa
**para** organizar la operación por local.

*Requisitos*: RF-301, RF-302, RF-305 · *Puntos*: 5

**Criterios de aceptación**
- Puedo crear una sucursal indicando nombre, dirección y teléfono.
- El listado muestra solo las sucursales de la empresa activa.
- Puedo desactivar una sucursal: deja de aparecer como activa, pero su información histórica se conserva.
- Un usuario que no es `Owner` recibe error de permisos al intentar crear o desactivar.

### HU-07 · Cambiar de sucursal activa
**Como** usuario que trabaja en una empresa con varios locales
**quiero** seleccionar la sucursal en la que estoy operando
**para** que las órdenes y el inventario correspondan al local correcto.

*Requisitos*: RF-303 · *Puntos*: 3

**Criterios de aceptación**
- Puedo seleccionar cualquier sucursal activa de la empresa activa.
- Si envío una sucursal que pertenece a otra empresa, la operación se rechaza.
- Las operaciones de nivel sucursal sin sucursal activa seleccionada se rechazan con un mensaje claro.

### HU-08 · Asignar miembros a sucursales
**Como** propietario
**quiero** indicar en qué sucursal trabaja cada miembro
**para** organizar al equipo y poder reportar por local.

*Requisitos*: RF-304 · *Puntos*: 3

**Criterios de aceptación**
- Puedo asignar un miembro a una o varias sucursales de mi empresa.
- La asignación **no** cambia lo que el miembro puede ver: sus permisos siguen dependiendo de su rol.
- Puedo quitar una asignación sin afectar la membresía del usuario.

---

## Épica 3 — Equipo y permisos

### HU-09 · Invitar a un miembro
**Como** propietario
**quiero** invitar a alguien a mi empresa con un rol
**para** que trabaje conmigo con los permisos adecuados.

*Requisitos*: RF-401, RF-402, RF-406 · *Puntos*: 5

**Criterios de aceptación**
- Puedo invitar por email a una cuenta existente asignándole `Mechanic` o `Receptionist`.
- No puedo invitar a alguien como `Owner`.
- Si el email no corresponde a ninguna cuenta, recibo un error indicándolo.
- Si la persona ya es miembro activo, recibo un error de duplicado.
- Si fue removida antes, la invitación reactiva su membresía con el nuevo rol.
- Un `Mechanic` o `Receptionist` que intenta invitar recibe error de permisos.

### HU-10 · Cambiar el rol de un miembro
**Como** propietario
**quiero** modificar el rol de un miembro
**para** ajustar sus permisos cuando cambian sus responsabilidades.

*Requisitos*: RF-403, RF-405 · *Puntos*: 3

**Criterios de aceptación**
- Puedo cambiar entre `Mechanic` y `Receptionist`.
- No puedo cambiar el rol del `Owner` de la empresa.
- El cambio tiene efecto inmediato sobre lo que ese miembro puede hacer.

### HU-11 · Remover a un miembro
**Como** propietario
**quiero** quitar a alguien de mi empresa
**para** revocar su acceso cuando deja de trabajar conmigo.

*Requisitos*: RF-404, RF-405 · *Puntos*: 3

**Criterios de aceptación**
- Tras removerlo, el usuario deja de ver la empresa y sus datos.
- No puedo remover al `Owner` de la empresa.
- La acción queda registrada en la auditoría.

### HU-12 · Ver el equipo
**Como** miembro de una empresa
**quiero** ver quiénes la integran y con qué rol
**para** saber a quién dirigirme.

*Requisitos*: RF-407 · *Puntos*: 2

**Criterios de aceptación**
- Veo la lista de miembros con nombre, email, rol y estado.
- Solo veo miembros de la empresa activa.

---

## Épica 4 — Clientes *(demostración de nivel empresa)*

### HU-13 · Registrar un cliente
**Como** recepcionista
**quiero** registrar a un cliente
**para** poder asociarle servicios después.

*Requisitos*: RF-501, RF-503, RF-505 · *Puntos*: 3

**Criterios de aceptación**
- Puedo registrar un cliente con nombre, email y teléfono.
- Si el email ya existe en esta empresa, la operación se rechaza.
- El mismo email puede existir en otra empresa sin conflicto.
- Un `Mechanic` que intenta registrar recibe error de permisos.

### HU-14 · Consultar clientes desde cualquier sucursal
**Como** recepcionista de una sucursal
**quiero** ver los clientes de toda la empresa
**para** atender a alguien que fue registrado en otro local.

*Requisitos*: RF-502 · *Puntos*: 3

**Criterios de aceptación**
- Un cliente registrado con la sucursal A activa aparece al operar con la sucursal B de la misma empresa.
- Un cliente de otra empresa **no** aparece en ningún caso.
- Puedo buscar por nombre o email dentro de la empresa activa.

### HU-15 · Editar y dar de baja un cliente
**Como** recepcionista
**quiero** corregir los datos de un cliente o darlo de baja
**para** mantener la información al día.

*Requisitos*: RF-504 · *Puntos*: 2

**Criterios de aceptación**
- Puedo editar los datos de contacto.
- Al dar de baja, el cliente desaparece de los listados activos pero su registro se conserva.
- No puedo editar clientes de otra empresa.

---

## Épica 5 — Inventario *(demostración de nivel sucursal)*

### HU-16 · Registrar un repuesto en mi sucursal
**Como** recepcionista
**quiero** registrar un repuesto con su stock inicial
**para** llevar el control de existencias de mi local.

*Requisitos*: RF-601, RF-603 · *Puntos*: 3

**Criterios de aceptación**
- El repuesto queda asociado a la sucursal activa.
- El número de parte no puede repetirse dentro de la misma sucursal.
- El mismo número de parte sí puede existir en otra sucursal de la empresa.
- Si registro con stock inicial mayor a cero, se genera automáticamente un movimiento de entrada.

### HU-17 · Ver solo el inventario de mi sucursal
**Como** mecánico
**quiero** ver las existencias de mi local
**para** saber con qué cuento sin confundirme con otra sucursal.

*Requisitos*: RF-602 · *Puntos*: 3

**Criterios de aceptación**
- El listado muestra únicamente repuestos de la sucursal activa.
- Un repuesto de otra sucursal de la misma empresa no aparece.
- Un repuesto de otra empresa no aparece bajo ninguna circunstancia.

### HU-18 · Registrar movimientos de stock
**Como** recepcionista
**quiero** registrar entradas y salidas de repuestos
**para** que la existencia refleje la realidad del local.

*Requisitos*: RF-604, RF-605, RF-606 · *Puntos*: 5

**Criterios de aceptación**
- Puedo registrar compra, venta, ajuste, devolución y merma.
- Compra, devolución y transferencia de entrada suman; venta y merma restan; el ajuste fija la existencia en un valor absoluto.
- Cada movimiento guarda la existencia anterior y la resultante.
- Un movimiento que dejaría la existencia negativa se rechaza y no altera el stock.
- Los movimientos no se pueden editar ni borrar: son historial.

### HU-19 · Detectar repuestos con bajo stock
**Como** propietario
**quiero** ver qué repuestos están en o por debajo del mínimo
**para** reponer a tiempo.

*Requisitos*: RF-607 · *Puntos*: 2

**Criterios de aceptación**
- El listado incluye los repuestos cuya existencia es menor o igual al mínimo definido.
- Solo considera la sucursal activa.

### HU-20 · Transferir stock entre sucursales
**Como** propietario
**quiero** mover repuestos de una sucursal a otra
**para** cubrir faltantes sin comprar de nuevo.

*Requisitos*: RF-608 · *Puntos*: 5 · *Prioridad*: `Could`

**Criterios de aceptación**
- La transferencia descuenta en la sucursal de origen y suma en la de destino.
- Ambas sucursales deben pertenecer a la misma empresa.
- Si el origen no tiene existencia suficiente, la operación se rechaza completa (no queda a medias).

---

## Épica 6 — Aislamiento y trazabilidad *(transversal)*

### HU-21 · Garantía de aislamiento entre empresas
**Como** propietario
**quiero** tener la certeza de que ninguna otra empresa puede ver mis datos
**para** confiar en la plataforma con información de mi negocio.

*Requisitos*: RF-701, RF-702, RNF-101, RNF-102 · *Puntos*: 8

**Criterios de aceptación**
- Una cuenta sin membresía en mi empresa recibe error de autorización en cualquier operación sobre mis datos.
- Aun accediendo directamente a la base de datos con otra identidad, las consultas no devuelven mis filas.
- El aislamiento se mantiene aunque la verificación de la capa de aplicación se omita.
- Existe una prueba automatizada que demuestra cada uno de los puntos anteriores.

### HU-22 · Registro de acciones críticas
**Como** propietario
**quiero** un registro de los cambios sensibles
**para** saber quién hizo qué y cuándo.

*Requisitos*: RF-703 · *Puntos*: 3

**Criterios de aceptación**
- Cambios de rol, remociones de miembros y bajas quedan registrados con autor, acción y fecha.
- El registro sobrevive a la eliminación de la entidad o del usuario referenciado.
- Solo el `Owner` puede consultarlo.

---

## Resumen

| Épica | Historias | Puntos |
|---|---|---|
| 1 · Acceso y cuenta | HU-01 a HU-03 | 9 |
| 2 · Empresas y sucursales | HU-04 a HU-08 | 17 |
| 3 · Equipo y permisos | HU-09 a HU-12 | 13 |
| 4 · Clientes (nivel empresa) | HU-13 a HU-15 | 8 |
| 5 · Inventario (nivel sucursal) | HU-16 a HU-20 | 18 |
| 6 · Aislamiento y trazabilidad | HU-21, HU-22 | 11 |
| **Total** | **22 historias** | **76 puntos** |

La distribución por fases y el cronograma están en [Plan de trabajo](08-plan-trabajo.md).

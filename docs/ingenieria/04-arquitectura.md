# Arquitectura

Diseño arquitectónico del sistema. Responde a los requisitos especificados en [02-requisitos.md](02-requisitos.md); las decisiones que lo sustentan están registradas en [07-decisiones-diseno.md](07-decisiones-diseno.md).

> Terminología: [01-glosario.md](01-glosario.md) · Interfaz que expone esta arquitectura: [10-contrato-api.md](10-contrato-api.md)

## Visión general

El sistema se diseña como una aplicación web multiorganización desplegada sobre infraestructura **serverless**, con el aislamiento de datos aplicado en el propio motor de base de datos.

```text
Interfaz de usuario (aplicación web)
        |
        |  REST + credencial de sesión + contexto activo (organización / taller)
        v
Servicios de aplicación (funciones serverless)
        |
        v
Base de datos relacional + proveedor de identidad + seguridad a nivel de fila
```

La interfaz de usuario se autentica directamente contra el proveedor de identidad; los servicios de aplicación únicamente **verifican** la credencial recibida y no emiten ni almacenan credenciales propias (ADR-004).

## Modelo multiorganización jerárquico

La jerarquía tiene dos niveles y **un solo límite de seguridad**:

```
Cuenta ──membresía(rol)──> Organización   ← unidad de aislamiento
                              └── Taller   ← subdivisión operativa
```

- La **organización** es la unidad de aislamiento. Toda entidad de negocio la referencia.
- Una cuenta puede pertenecer a **varias organizaciones**, con un rol distinto en cada una.
- Una organización puede tener **varios talleres**. El taller determina *dónde* ocurre una operación, no *quién* puede verla: no constituye una segunda frontera de seguridad (ADR-006).
- El contexto activo —organización y, cuando corresponde, taller— se indica explícitamente en cada petición y se valida contra la membresía (ADR-005).
- El registro de una cuenta crea su primera organización, su primer taller y la membresía con rol propietario.

Qué dato pertenece a qué nivel está fijado en el [Glosario](01-glosario.md). Las entidades de nivel taller referencian **tanto** al taller como a la organización, de modo que las políticas de aislamiento se evalúan siempre sobre un único criterio. El modelo completo está en [05-modelo-datos.md](05-modelo-datos.md).

## Aislamiento de datos: defensa en profundidad

Dos capas independientes, ambas obligatorias (detalle en [06-seguridad.md](06-seguridad.md)):

1. **Seguridad a nivel de fila en el motor de base de datos** — las políticas exigen que quien consulta tenga una membresía activa en la organización propietaria del registro. Actúa aunque la capa de aplicación falle u omita un filtro.
2. **Verificación de membresía en la capa de aplicación** — cada operación valida la membresía y, cuando corresponde, el rol, antes de actuar, y devuelve un error de negocio específico.

Esta redundancia responde a que la seguridad a nivel de fila, aun siendo un control efectivo, no está exenta de vías de fuga indirectas ni de errores en la aplicación de políticas — evidencia documentada en el estado del arte ([anteproyecto/02-antecedentes-y-estado-del-arte.md](../anteproyecto/02-antecedentes-y-estado-del-arte.md)).

## Capas y responsabilidades

| Capa | Responsabilidad |
|---|---|
| **Interfaz de usuario** | Presentación, autenticación contra el proveedor de identidad, y conservación del contexto activo (organización y taller) |
| **Servicios de aplicación** | Validación de la entrada, verificación de membresía y rol, reglas de negocio, y las operaciones privilegiadas que no pueden ejecutarse desde el cliente: alta de cuenta con su primera organización y taller, cálculo de existencias y registro de auditoría (ADR-007) |
| **Base de datos** | Persistencia, integridad referencial y aplicación de las políticas de aislamiento |
| **Proveedor de identidad** | Registro, inicio de sesión, renovación de sesión, confirmación de correo y recuperación de contraseña |

## Tecnologías seleccionadas

| Componente | Tecnología | Decisión |
|---|---|---|
| Lenguaje del servidor | Node.js con TypeScript | ADR-001 |
| Marco de la interfaz de programación | Hono | ADR-003 |
| Validación de entrada | Zod | — |
| Base de datos | PostgreSQL con seguridad a nivel de fila | ADR-002 |
| Identidad | Proveedor gestionado, integrado con la base de datos | ADR-004 |
| Interfaz de usuario | React con TypeScript | — |
| Pruebas | Vitest | — |
| Despliegue | Funciones serverless | ADR-001 |

Las filas con «—» en la columna de decisión no carecen de justificación: son selecciones **derivadas** de un ADR previo, no decisiones estructurales autónomas, y por eso no generan un ADR propio (RNF-206). Zod y Vitest se siguen de la elección de Node/TypeScript de ADR-001 —validación con inferencia de tipos y ejecutor de pruebas del mismo ecosistema—, y React se mantiene por continuidad de la interfaz existente, que la reescritura del backend no altera.

La definición formal de cada tecnología y la teoría que respalda su elección están en el [Marco teórico y conceptual](../anteproyecto/03-marco-teorico-y-conceptual.md): §3.1 para las definiciones, §3.2 para el fundamento y §3.3 para las limitaciones asumidas.

## Integración continua

Cada integración al ramal principal ejecuta de forma automatizada la verificación estática de tipos y la suite de pruebas; un fallo impide la integración (RNF-203). El diseño del pipeline forma parte del objetivo específico 3. Qué se ejecuta en cada integración y qué exige un entorno real está en el [Plan de pruebas](11-plan-pruebas.md) §1.2.

## Alcance de plataformas

La plataforma soportada es **web**, con diseño responsivo para uso en escritorio y móvil (RNF-402) e instalable como aplicación web progresiva (RNF-403). Las aplicaciones nativas para móvil y escritorio están **fuera del alcance** del proyecto ([anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) §1.8.3).

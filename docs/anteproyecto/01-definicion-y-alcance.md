# 1. Definición y Alcance del Proyecto

## 1.1 Tema

**Título del proyecto**

> **Diseño y validación de una arquitectura multi-tenant jerárquica y Row Level Security (RLS) con aislamiento verificable e inmutabilidad de aislamiento en la base de datos para aplicar en el servicio de mantenimiento mecánico**

**Formulación extendida del tema.** Diseño y validación de una arquitectura multi-tenant jerárquica (organización → talleres) y de las políticas de Row Level Security que la sostienen, sobre infraestructura serverless, con el aislamiento de datos aplicado en el motor de base de datos y **sostenido con independencia de la capa de aplicación** —de ahí que sea verificable e inmutable—, para aplicar en la gestión centralizada de organizaciones de servicio de mantenimiento mecánico. El estudio se delimita al servicio de **motocicletas en Bolivia** (§1.3), que es el caso sobre el que la arquitectura se valida.

> El **título** es la forma canónica y se emplea en portada, índices y referencias a este proyecto; la formulación extendida solo desarrolla su contenido técnico.

## 1.2 El problema

### Síntoma
Un operador que administra **una o varias organizaciones de servicio de motocicletas, cada una con uno o varios talleres**, no dispone en Bolivia de una plataforma que le permita gestionarlas desde una sola cuenta con una visión consolidada. Hoy debe elegir entre dos malas opciones: llevar cada local como una cuenta independiente —perdiendo la vista unificada del cliente y su historial— o recurrir a hojas de cálculo y software genérico no especializado.

### Causa
El software de gestión de talleres relevado con presencia en Bolivia (AutoSoft Taller, ServitechApp, TuneraTaller) y el regional (Appli-Car, Garage App) está construido sobre arquitecturas de **un solo inquilino** (*single-tenant*): asumen un taller por cuenta. No modelan ni la pertenencia de varias organizaciones a una misma cuenta, ni la de varios talleres a una misma organización. Cuando existe algún aislamiento entre clientes del sistema, se resuelve **únicamente en el código de la aplicación**: basta que una consulta omita el filtro correspondiente para que se produzca una fuga de datos, porque no hay ningún control por debajo que lo impida.

### Impacto
- **Pérdida de la visión consolidada**: el historial de un cliente queda fragmentado entre talleres de la misma organización, que es precisamente lo que se busca al centralizar.
- **Riesgo de fuga de datos entre organizaciones**: al depender el aislamiento de que cada consulta esté correctamente escrita, un solo error de programación expone información de un cliente del sistema a otro.
- **Barrera de costo**: la infraestructura tradicional (servidor propio, despliegue manual) eleva el costo de entrada, un factor crítico en un sector con alta informalidad y bajo presupuesto de TI en Bolivia (contexto ampliado en §2, Antecedentes).

## 1.3 Delimitación del problema

> **Por qué el título dice «mantenimiento mecánico» y este apartado dice «motocicletas».** El título declara el **dominio de aplicabilidad** de la arquitectura: nada de lo que se diseña es propio de la motocicleta, y el mismo modelo sirve a cualquier taller de servicio mecánico. La delimitación, en cambio, fija **dónde se valida**: el servicio de motocicletas en Bolivia, que es el caso del que se dispone de datos oficiales (§2.1), de oferta relevable (§2.2) y de operadores a los que someter la evaluación de usabilidad (§16.4 del anteproyecto). Un título más estrecho prometería menos de lo que la arquitectura sostiene; una delimitación más ancha prometería una validación que no se hace.


| Dimensión | Delimitación |
|---|---|
| **Espacial / Organizacional** | Organizaciones de servicio y reparación de motocicletas en Bolivia; específicamente, operadores que administran —o planean administrar— más de una organización y/o más de un taller. |
| **Temporal** | Desarrollo y validación entre **septiembre y diciembre de 2026** (cuatro meses). El cronograma detallado por fases e hitos está en [Plan de trabajo](../ingenieria/08-plan-trabajo.md). |
| **Técnica** | El componente abordado es la **capa de identidad, jerarquía organizacional y aislamiento de datos**: cuentas, organizaciones, talleres, membresías con rol, y las políticas de seguridad que las hacen cumplir en la base de datos. **No** abarca la totalidad de los módulos operativos (ver Exclusiones, §1.8.3). |

## 1.4 Pregunta general

> **¿De qué manera una arquitectura multi-tenant jerárquica y Row Level Security (RLS) sobre infraestructura serverless sostiene un aislamiento verificable e inmutable en la base de datos y mejora la gestión centralizada y la seguridad de los datos de operadores de varias organizaciones y talleres de servicio de mantenimiento mecánico en Bolivia?**

## 1.5 Preguntas específicas

*(Una por cada objetivo específico de §1.7, en el mismo orden.)*

1. ¿Qué estrategias de aislamiento multi-tenant documenta la literatura, con qué ventajas y limitaciones, y qué carencias presentan frente al modelo multiorganización las soluciones de gestión de talleres disponibles en Bolivia? *(Análisis)*
2. ¿Qué modelo de datos y qué políticas de seguridad a nivel de fila permiten representar la jerarquía organización → talleres sin fragmentar la información del cliente y sosteniendo un único límite de aislamiento? *(Diseño)*
3. ¿Cómo se comprueba, con evidencia reproducible, que el aislamiento entre organizaciones se cumple incluso ante fallos de la capa de aplicación —es decir, que es **inmutable**— y que el cambio de contexto entre organizaciones y talleres resulta usable para el operador? *(Validación)*

## 1.6 Objetivo general

> **Diseñar y validar una arquitectura multi-tenant jerárquica (organización → talleres) y Row Level Security (RLS) sobre infraestructura serverless, que sostenga un aislamiento verificable e inmutable en la base de datos, para permitir la gestión centralizada de varias organizaciones de servicio de mantenimiento mecánico.**

> Las tecnologías concretas que materializan este objetivo —Node.js/TypeScript, Supabase (PostgreSQL) y despliegue en Vercel— se declaran en el **alcance técnico** (§1.8.2), no en el enunciado del objetivo: son medios sustituibles, y atarlos aquí envejecería la formulación.

## 1.7 Objetivos específicos

*(Tres objetivos secuenciales, uno por fase: **Analizar → Diseñar → Validar**. Cada uno responde a la pregunta específica correlativa de §1.5 y cierra con un entregable verificable. La **construcción del artefacto no es un objetivo de investigación**: es el instrumento con el que el objetivo 3 obtiene su evidencia, y por eso el título no la nombra.)*

1. **Analizar** las estrategias de aislamiento multi-tenant documentadas en la literatura —base por inquilino, esquema por inquilino y esquema compartido con seguridad a nivel de fila— y las soluciones de gestión de talleres con presencia en Bolivia, para fundamentar la selección arquitectónica e identificar el vacío funcional y tecnológico que justifica el proyecto.

2. **Diseñar** el modelo de datos de la jerarquía organización → talleres —con el alcance de cada entidad según su nivel y las restricciones de integridad que de él se derivan— y **especificar** las políticas de seguridad a nivel de fila, junto con las funciones auxiliares de verificación de membresía, que sostienen un único límite de aislamiento entre organizaciones.

3. **Validar** el aislamiento de datos mediante pruebas automatizadas de seguridad que comprueben, tanto a través de la interfaz de programación como accediendo directamente a la base de datos, que una organización no puede acceder a datos de otra aun cuando la capa de aplicación omita sus controles, y **evaluar** con operadores del rubro la usabilidad del cambio de contexto entre organizaciones y talleres.

> La evaluación de usabilidad se acota deliberadamente al **cambio de contexto**, que es la consecuencia visible de la jerarquía de dos niveles: no se estudia la interfaz en general, sino si el modelo que propone la tesis resulta comprensible para quien debe operarlo. Una arquitectura jerárquica correcta que el operador no sabe manejar no resuelve el problema planteado en §1.2.

### Trazabilidad objetivo → evidencia

| # | Objetivo | Entregable verificable |
|---|---|---|
| 1 | Analizar la literatura y la oferta boliviana | Matriz de extracción del estado del arte (§2.2) · análisis competitivo con el vacío identificado (§2.3) |
| 2 | Diseñar el modelo jerárquico y especificar las políticas | Modelo entidad-relación con alcance por nivel y restricciones de unicidad · contrato de la interfaz de programación con el contexto activo y las reglas de no divulgación · migración con políticas RLS y funciones de verificación de membresía |
| 3 | Validar el aislamiento y evaluar la usabilidad del cambio de contexto | Suite de pruebas de seguridad que demuestra la separación por interfaz de programación y por acceso directo a la base de datos, con la matriz de trazabilidad requisito → caso → evidencia · informe de evaluación de usabilidad con tasa de éxito por tarea y puntuación SUS |

## 1.8 Delimitación y alcance

### 1.8.1 Alcance funcional
- Registro que crea una cuenta, su primera organización y su primer taller, con el usuario como Owner.
- Creación de organizaciones adicionales bajo la misma cuenta, y de talleres adicionales dentro de cada organización.
- Listado de las organizaciones del usuario (según su membresía) y cambio de organización activa; selección de taller activo dentro de la organización.
- Gestión de miembros por organización: invitar, cambiar rol, remover (reservado al rol Owner), y asignación operativa de miembros a talleres.
- **Corte vertical de demostración**: dos módulos de negocio implementados como prueba del modelo jerárquico — **Clientes** (entidad de nivel organización, visible desde cualquier taller) e **Inventario de repuestos** (entidad de nivel taller, acotada a su local). Son el mínimo necesario para demostrar y validar que el alcance por nivel funciona; se eligen estos dos porque no dependen de otros módulos de negocio.
- Verificación de aislamiento: una cuenta sin membresía activa en una organización no puede leer ni escribir sus datos por ninguna vía.
- **Evaluación de usabilidad del cambio de contexto** con operadores del rubro: tareas guiadas sobre la selección de organización y taller activos y sobre el acceso a un cliente registrado en otro taller, con medición de éxito, tiempo, errores y satisfacción percibida.

### 1.8.2 Alcance técnico
- **Backend**: Node.js, TypeScript, Hono (framework de API), Zod (validación).
- **Datos y autenticación**: Supabase (PostgreSQL, Supabase Auth, Row Level Security).
- **Despliegue**: Vercel (funciones serverless).
- **Frontend**: React con TypeScript, incluida su integración con el proveedor de identidad y los selectores de organización y taller activos.
- **Pruebas**: Vitest (pruebas unitarias, HTTP y de aislamiento multi-tenant).
- **Integración continua**: pipeline automatizado en GitHub Actions que ejecuta la verificación de tipos y la suite de pruebas en cada integración al ramal principal. El despliegue automático a Vercel no forma parte del alcance: lo exigible es la verificación en cada integración (RNF-203), que es la que mantiene el artefacto en un estado apto para validarlo.

> Las teorías, modelos y estándares que justifican cada una de estas elecciones se desarrollan en el [Marco teórico y conceptual](03-marco-teorico-y-conceptual.md); las alternativas evaluadas y descartadas, en [Decisiones de diseño](../ingenieria/07-decisiones-diseno.md).

### 1.8.3 Exclusiones (lo que explícitamente NO cubre este proyecto)

El objeto de estudio es la **arquitectura**, no la suite funcional completa. En consecuencia, **no** forman parte de este proyecto:

- **Los módulos operativos fuera del corte vertical**: motocicletas, órdenes de trabajo, historial de mantenimiento y dashboard. Se implementan solo Clientes e Inventario, por ser suficientes para demostrar los dos niveles de la jerarquía (§1.8.1); el resto queda como trabajo posterior reutilizando el mismo patrón.
- **La auditoría extendida al conjunto de las entidades de negocio.** Sí forma parte del alcance el registro del conjunto acotado de acciones críticas que enumera RF-703 ([Requisitos](../ingenieria/02-requisitos.md)); lo que se excluye es extender ese registro a toda operación del sistema (ver [Seguridad](../ingenieria/06-seguridad.md), «Fuera del alcance»).
- **La integración con WhatsApp Business API.**
- **La emisión de factura electrónica del SIN** de Bolivia. Se documenta como requisito del mercado (ver análisis competitivo), pero su implementación excede el alcance temporal.
- **Aplicaciones móviles o de escritorio nativas**: solo web responsiva/PWA.
- **Migración de datos productivos** desde sistemas anteriores (no existen datos productivos previos).
- **Pruebas de carga o rendimiento a escala productiva**: la validación se centra en el aislamiento, la corrección funcional y la usabilidad del cambio de contexto, no en el desempeño bajo alta concurrencia.
- **La evaluación de usabilidad de la totalidad de la interfaz.** Se evalúa el cambio de contexto entre organizaciones y talleres, por ser la manifestación visible del aporte de la tesis (§1.7, objetivo 3); las demás pantallas quedan fuera de esa evaluación.

# 1. Definición y Alcance del Proyecto

## 1.1 Tema

**Título del proyecto**

> **Diseño, implementación y validación de una arquitectura multi-tenant jerárquica con aislamiento verificable en la base de datos para organizaciones de servicio de motocicletas en Bolivia**

**Formulación extendida del tema.** Diseño, implementación y validación de una arquitectura multi-tenant jerárquica (organización → talleres) sobre infraestructura serverless, con aislamiento de datos aplicado en el motor de base de datos mediante seguridad a nivel de fila, para la gestión centralizada de organizaciones de servicio de motocicletas en Bolivia.

> El **título** es la forma canónica y se emplea en portada, índices y referencias a este proyecto; la formulación extendida solo desarrolla su contenido técnico. Si el título cambia, se actualiza en los cuatro lugares donde aparece: este apartado, el [Perfil de proyecto](00-perfil-proyecto.md), el [Anteproyecto integrado](04-anteproyecto-integrado.md) y el [índice de la documentación](../README.md).

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

| Dimensión | Delimitación |
|---|---|
| **Espacial / Organizacional** | Organizaciones de servicio y reparación de motocicletas en Bolivia; específicamente, operadores que administran —o planean administrar— más de una organización y/o más de un taller. |
| **Temporal** | Desarrollo y validación entre **septiembre y diciembre de 2026** (cuatro meses). El cronograma detallado por fases e hitos está en [Plan de trabajo](../ingenieria/08-plan-trabajo.md). |
| **Técnica** | El componente abordado es la **capa de identidad, jerarquía organizacional y aislamiento de datos**: cuentas, organizaciones, talleres, membresías con rol, y las políticas de seguridad que las hacen cumplir en la base de datos. **No** abarca la totalidad de los módulos operativos (ver Exclusiones, §1.8.3). |

## 1.4 Pregunta general

> **¿De qué manera el diseño e implementación de una arquitectura multi-tenant jerárquica sobre infraestructura serverless, con aislamiento aplicado mediante Row-Level Security, mejora la gestión centralizada y la seguridad de los datos de operadores de varias organizaciones y talleres de servicio de motocicletas en Bolivia?**

## 1.5 Preguntas específicas

*(Una por cada objetivo específico de §1.7, en el mismo orden.)*

1. ¿Qué estrategias de aislamiento multi-tenant documenta la literatura, con qué ventajas y limitaciones, y qué carencias presentan frente al modelo multiorganización las soluciones de gestión de talleres disponibles en Bolivia? *(Análisis)*
2. ¿Qué modelo de datos y qué políticas de seguridad a nivel de fila permiten representar la jerarquía organización → talleres sin fragmentar la información del cliente y sosteniendo un único límite de aislamiento? *(Diseño)*
3. ¿Cómo se implementan la identidad, la jerarquía organizacional, el control de acceso por rol y el alcance diferenciado de datos sobre una plataforma serverless con verificación automatizada en cada integración? *(Implementación)*
4. ¿Cómo se comprueba, con evidencia reproducible, que el aislamiento entre organizaciones se cumple incluso ante fallos de la capa de aplicación, y que el cambio de contexto entre organizaciones y talleres resulta usable para el operador? *(Validación)*

## 1.6 Objetivo general

> **Diseñar, implementar y validar una arquitectura multi-tenant jerárquica (organización → talleres) sobre infraestructura serverless, que aplique el aislamiento de datos en el motor de base de datos mediante seguridad a nivel de fila, para permitir la gestión centralizada de varias organizaciones de servicio de motocicletas en Bolivia garantizando la separación verificable de sus datos.**

> Las tecnologías concretas que materializan este objetivo —Node.js/TypeScript, Supabase (PostgreSQL) y despliegue en Vercel— se declaran en el **alcance técnico** (§1.8.2), no en el enunciado del objetivo: son medios sustituibles y atarlos aquí envejecería la formulación. Esta redacción es la única válida y se replica sin variación en el [Perfil](00-perfil-proyecto.md) §4.1 y en el [Anteproyecto integrado](04-anteproyecto-integrado.md) §8.

## 1.7 Objetivos específicos

*(Cuatro objetivos secuenciales, uno por fase: **Analizar → Diseñar → Implementar → Validar**. Cada uno responde a la pregunta específica correlativa de §1.5 y cierra con un entregable verificable.)*

1. **Analizar** las estrategias de aislamiento multi-tenant documentadas en la literatura —base por inquilino, esquema por inquilino y esquema compartido con seguridad a nivel de fila— y las soluciones de gestión de talleres con presencia en Bolivia, para fundamentar la selección arquitectónica e identificar el vacío funcional y tecnológico que justifica el proyecto.

2. **Diseñar** el modelo de datos de la jerarquía organización → talleres —con el alcance de cada entidad según su nivel y las restricciones de integridad que de él se derivan— y **especificar** las políticas de seguridad a nivel de fila, junto con las funciones auxiliares de verificación de membresía, que sostienen un único límite de aislamiento entre organizaciones.

3. **Implementar** sobre infraestructura serverless la capa de identidad, la jerarquía organizacional y el control de acceso por rol, junto con el corte vertical que demuestra el alcance diferenciado de datos —clientes como entidad de nivel organización e inventario como entidad de nivel taller—, y **automatizar** un pipeline de integración continua que ejecute verificación estática de tipos y la suite de pruebas en cada integración al ramal principal.

4. **Validar** el aislamiento de datos mediante pruebas automatizadas de seguridad que comprueben, tanto a través de la interfaz de programación como accediendo directamente a la base de datos, que una organización no puede acceder a datos de otra aun cuando la capa de aplicación omita sus controles, y **evaluar** con operadores del rubro la usabilidad del cambio de contexto entre organizaciones y talleres.

> La evaluación de usabilidad se acota deliberadamente al **cambio de contexto**, que es la consecuencia visible de la jerarquía de dos niveles: no se estudia la interfaz en general, sino si el modelo que propone la tesis resulta comprensible para quien debe operarlo. Una arquitectura jerárquica correcta que el operador no sabe manejar no resuelve el problema planteado en §1.2.

### Trazabilidad objetivo → evidencia

| # | Objetivo | Entregable verificable |
|---|---|---|
| 1 | Analizar la literatura y la oferta boliviana | Matriz de extracción del estado del arte (§2.2) · análisis competitivo con el vacío identificado (§2.3) |
| 2 | Diseñar el modelo jerárquico y especificar las políticas | Modelo entidad-relación con alcance por nivel y restricciones de unicidad · contrato de la interfaz de programación con el contexto activo y las reglas de no divulgación · migración con políticas RLS y funciones de verificación de membresía |
| 3 | Implementar la arquitectura y automatizar su verificación | Backend serverless con registro, organizaciones, talleres, miembros y roles operativos · módulos de clientes e inventario funcionando · pipeline en verde en cada integración |
| 4 | Validar el aislamiento y evaluar la usabilidad del cambio de contexto | Suite de pruebas de seguridad que demuestra la separación por interfaz de programación y por acceso directo a la base de datos, con la matriz de trazabilidad requisito → caso → evidencia · informe de evaluación de usabilidad con tasa de éxito por tarea y puntuación SUS |

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
- **Datos y autenticación**: Supabase (PostgreSQL, Supabase Auth, Row-Level Security).
- **Despliegue**: Vercel (funciones serverless).
- **Frontend**: React con TypeScript, incluida su integración con el proveedor de identidad y los selectores de organización y taller activos.
- **Pruebas**: Vitest (pruebas unitarias, HTTP y de aislamiento multi-tenant).
- **Integración continua**: pipeline automatizado en GitHub Actions que ejecuta la verificación de tipos y la suite de pruebas en cada integración al ramal principal. El despliegue automático a Vercel no forma parte del alcance: el objetivo 3 se cumple con la verificación en cada integración.

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
- **La evaluación de usabilidad de la totalidad de la interfaz.** Se evalúa el cambio de contexto entre organizaciones y talleres, por ser la manifestación visible del aporte de la tesis (§1.7, objetivo 4); las demás pantallas quedan fuera de esa evaluación.

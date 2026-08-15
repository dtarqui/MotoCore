# 1. Definición y Alcance del Proyecto

*(Sesión 1 del Seminario: Tema → Problema → Pregunta/Objetivo General → Objetivos Específicos → Alcance. Formato según la rúbrica del módulo — ver §1.9.)*

## 1.1 Tema

**Diseño, implementación y validación de una arquitectura multi-tenant jerárquica (empresa → sucursales) sobre infraestructura serverless, con aislamiento de datos aplicado en el motor de base de datos mediante Row-Level Security, para la gestión centralizada de empresas de servicio de motocicletas en Bolivia.**

## 1.2 El problema

### Síntoma
Un operador que administra **una o varias empresas de servicio de motocicletas, cada una con una o varias sucursales**, no dispone en Bolivia de una plataforma que le permita gestionarlas desde una sola cuenta con una visión consolidada. Hoy debe elegir entre dos malas opciones: llevar cada local como una cuenta independiente —perdiendo la vista unificada del cliente y su historial— o recurrir a hojas de cálculo y software genérico no especializado.

### Causa
El software de gestión de talleres relevado con presencia en Bolivia (AutoSoft Taller, ServitechApp, TuneraTaller) y el regional (Appli-Car, Garage App) está construido sobre arquitecturas de **un solo inquilino** (*single-tenant*): asumen un taller por cuenta. No modelan ni la pertenencia de varias empresas a una misma cuenta, ni la de varias sucursales a una misma empresa. Cuando existe algún aislamiento entre clientes del sistema, se resuelve **únicamente en el código de la aplicación**: basta que una consulta omita el filtro correspondiente para que se produzca una fuga de datos, porque no hay ningún control por debajo que lo impida.

### Impacto
- **Pérdida de la visión consolidada**: el historial de un cliente queda fragmentado entre sucursales de la misma empresa, que es precisamente lo que se busca al centralizar.
- **Riesgo de fuga de datos entre empresas**: al depender el aislamiento de que cada consulta esté correctamente escrita, un solo error de programación expone información de un cliente del sistema a otro.
- **Barrera de costo**: la infraestructura tradicional (servidor propio, despliegue manual) eleva el costo de entrada, un factor crítico en un sector con alta informalidad y bajo presupuesto de TI en Bolivia (contexto ampliado en §2, Antecedentes).

## 1.3 Delimitación del problema

| Dimensión | Delimitación |
|---|---|
| **Espacial / Organizacional** | Empresas de servicio y reparación de motocicletas en Bolivia; específicamente, operadores que administran —o planean administrar— más de una empresa y/o más de una sucursal. |
| **Temporal** | Desarrollo y validación entre **septiembre y diciembre de 2026** (cuatro meses). El cronograma detallado por fases e hitos está en [Plan de trabajo](../08-plan-trabajo.md). |
| **Técnica** | El componente abordado es la **capa de identidad, jerarquía organizacional y aislamiento de datos**: cuentas, empresas, sucursales, membresías con rol, y las políticas de seguridad que las hacen cumplir en la base de datos. **No** abarca la totalidad de los módulos operativos (ver Exclusiones, §1.8.3). |

## 1.4 Pregunta general

> **¿De qué manera el diseño e implementación de una arquitectura multi-tenant jerárquica sobre infraestructura serverless, con aislamiento aplicado mediante Row-Level Security, mejora la gestión centralizada y la seguridad de los datos de operadores de varias empresas y sucursales de servicio de motocicletas en Bolivia?**

## 1.5 Preguntas específicas

*(Una por cada objetivo específico de §1.7, en el mismo orden.)*

1. ¿Qué estrategias de aislamiento multi-tenant documenta la literatura y qué ventajas y limitaciones presenta cada una? *(Análisis)*
2. ¿Qué capacidades ofrecen las soluciones de gestión de talleres disponibles en Bolivia y qué carencias presentan frente al modelo multiempresa? *(Análisis)*
3. ¿Qué modelo de datos permite representar la jerarquía empresa → sucursales sin fragmentar la información del cliente entre locales? *(Diseño)*
4. ¿Qué políticas de seguridad a nivel de fila sostienen un único límite de aislamiento cuando el inquilino tiene una subdivisión interna? *(Diseño)*
5. ¿Cómo se implementa la identidad, la jerarquía organizacional y el control de acceso por rol sobre una plataforma serverless? *(Implementación)*
6. ¿Cómo se comporta el alcance diferenciado de datos al implementar entidades de nivel empresa y de nivel sucursal? *(Implementación)*
7. ¿Cómo se automatiza la verificación continua de tipos y pruebas para sostener la calidad durante el desarrollo? *(Implementación)*
8. ¿Cómo se comprueba, con evidencia reproducible, que el aislamiento entre empresas se cumple incluso ante fallos de la capa de aplicación? *(Validación)*

## 1.6 Objetivo general

> **Diseñar, implementar y validar una arquitectura multi-tenant jerárquica (empresa → sucursales) sobre infraestructura serverless —Node.js/TypeScript con Supabase (PostgreSQL) y despliegue continuo en Vercel—, que aplique el aislamiento de datos en el motor de base de datos mediante Row-Level Security, para permitir la gestión centralizada de varias empresas de servicio de motocicletas en Bolivia garantizando la separación verificable de sus datos.**

Verificación contra la fórmula del módulo (Qué + Cómo, para Qué):

| Componente | En el objetivo |
|---|---|
| **Qué** (verbos medibles) | Diseñar, implementar y **validar** una arquitectura multi-tenant jerárquica con aislamiento verificable |
| **Cómo** (tecnología central) | Serverless (Vercel), Node.js/TypeScript, Supabase/PostgreSQL, Row-Level Security, despliegue continuo |
| **Para qué** (resultado) | Gestión centralizada de varias empresas y sucursales de servicio de motocicletas en Bolivia, con separación de datos garantizada |

## 1.7 Objetivos específicos

*(Todos con verbo de ingeniería, en secuencia. Cada uno responde a la pregunta específica correlativa de §1.5.)*

**Fase de análisis**

1. **Analizar** las estrategias de aislamiento multi-tenant documentadas en la literatura —base por inquilino, esquema por inquilino y esquema compartido con seguridad a nivel de fila— para fundamentar la selección arquitectónica.

2. **Comparar** las soluciones de gestión de talleres con presencia en Bolivia frente a los requisitos del modelo multiempresa, para identificar el vacío funcional y tecnológico que justifica el proyecto.

**Fase de diseño**

3. **Diseñar** el modelo de datos de la jerarquía empresa → sucursales, definiendo el alcance de cada entidad según su nivel y las restricciones de integridad que se derivan de él.

4. **Especificar** las políticas de seguridad a nivel de fila que sostienen un único límite de aislamiento entre empresas, junto con las funciones auxiliares de verificación de membresía.

**Fase de implementación**

5. **Implementar** la capa de identidad, la jerarquía organizacional y el control de acceso por rol sobre infraestructura serverless.

6. **Desarrollar** el corte vertical de demostración del modelo jerárquico: el módulo de clientes como entidad de nivel empresa y el de inventario como entidad de nivel sucursal.

7. **Automatizar** un pipeline de integración continua que ejecute verificación estática de tipos y la suite de pruebas en cada integración al ramal principal.

**Fase de validación**

8. **Validar** el aislamiento de datos mediante pruebas automatizadas de seguridad que comprueben, tanto a través de la interfaz de programación como accediendo directamente a la base de datos, que una empresa no puede acceder a datos de otra aun cuando la capa de aplicación omita sus controles.

### Trazabilidad objetivo → evidencia

| # | Objetivo | Entregable verificable |
|---|---|---|
| 1 | Analizar estrategias de aislamiento | Matriz de extracción del estado del arte (§2.2) |
| 2 | Comparar soluciones en Bolivia | Análisis competitivo y vacío identificado (§2.3) |
| 3 | Diseñar el modelo jerárquico | Modelo entidad-relación con alcance por nivel y restricciones de unicidad |
| 4 | Especificar las políticas de aislamiento | Migración con políticas RLS y funciones de verificación de membresía |
| 5 | Implementar identidad y jerarquía | Backend serverless con registro, empresas, sucursales, miembros y roles operativos |
| 6 | Desarrollar el corte vertical | Módulos de clientes (nivel empresa) e inventario (nivel sucursal) funcionando |
| 7 | Automatizar la integración continua | Pipeline ejecutándose en verde en cada integración |
| 8 | Validar el aislamiento | Suite de pruebas de seguridad que demuestra la separación por API y por acceso directo a la base de datos |

> **Nota sobre la cantidad de objetivos.** El módulo sugiere entre tres y cuatro objetivos específicos. Aquí se optó por **ocho objetivos más granulares** para que cada uno tenga un entregable verificable e independiente, conservando la secuencia metodológica exigida: **Analizar** (1–2) → **Diseñar** (3–4) → **Implementar** (5–7) → **Validar** (8). Si el tribunal prefiere el formato de cuatro, los objetivos se agrupan directamente por fase sin perder contenido. *Confirmar el formato preferido con el asesor.*

## 1.8 Delimitación y alcance

### 1.8.1 Alcance funcional
- Registro que crea una cuenta, su primera empresa y su primera sucursal, con el usuario como Owner.
- Creación de empresas adicionales bajo la misma cuenta, y de sucursales adicionales dentro de cada empresa.
- Listado de las empresas del usuario (según su membresía) y cambio de empresa activa; selección de sucursal activa dentro de la empresa.
- Gestión de miembros por empresa: invitar, cambiar rol, remover (reservado al rol Owner), y asignación operativa de miembros a sucursales.
- **Corte vertical de demostración**: dos módulos de negocio implementados como prueba del modelo jerárquico — **Clientes** (entidad de nivel empresa, visible desde cualquier sucursal) e **Inventario de repuestos** (entidad de nivel sucursal, acotada a su local). Son el mínimo necesario para demostrar y validar que el alcance por nivel funciona; se eligen estos dos porque no dependen de otros módulos de negocio.
- Verificación de aislamiento: una cuenta sin membresía activa en una empresa no puede leer ni escribir sus datos por ninguna vía.

### 1.8.2 Alcance técnico
- **Backend**: Node.js, TypeScript, Hono (framework de API), Zod (validación).
- **Datos y autenticación**: Supabase (PostgreSQL, Supabase Auth, Row-Level Security).
- **Despliegue**: Vercel (funciones serverless).
- **Frontend**: React con TypeScript, incluida su integración con el proveedor de identidad y los selectores de empresa y sucursal activas.
- **Pruebas**: Vitest (pruebas unitarias, HTTP y de aislamiento multi-tenant).
- **CI/CD**: pipeline automatizado en GitHub Actions que ejecuta la verificación de tipos y la suite de pruebas en cada integración al ramal principal — cubre el componente de automatización exigido por el módulo (§1.9).

> Las teorías, modelos y estándares que justifican cada una de estas elecciones se desarrollan en el [Marco teórico y conceptual](03-marco-teorico-y-conceptual.md); las alternativas evaluadas y descartadas, en [Decisiones de diseño](../07-decisiones-diseno.md).

### 1.8.3 Exclusiones (lo que explícitamente NO cubre este proyecto)

El objeto de estudio es la **arquitectura**, no la suite funcional completa. En consecuencia, **no** forman parte de este proyecto:

- **Los módulos operativos fuera del corte vertical**: motocicletas, órdenes de trabajo, historial de mantenimiento, auditoría y dashboard. Se implementan solo Clientes e Inventario, por ser suficientes para demostrar los dos niveles de la jerarquía (§1.8.1); el resto queda como trabajo posterior reutilizando el mismo patrón.
- **La integración con WhatsApp Business API.**
- **La emisión de factura electrónica del SIN** de Bolivia. Se documenta como requisito del mercado (ver análisis competitivo), pero su implementación excede el alcance temporal.
- **Aplicaciones móviles o de escritorio nativas**: solo web responsiva/PWA.
- **Migración de datos productivos** desde sistemas anteriores (no existen datos productivos previos).
- **Pruebas de carga o rendimiento a escala productiva**: la validación se centra en el aislamiento y la corrección funcional, no en el desempeño bajo alta concurrencia.

## 1.9 Autoevaluación (rúbrica del módulo)

| Pregunta de la rúbrica | Respuesta |
|---|---|
| ¿El problema describe un "dolor operativo/técnico" real y no solo la "falta de un software"? | Sí — el dolor es doble y concreto: pérdida de la visión consolidada del cliente entre sucursales, y riesgo de fuga de datos por depender el aislamiento de que cada consulta esté bien escrita. |
| ¿El Objetivo General comienza con un verbo en infinitivo medible e incluye la tecnología principal? | Sí — "Diseñar, implementar y validar", con Node.js/TypeScript + Supabase/PostgreSQL + RLS + Vercel explícitos. |
| ¿Los Objetivos Específicos son pasos técnicos secuenciales (Analizar → Diseñar → Implementar → Validar)? | Sí — los ocho objetivos siguen esa secuencia, agrupados por fase: Analizar (1–2), Diseñar (3–4), Implementar (5–7), Validar (8). Ver la nota al pie de §1.7 sobre la cantidad. |
| ¿Incluye un párrafo de "Exclusiones" explícito? | Sí (§1.8.3), con seis exclusiones cerradas y justificadas. |
| ¿La propuesta integra conceptos avanzados (nube, integración continua, arquitecturas distribuidas, seguridad)? | Sí — despliegue serverless, base de datos gestionada en la nube, seguridad aplicada en el motor de base de datos e integración continua automatizada. |

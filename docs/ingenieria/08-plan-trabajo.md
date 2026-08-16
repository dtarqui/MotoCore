# Plan de trabajo

Metodología, cronograma, hitos y gestión de riesgos del proyecto de grado. Período: **septiembre a diciembre de 2026**.

> Objetivos y alcance: [anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) · Requisitos: [Requisitos](02-requisitos.md) · Historias: [Historias de usuario](03-historias-usuario.md)

## 1. Metodología

**Desarrollo iterativo e incremental**, organizado en iteraciones de dos semanas. Cada iteración cierra con software funcionando y verificado —no con documentación de avance— y ninguna se da por terminada mientras el pipeline de integración continua no esté en verde.

> El sustento teórico de esta metodología —desarrollo iterativo, integración continua y pruebas como especificación previa, con sus fuentes— está en el [Marco teórico](../anteproyecto/03-marco-teorico-y-conceptual.md) §3.2.5. Aquí se documenta su **aplicación**, no su justificación.

Prácticas adoptadas:

| Práctica | Aplicación |
|---|---|
| Iteraciones de 2 semanas | Ocho iteraciones en total, cada una con un incremento demostrable. |
| Definición de terminado | Código tipado sin errores, pruebas automatizadas en verde, requisito trazado y documentación actualizada. |
| Decisiones registradas | Toda decisión estructural se documenta como ADR antes de implementarse. |
| Integración continua | Verificación de tipos y pruebas en cada integración al ramal principal. |
| Verificación sobre afirmación | Cada requisito `Must` tiene una prueba que lo respalda; no se declara cumplido lo que no se puede ejecutar. |

**Por qué no Scrum formal**: el proyecto lo desarrolla una sola persona, por lo que las ceremonias de coordinación de equipo (planificación conjunta, diarias, retrospectiva grupal) no aplican. Se conserva lo que sí aporta valor en un contexto individual: iteraciones cortas, incremento demostrable y definición de terminado explícita.

**Orden de escritura de las pruebas**: las pruebas de aislamiento se escriben **antes** que la funcionalidad que protegen, de modo que actúen como especificación ejecutable del comportamiento esperado. Es la medida de mitigación del riesgo R1.

## 2. Fases y cronograma

Cada fase materializa uno de los cuatro objetivos específicos.

| Fase | Período | Objetivo | Resultado |
|---|---|---|---|
| **F1 · Análisis** | Septiembre (sem. 1–2) | 1 | Estado del arte con matriz de extracción, análisis del mercado y vacío de investigación |
| **F2 · Diseño** | Septiembre (sem. 3–4) | 2 | Marco teórico y conceptual, modelo de datos jerárquico, políticas de aislamiento y decisiones registradas |
| **F3 · Construcción** | 29 de septiembre – 7 de diciembre | 3 | Sistema funcional con el corte vertical e integración continua operativa |
| **F4 · Validación y cierre** | Diciembre | 4 | Evidencia de aislamiento, documento final y defensa |

### Detalle por iteración

| Iteración | Fechas | Contenido | Entregable |
|---|---|---|---|
| **I1** | 1–14 sep | Búsqueda en bases académicas; aplicación de criterios de inclusión y exclusión; lectura de fuentes | Matriz de extracción con fuentes revisadas por pares |
| **I2** | 15–28 sep | Análisis del mercado; comparación de estrategias de aislamiento; redacción del marco teórico y conceptual con revisión crítica; diseño del modelo jerárquico y de las políticas | Vacío de investigación redactado · Marco teórico y conceptual · Modelo de datos y decisiones de diseño cerrados |
| **I3** | 29 sep – 12 oct | Construcción del esquema: identidad, empresas, sucursales, membresías y políticas de aislamiento; selección de contexto activo | HU-06, HU-07, HU-08 · Esquema jerárquico operativo |
| **I4** | 13–26 oct | Cuentas, registro, gestión de empresas y de miembros con control de acceso por rol | HU-01 a HU-05, HU-09 a HU-12 |
| **I5** | 27 oct – 9 nov | Módulo de clientes — entidad de nivel empresa | HU-13, HU-14, HU-15 |
| **I6** | 10–23 nov | Módulo de inventario y movimientos de existencias — entidad de nivel sucursal | HU-16 a HU-19 (HU-20 si hay margen) |
| **I7** | 24 nov – 7 dic | Interfaz de usuario: autenticación, selección de empresa y sucursal, diseño responsivo y manifiesto de instalación (RNF-402, RNF-403) | Aplicación utilizable de extremo a extremo |
| **I8** | 8–21 dic | Pruebas de aislamiento, redacción final y preparación de la defensa | HU-21, HU-22 · Documento final |

*Reserva: del 22 al 31 de diciembre queda como margen para correcciones posteriores a la revisión del asesor.*

### Distribución de esfuerzo

| Fase | Puntos de historia | Proporción |
|---|---|---|
| F1 · Análisis | — | Investigación |
| F2 · Diseño | — | Modelado |
| F3 · Construcción | 65 | 86 % |
| F4 · Validación y cierre | 11 | 14 % |

## 3. Hitos

| Hito | Fecha objetivo | Criterio de cumplimiento |
|---|---|---|
| **H1 · Anteproyecto aprobado** | 28 de septiembre | Definición y alcance, estado del arte, y marco teórico y conceptual revisados por el asesor |
| **H2 · Jerarquía operativa** | 12 de octubre | Una empresa gestiona varias sucursales; el aislamiento sigue vigente |
| **H3 · Corte vertical completo** | 23 de noviembre | Clientes (nivel empresa) e Inventario (nivel sucursal) funcionando y probados |
| **H4 · Sistema integrado** | 7 de diciembre | Frontend conectado; flujo completo desde el registro hasta la operación |
| **H5 · Validación concluida** | 21 de diciembre | Evidencia de aislamiento reproducible; documento final entregado |

## 4. Riesgos

Probabilidad e impacto en escala baja / media / alta. Ordenados por exposición.

| ID | Riesgo | Prob. | Impacto | Mitigación | Plan de contingencia |
|---|---|---|---|---|---|
| **R1** | Las políticas de aislamiento resultan incorrectas o incompletas y permiten acceso cruzado entre empresas | Media | **Alto** | Escribir las pruebas de aislamiento **antes** que la funcionalidad, y ejecutarlas tras cada cambio de esquema o de política | Bloquear el avance hasta corregir; el aislamiento es requisito crítico y no admite deuda |
| **R2** | El alcance crece más allá de lo planificado (querer implementar más módulos) | **Alta** | Medio | Exclusiones cerradas y explícitas en §1.8.3; el corte vertical está definido | Congelar alcance en H3; lo demás pasa a trabajo futuro |
| **R3** | Dependencia de un proveedor externo (Supabase/Vercel): cambios de API, límites de plan gratuito o indisponibilidad | Media | Medio | Aislar el acceso al proveedor tras una capa propia; no usar funciones exclusivas innecesarias | Ejecutar PostgreSQL local para desarrollo y pruebas; el aislamiento por RLS no depende del proveedor |
| **R4** | Las políticas de aislamiento resultan más complejas de lo previsto al añadir el segundo nivel | Media | Medio | Decisión de ADR-006: un solo criterio de aislamiento (`organization_id`) en todas las tablas | Mantener el nivel sucursal solo en la capa de aplicación si RLS se vuelve inmanejable |
| **R5** | Tiempo insuficiente por carga laboral o académica paralela | Media | Medio | Iteraciones cortas con entregable demostrable; reserva de 10 días en diciembre | Reducir a `Could` las historias no esenciales (HU-20, HU-22) |
| **R6** | No conseguir fuentes académicas suficientes de los últimos 5 años sobre RLS multi-tenant | Media | Bajo | Ampliar a arquitecturas comparables de otros rubros; usar tesis de maestría además de artículos | Documentar la escasez de literatura como hallazgo del estado del arte |
| **R7** | Pérdida de trabajo por fallo de equipo | Baja | Alto | Control de versiones con repositorio remoto; integración frecuente | Recuperar desde el repositorio remoto |

## 5. Recursos

| Tipo | Detalle | Costo |
|---|---|---|
| Desarrollo | Equipo personal; editor y herramientas de código abierto | — |
| Base de datos y autenticación | Supabase, plan gratuito | Sin costo en el alcance del proyecto |
| Despliegue | Vercel, plan gratuito | Sin costo en el alcance del proyecto |
| Control de versiones e integración continua | GitHub y GitHub Actions | Sin costo para repositorios personales |
| Fuentes académicas | Google Scholar, IEEE Xplore, ACM, Scopus, BASE, OATD | Acceso institucional |

El costo de infraestructura es cero dentro del alcance del proyecto: los planes gratuitos cubren un entorno de desarrollo y demostración. Esto es coherente con RNF-302 (costo proporcional al uso).

## 6. Criterio de cierre

El proyecto se considera concluido cuando los cuatro objetivos específicos cuentan con su entregable verificable —según la tabla de trazabilidad de [anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) §1.7— y la suite de pruebas de aislamiento se ejecuta en verde de forma reproducible. Las funcionalidades excluidas del alcance (§1.8.3) no condicionan ese cierre.

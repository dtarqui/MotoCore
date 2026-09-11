# Plan de trabajo

Metodología, cronograma, hitos y gestión de riesgos del proyecto de grado. Período: **septiembre a diciembre de 2026**.

> Objetivos y alcance: [anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) · Requisitos: [Requisitos](02-requisitos.md) · Historias: [Historias de usuario](03-historias-usuario.md) · Verificación: [Plan de pruebas](11-plan-pruebas.md)

## 1. Metodología

**Desarrollo iterativo e incremental**, organizado en iteraciones de dos semanas. Cada iteración cierra con software funcionando y verificado —no con documentación de avance— y ninguna se da por terminada mientras el pipeline de integración continua no esté en verde.

> El sustento teórico de esta metodología —desarrollo iterativo, integración continua y pruebas como especificación previa, con sus fuentes— está en el [Marco teórico](../anteproyecto/03-marco-teorico-y-conceptual.md) §3.2.5. Aquí se documenta su **aplicación**, no su justificación.

Prácticas adoptadas:

| Práctica | Aplicación |
|---|---|
| Iteraciones de 2 semanas | Ocho iteraciones en total, cada una con un incremento demostrable. |
| Definición de terminado | Código tipado sin errores, pruebas automatizadas en verde, requisito trazado y documentación actualizada. Las cuatro condiciones se detallan en [Plan de pruebas](11-plan-pruebas.md) §6.1. |
| Decisiones registradas | Toda decisión estructural se documenta como ADR antes de implementarse. |
| Integración continua | Verificación de tipos y pruebas en cada integración al ramal principal. |
| Verificación sobre afirmación | Cada requisito `Must` tiene una prueba que lo respalda; no se declara cumplido lo que no se puede ejecutar. |

**Por qué no Scrum formal**: el proyecto lo desarrolla una sola persona, por lo que las ceremonias de coordinación de equipo (planificación conjunta, diarias, retrospectiva grupal) no aplican. Se conserva lo que sí aporta valor en un contexto individual: iteraciones cortas, incremento demostrable y definición de terminado explícita.

**Orden de escritura de las pruebas**: las pruebas de aislamiento se escriben **antes** que la funcionalidad que protegen, de modo que actúen como especificación ejecutable del comportamiento esperado. Es la medida de mitigación del riesgo R1.

## 2. Fases y cronograma

Cada fase materializa uno de los **tres** objetivos específicos. Entre el diseño y la validación se intercala el **desarrollo del artefacto**, que no es una fase de la investigación: es la construcción del instrumento sin el cual el objetivo 3 no tendría sobre qué medir, y por eso el título no la nombra.

| Fase | Período | Objetivo | Resultado |
|---|---|---|---|
| **F1 · Análisis** | Septiembre (sem. 1–2) | 1 | Estado del arte con matriz de extracción, análisis del mercado y vacío de investigación |
| **F2 · Diseño** | Septiembre (sem. 3–4) | 2 | Marco teórico y conceptual, modelo de datos jerárquico, políticas de aislamiento, decisiones registradas, contrato de la interfaz y plan de pruebas |
| *Desarrollo del artefacto* | 29 de septiembre – 7 de diciembre | — *(instrumental)* | Sistema con el corte vertical e integración continua operativa: el objeto sobre el que se mide |
| **F3 · Validación y cierre** | Diciembre | 3 | Evidencia de aislamiento y de su inmutabilidad, evaluación de usabilidad con operadores, documento final y defensa |

> **Por qué el desarrollo no cuenta como fase.** Una fase de esta investigación cierra con un **resultado de conocimiento**: un vacío identificado, un diseño fundamentado, una evidencia contrastada contra una hipótesis. Construir el sistema no produce ninguno de los tres — produce la **unidad de observación**. Declararlo fase obligaría a defender la construcción como aporte, y el aporte está en el diseño de la arquitectura y en el procedimiento con que se comprueba que su aislamiento no se puede desactivar.

> **Qué relación guardan F1 y F2 con el anteproyecto.** El estado del arte, el marco teórico y el diseño que estas dos fases producen **no parten de cero**: el anteproyecto presentado para aprobación ya los adelanta, y lo que F1 y F2 hacen es consolidarlos, ampliarlos con la lectura completa de las fuentes y cerrarlos como artefactos de ingeniería trazables a los requisitos. El anteproyecto es el **insumo** de ambas fases, no su sustituto, y lo que cierra septiembre es su versión revisada por el tutor (hito H1).

### Detalle por iteración

| Iteración | Fechas | Contenido | Entregable |
|---|---|---|---|
| **I1** | 1–14 sep | Búsqueda en bases académicas; aplicación de criterios de inclusión y exclusión; lectura de fuentes; relevamiento de las soluciones con presencia en Bolivia | Matriz de extracción con fuentes revisadas por pares · Análisis del mercado · Vacío de investigación redactado |
| **I2** | 15–28 sep | Comparación de estrategias de aislamiento; redacción del marco teórico y conceptual con revisión crítica; diseño del modelo jerárquico, de las políticas, del contrato de la interfaz y de la estrategia de verificación | Marco teórico y conceptual · Modelo de datos y decisiones de diseño cerrados · Contrato de la interfaz de programación · Plan de pruebas con su matriz de trazabilidad |
| **I3** | 29 sep – 12 oct | Construcción del esquema: identidad, organizaciones, talleres, membresías y políticas de aislamiento; selección de contexto activo | HU-06, HU-07, HU-08 · Esquema jerárquico operativo |
| **I4** | 13–26 oct | Cuentas, registro, gestión de organizaciones y de miembros con control de acceso por rol | HU-01 a HU-05, HU-09 a HU-12 |
| **I5** | 27 oct – 9 nov | Módulo de clientes — entidad de nivel organización | HU-13, HU-14, HU-15 |
| **I6** | 10–23 nov | Módulo de inventario y movimientos de existencias — entidad de nivel taller | HU-16 a HU-19 (HU-20 si hay margen) |
| **I7** | 24 nov – 7 dic | Interfaz de usuario: autenticación, selección de organización y taller, diseño responsivo y manifiesto de instalación (RNF-402, RNF-403) | Aplicación utilizable de extremo a extremo |
| **I8** | 8–21 dic | **Ejecución** del ciclo de validación del aislamiento —tres corridas sobre entornos reconstruidos— con conservación de su evidencia; evaluación de usabilidad con operadores (RNF-404); redacción final y preparación de la defensa | HU-21, HU-22 · Evidencia de las tres corridas · Informe de usabilidad · Documento final |

*Reserva: del 22 al 31 de diciembre queda como margen para correcciones posteriores a la revisión del tutor.*

> **Sobre HU-21 y el lugar que ocupa en el cronograma.** Sus casos **no se escriben en I8**: cada módulo incorpora su caso de aislamiento **antes** que la funcionalidad que protege, desde I3, que es la mitigación del riesgo R1 y la regla de orden que fija §1. Lo que I8 concentra es la **ejecución del ciclo completo de validación** —las tres corridas del *test–retest* sobre entornos reconstruidos ([Plan de pruebas](11-plan-pruebas.md) §5.4)— y la conservación de la evidencia que exige el objetivo 3. Los puntos de HU-21 se imputan a I8 porque es ahí donde se produce el entregable, no donde se escribe la primera prueba.

### Distribución de esfuerzo

| Bloque | Puntos de historia | Proporción |
|---|---|---|
| F1 · Análisis | — | Investigación |
| F2 · Diseño | — | Modelado |
| *Desarrollo del artefacto* | 65 | 86 % |
| F3 · Validación y cierre | 11 | 14 % |

## 3. Hitos

| Hito | Fecha objetivo | Criterio de cumplimiento |
|---|---|---|
| **H1 · Perfil y anteproyecto aprobados** | 28 de septiembre | Definición y alcance, estado del arte, y marco teórico y conceptual revisados por el tutor |
| **H2 · Jerarquía operativa** | 12 de octubre | Una organización gestiona varios talleres; el aislamiento sigue vigente |
| **H3 · Corte vertical completo** | 23 de noviembre | Clientes (nivel organización) e Inventario (nivel taller) funcionando y probados |
| **H4 · Sistema integrado** | 7 de diciembre | Frontend conectado; flujo completo desde el registro hasta la operación |
| **H5 · Validación concluida** | 21 de diciembre | Evidencia de aislamiento reproducible **y de su inmutabilidad** (CP-N102); evaluación de usabilidad ejecutada con al menos cinco operadores; documento final entregado |

## 4. Riesgos

Probabilidad e impacto en escala baja / media / alta. Ordenados por **exposición** (probabilidad × impacto): primero el único de impacto alto y probabilidad media, después los dos de probabilidad alta, y al final los de exposición menor. El perfil reproduce el mismo orden sin la columna de contingencia ([perfil §13](../anteproyecto/00-perfil-proyecto.md)).

| ID | Riesgo | Prob. | Impacto | Mitigación | Plan de contingencia |
|---|---|---|---|---|---|
| **R1** | Las políticas de aislamiento resultan incorrectas o incompletas y permiten acceso cruzado entre organizaciones | Media | **Alto** | Escribir las pruebas de aislamiento **antes** que la funcionalidad, y ejecutarlas tras cada cambio de esquema o de política | Bloquear el avance hasta corregir; el aislamiento es requisito crítico y no admite deuda |
| **R2** | El alcance crece más allá de lo planificado (querer implementar más módulos) | **Alta** | Medio | Exclusiones cerradas y explícitas en §1.8.3; el corte vertical está definido | Congelar alcance en H3; lo demás pasa a trabajo futuro |
| **R8** | No conseguir operadores disponibles para la evaluación de usabilidad en la ventana de I8, o que se retiren tras aceptar | **Alta** | Medio | Contactar y confirmar a los participantes durante I6, no en I8; sobre-reclutar a 8 para asegurar 5 efectivos; permitir sesiones remotas | Reportar la evaluación con los participantes efectivamente conseguidos, declarando el tamaño alcanzado. La hipótesis del proyecto es sobre el aislamiento, de modo que una muestra menor limita este hallazgo pero no invalida la tesis |
| **R3** | Dependencia de un proveedor externo (Supabase/Vercel): cambios de API, límites de plan gratuito o indisponibilidad | Media | Medio | Aislar el acceso al proveedor tras una capa propia; no usar funciones exclusivas innecesarias | Ejecutar PostgreSQL local para desarrollo y pruebas; el aislamiento por RLS no depende del proveedor |
| **R4** | Las políticas de aislamiento resultan más complejas de lo previsto al añadir el segundo nivel | Media | Medio | Decisión de ADR-006: un solo criterio de aislamiento (`organization_id`) en todas las tablas | Mantener el nivel taller solo en la capa de aplicación si RLS se vuelve inmanejable |
| **R5** | Tiempo insuficiente por carga laboral o académica paralela | Media | Medio | Iteraciones cortas con entregable demostrable; reserva de 10 días en diciembre | Aplazar las historias no esenciales: HU-20, ya marcada `Could`, y HU-22, que pasaría a serlo |
| **R7** | Pérdida de trabajo por fallo de equipo | Baja | Alto | Control de versiones con repositorio remoto; integración frecuente | Recuperar desde el repositorio remoto |
| **R6** | No conseguir fuentes académicas suficientes de los últimos 5 años sobre RLS multi-tenant | Media | Bajo | Ampliar a arquitecturas comparables de otros rubros; usar tesis de maestría además de artículos | Documentar la escasez de literatura como hallazgo del estado del arte |

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

El proyecto se considera concluido cuando los tres objetivos específicos cuentan con su entregable verificable —según la tabla de trazabilidad de [anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) §1.7— y la suite de pruebas de aislamiento se ejecuta en verde de forma reproducible, con el detalle de condiciones que fija [Plan de pruebas](11-plan-pruebas.md) §6.3. Las funcionalidades excluidas del alcance (§1.8.3) no condicionan ese cierre.

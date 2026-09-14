# Plan de trabajo

Metodología, descomposición del trabajo, cronograma, hitos, restricciones y supuestos, riesgos, recursos, presupuesto y viabilidad del proyecto de grado. Período: **septiembre a diciembre de 2026**.

> Objetivos y alcance: [anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) · Requisitos: [Requisitos](02-requisitos.md) · Historias: [Historias de usuario](03-historias-usuario.md) · Verificación: [Plan de pruebas](11-plan-pruebas.md)

## 1. Metodología

**Desarrollo iterativo e incremental** en **iteraciones de dos semanas** que entregan **incrementos verticales** —de la interfaz de usuario a la base de datos—, no bloques por capa. El ciclo incremental no busca velocidad: busca **descubrir los riesgos técnicos desde las primeras iteraciones**, y por eso el esquema, las políticas y la autenticación van primero.

> El sustento teórico —desarrollo iterativo, integración continua y pruebas como especificación previa— está en el [Marco teórico](../anteproyecto/03-marco-teorico-y-conceptual.md) §3.2.5. Aquí se documenta su **aplicación**.

| Práctica | Aplicación |
|---|---|
| Iteraciones de 2 semanas | Ocho iteraciones, cada una con un incremento demostrable |
| Backlog trazable | Cada historia se traza a sus requisitos y cada requisito a su objetivo específico ([Requisitos](02-requisitos.md) §7) |
| Priorización MoSCoW | El MVP son los requisitos `Must` más los no funcionales bloqueantes ([Requisitos](02-requisitos.md) §6) |
| Corte vertical | Clientes se completa de punta a punta antes de expandir a inventario |
| Criterios de aceptación | Formato *Dado–Cuando–Entonces* en requisitos e historias |
| Definición de terminado | Tipos sin errores, casos en verde, cobertura ≥ 80 %, dependencias sin vulnerabilidades críticas ni altas, requisito trazado y documentación actualizada — las seis condiciones de [Plan de pruebas](11-plan-pruebas.md) §7.1 |
| Decisiones registradas | Toda decisión estructural se documenta como ADR antes de construirse |
| Calidad automatizada | ESLint y Prettier en *pre-commit*; verificación de tipos, pruebas, cobertura y auditoría de dependencias en el pipeline |
| Control de versiones | *Trunk-based* con ramas cortas; `main` y `release` protegidas; versionado semántico en `release` |
| Integración y despliegue continuos | `main` se publica en *staging* y `release` en producción, solo con pipeline aprobado |

**Por qué no Scrum formal**: el proyecto lo desarrolla una sola persona, por lo que las ceremonias de coordinación de equipo no aplican. Se conserva lo que aporta valor en un contexto individual: iteraciones cortas, incremento demostrable y definición de terminado explícita.

**Orden de escritura de las pruebas**: las pruebas de aislamiento se escriben **antes** que la funcionalidad que protegen. Es la mitigación del riesgo R1.

## 2. Descomposición del trabajo (EDT)

| Paquete | Entregables | Objetivo |
|---|---|---|
| **1 · Investigación y documentación** | 1.1 Revisión sistemática · 1.2 Análisis del mercado · 1.3 Especificación (requisitos, modelo, políticas, contrato, C4, plan de pruebas) · 1.4 Documento final | O1, O2 |
| **2 · Persistencia** | 2.1 Esquema de identidad y jerarquía · 2.2 Políticas y funciones de verificación · 2.3 Esquema de negocio y funciones atómicas · 2.4 Auditoría y permisos | O3 |
| **3 · Interfaz de programación** | 3.1 Autenticación y contexto activo · 3.2 Organizaciones, talleres y miembros · 3.3 Clientes · 3.4 Inventario · 3.5 Auditoría · 3.6 Descripción OpenAPI | O3 |
| **4 · Cliente web** | 4.1 Autenticación · 4.2 Selectores de contexto · 4.3 Módulos de clientes e inventario · 4.4 Instalabilidad y diseño responsivo | O3 |
| **5 · DevOps** | 5.1 Pipeline de integración continua · 5.2 Entornos de *staging* y producción · 5.3 Proyecto de validación desechable | O3, O4 |
| **6 · Validación** | 6.1 Suite de aislamiento C0–C3 · 6.2 Pruebas extremo a extremo y auditorías · 6.3 Evaluación de usabilidad · 6.4 Medición de costo | O4, O5, O6 |

**Dependencias y ruta crítica.** 1.3 Especificación y contrato → 2.1–2.2 Esquema y políticas → 3.1 Autenticación y contexto activo → 3.2 Organizaciones, talleres y miembros → 3.3–3.4 Clientes e inventario → 4.2–4.3 Cliente web → 6.1 Validación. El **contrato de la interfaz se cierra en I2**, antes de construir el cliente web; el reclutamiento de operadores (6.3) corre en paralelo desde I6 y no está en la ruta crítica, porque el objetivo 5 es descartable.

**Estimación.** En puntos de historia sobre una escala de Fibonacci ([Historias de usuario](03-historias-usuario.md)).

## 3. Fases y cronograma

Cuatro fases, una por objetivo núcleo. Los objetivos complementarios se ejecutan en F4 si superan su criterio de continuidad.

| Fase | Período | Objetivo | Resultado |
|---|---|---|---|
| **F1 · Diagnóstico** | 1–14 de septiembre | 1 | Estado del arte, análisis del mercado, enunciado del vacío y definición de la línea base |
| **F2 · Diseño** | 15–28 de septiembre | 2 | Requisitos, modelo de datos, políticas, decisiones, contrato, diagramas C4 y plan de pruebas |
| **F3 · Desarrollo** | 29 de septiembre – 7 de diciembre | 3 | Corte vertical publicado en *staging* y producción, con pipeline en verde |
| **F4 · Validación y cierre** | 8–21 de diciembre | 4 (5 y 6 si continúan) | Evidencia C0–C3, evaluaciones complementarias, documento final y defensa |

> **Qué relación guardan F1 y F2 con el anteproyecto.** El estado del arte, el marco teórico y el diseño que estas fases producen no parten de cero: el anteproyecto presentado para aprobación los adelanta, y F1 y F2 los consolidan como artefactos trazables a los requisitos. Lo que cierra septiembre es su versión revisada por el tutor (H1).

### Detalle por iteración

| Iteración | Fechas | Contenido | Entregable |
|---|---|---|---|
| **I1** | 1–14 sep | Revisión sistemática con el protocolo del estado del arte; relevamiento de las soluciones con presencia en Bolivia; definición de la línea base | Matriz del estado del arte · Análisis del mercado · Vacío redactado |
| **I2** | 15–28 sep | Requisitos, modelo jerárquico, políticas, contrato de la interfaz, diagramas C4 y estrategia de verificación | Especificación cerrada · Contrato · Plan de pruebas |
| **I3** | 29 sep – 12 oct | Esquema de identidad y jerarquía, políticas de aislamiento, **autenticación** con registro atómico y contexto activo; pipeline de integración continua | HU-01, HU-02, HU-03, HU-05, HU-07 |
| **I4** | 13–26 oct | Organizaciones adicionales, talleres, asignaciones y gestión de miembros con control de acceso por rol | HU-04, HU-06, HU-08, HU-09 a HU-12 |
| **I5** | 27 oct – 9 nov | Módulo de clientes — nivel organización, de punta a punta | HU-13, HU-14, HU-15 |
| **I6** | 10–23 nov | Módulo de inventario y movimientos — nivel taller · **reclutamiento de operadores** | HU-16 a HU-19 (HU-20 si hay margen) · 36 operadores contactados |
| **I7** | 24 nov – 7 dic | Cliente web, selectores de contexto, instalabilidad y diseño responsivo; pruebas extremo a extremo; publicación en *staging* y producción | Aplicación utilizable de extremo a extremo |
| **I8** | 8–21 dic | **Ejecución** de las tres corridas C0–C3 con su evidencia; sesiones con operadores; lectura diaria de consumo; redacción final y preparación de la defensa | HU-21, HU-22 · Evidencia de aislamiento · Informes complementarios · Documento final |

*Reserva: del 22 al 31 de diciembre, para correcciones posteriores a la revisión del tutor.*

> **Sobre HU-21 y su lugar en el cronograma.** Sus casos **no se escriben en I8**: cada módulo incorpora su caso de aislamiento antes que la funcionalidad que protege, desde I3. Lo que I8 concentra es la **ejecución del ciclo completo de validación** —las tres corridas C0–C3 sobre entornos reconstruidos ([Plan de pruebas](11-plan-pruebas.md) §6.5)— y la conservación de su evidencia. Los puntos de HU-21 se imputan a I8 porque es ahí donde se produce el entregable.

### Distribución de esfuerzo

| Bloque | Puntos de historia | Proporción |
|---|---|---|
| F1 · Diagnóstico | — | Investigación |
| F2 · Diseño | — | Modelado |
| F3 · Desarrollo | 65 | 86 % |
| F4 · Validación y cierre | 11 | 14 % |

## 4. Hitos y puntos de decisión

| Hito | Fecha | Criterio de cumplimiento |
|---|---|---|
| **H1 · Diagnóstico y diseño aprobados** | 28 de septiembre | Perfil y anteproyecto revisados por el tutor; especificación cerrada |
| **H2 · Arquitectura base** | 12 de octubre | Esquema, políticas, autenticación y contexto activo operativos; primer caso de aislamiento en verde |
| **H3 · Corte vertical completo** | 23 de noviembre | Clientes e inventario funcionando y probados · **decisión sobre el objetivo 5**: continúa si hay al menos 30 operadores confirmados |
| **H4 · Sistema integrado** | 7 de diciembre | Cliente web en *staging* con T1–T3 en verde · **decisión sobre el objetivo 6**: continúa si los proveedores exponen métricas de consumo diarias |
| **H5 · Validación concluida** | 21 de diciembre | C0–C3 en tres corridas con evidencia conservada; objetivos 5 y 6 ejecutados o descartados con su criterio; documento final entregado |

## 5. Restricciones y supuestos

Por cada criterio se distingue la **restricción** —lo que no se puede cambiar— del **supuesto** —lo que se asume sin poder garantizarlo—. Si un supuesto falla, la factibilidad cambia.

| Criterio | Restricción | Supuesto | Impacto |
|---|---|---|---|
| **Presupuesto** | Capa gratuita de Supabase y Vercel, según las tarifas consultadas el 14 de septiembre de 2026 (§7) | El corte vertical cabe en 500 MB de base de datos y en 1 millón de invocaciones mensuales | Determina que no haya gasto mensual |
| **Proyectos de base de datos** | El plan gratuito de Supabase admite 2 proyectos activos y los pausa tras 1 semana sin actividad | *Staging* puede pausarse durante I8 para liberar el proyecto de validación | Si falla, se requiere Supabase Pro |
| **Uso de la plataforma de despliegue** | El plan gratuito de Vercel es para uso personal no comercial | El proyecto académico y la evaluación con operadores no constituyen uso comercial | Si falla, se requiere Vercel Pro |
| **Seguridad** | Credencial privilegiada solo en el servidor; TLS en tránsito | El proveedor cifra los datos en reposo con AES-256, según su [declaración de seguridad](https://supabase.com/security) | Condición para exponer producción a operadores |
| **Tiempo** | 16 semanas; un solo desarrollador | Dedicación sostenida por iteración | Reserva de 10 días; objetivos complementarios descartables |
| **Competencias** | Ecosistema TypeScript | La curva de aprendizaje de Hono y Supabase es acotada | Ritmo de desarrollo de I3 e I4 |
| **Participantes** | 30 operadores del perfil | Se confirman durante I6 | Continuidad del objetivo 5 |

## 6. Riesgos

Impacto y probabilidad en escala baja / media / alta, ordenados por exposición. La mitigación es una acción concreta y verificable. El perfil reproduce el mismo orden sin la columna de contingencia ([perfil §13](../anteproyecto/00-perfil-proyecto.md)).

| ID | Riesgo | Prob. | Impacto | Mitigación | Plan de contingencia |
|---|---|---|---|---|---|
| **R1** | Las políticas de aislamiento resultan incorrectas o incompletas y permiten acceso cruzado | Media | **Alto** | Escribir las pruebas de aislamiento **antes** que la funcionalidad y ejecutarlas tras cada cambio de esquema o de política | Bloquear el avance hasta corregir; el aislamiento no admite deuda |
| **R2** | El alcance crece más allá de lo planificado | **Alta** | Medio | Exclusiones cerradas en §1.8.3; corte vertical definido | Congelar el alcance en H3; lo demás pasa a trabajo futuro |
| **R8** | No se consiguen 30 operadores o se retiran tras aceptar | **Alta** | Medio | Contactar a 36 durante I6; permitir sesiones remotas | Descartar el objetivo 5 en H3 según su criterio; reportar lo recolectado como hallazgo exploratorio |
| **R3** | Cambios de interfaz, límites o indisponibilidad de Supabase o Vercel | Media | Medio | Acceso al proveedor tras la capa de repositorios (ADR-009); aislamiento en el motor, no en el proveedor | Ejecutar PostgreSQL local para desarrollo y pruebas |
| **R9** | Se exceden los límites de la capa gratuita o se requieren tres proyectos simultáneos | Media | Medio | Pausar *staging* durante I8; vigilar el consumo en los paneles del proveedor | Contratar Supabase Pro durante I8 (§7) |
| **R4** | Las políticas se complican al añadir el segundo nivel | Media | Medio | Un solo criterio de aislamiento (`organization_id`) en todas las tablas (ADR-006) | Mantener el nivel taller solo en la capa de aplicación |
| **R5** | Tiempo insuficiente por carga laboral o académica paralela | Media | Medio | Iteraciones cortas con entregable; reserva de 10 días | Aplazar HU-20 (`Could`) y HU-22; descartar objetivos complementarios |
| **R7** | Pérdida de trabajo por fallo de equipo | Baja | Alto | Repositorio remoto e integración frecuente | Recuperar desde el repositorio remoto |
| **R6** | Fuentes académicas insuficientes de los últimos 5 años | Media | Bajo | Ampliar a arquitecturas comparables de otros rubros; admitir tesis de posgrado | Documentar la escasez como hallazgo del estado del arte |
| **R10** | Métricas de consumo insuficientes para imputar costo por organización | Media | Bajo | Registrar el identificador de organización en cada petición desde I7 | Descartar el objetivo 6 en H4; tratar el costo solo en §8 |

## 7. Recursos y presupuesto

La especificación técnica es lo que hace costeable el presupuesto. **Tarifas y límites consultados el 14 de septiembre de 2026** en las páginas de precios de [Supabase](https://supabase.com/pricing), [Vercel](https://vercel.com/pricing) y [GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions): los valores de esta sección corresponden a esa fecha, y cualquier cálculo posterior —incluido el del objetivo complementario 6— debe declarar la fecha de las tarifas que use.

| Categoría | Recurso | Especificación | Propósito | Costo mensual |
|---|---|---|---|---|
| Base de datos e identidad | Supabase, plan gratuito — 2 proyectos activos (*staging* y producción) | 500 MB de base de datos · CPU compartida con 500 MB de RAM · 5 GB de transferencia · 1 GB de almacenamiento de archivos · 50 000 usuarios activos mensuales · pausa tras 1 semana sin actividad | Pruebas integradas y evaluación con operadores | USD 0 |
| Proyecto de validación | Supabase, proyecto desechable | Mismas especificaciones; ocupa el lugar de *staging* durante I8 | Condiciones C0–C3 | USD 0 |
| Cómputo serverless | Vercel, plan gratuito (Hobby) | 1 millón de invocaciones y 100 GB de transferencia al mes · uso personal no comercial | *Staging* y producción | USD 0 |
| Integración continua | GitHub y GitHub Actions, plan gratuito | Ejecutores estándar alojados por GitHub: sin costo en repositorio público; 2000 minutos al mes incluidos en repositorio privado | Pipeline en cada integración | USD 0 |
| Desarrollo | Equipo personal; editor y herramientas de código abierto | — | Construcción | USD 0 |
| Fuentes académicas | Google Scholar, IEEE Xplore, ACM, Scopus, BASE, OATD | Acceso institucional | Revisión sistemática | USD 0 |

**Presupuesto mensual de *staging* y producción: USD 0** dentro de la capa gratuita, coherente con RNF-302.

**Presupuesto de contingencia.** Si se exceden los límites o deben coexistir tres proyectos: Supabase Pro, desde USD 25 al mes (8 GB de disco por proyecto, 250 GB de transferencia, sin pausa por inactividad); y, si la restricción de uso no comercial de Vercel resultara aplicable, Vercel Pro, USD 20 al mes. **Techo previsto: USD 45 al mes**, solo durante los meses en que la contingencia se active.

## 8. Análisis de viabilidad

| Dimensión | Evaluación |
|---|---|
| **Técnica** | Stack maduro y compatible: seguridad a nivel de fila nativa en PostgreSQL, identidad del proveedor evaluable dentro de las políticas, adaptador oficial de Hono para Vercel y TypeScript de extremo a extremo. El desarrollador domina el ecosistema TypeScript |
| **Operativa** | Servicios gestionados sin servidores que operar; publicación automática tras el pipeline; paneles de consumo y registros del proveedor como observabilidad; mantenimiento sostenible por una persona |
| **Temporal** | Ocho iteraciones con incremento verificable, 10 días de reserva y dos objetivos complementarios descartables que liberan I8 si falta tiempo. El cronograma tiene holgura explícita, no solo optimismo |
| **Económica** | USD 0 al mes en capa gratuita, con un techo de contingencia de USD 45 al mes; sin licencias. El objetivo complementario 6 cuantifica el costo por organización |

## 9. Criterio de cierre

El proyecto se considera concluido cuando los **cuatro objetivos núcleo** cuentan con su entregable verificable —según la tabla de trazabilidad de [anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) §1.7.3—, los **objetivos complementarios** se han ejecutado o descartado según su criterio de continuidad, y la suite de aislamiento se ha ejecutado en tres corridas reproducibles con las condiciones que fija [Plan de pruebas](11-plan-pruebas.md) §7.3. Las funcionalidades excluidas del alcance (§1.8.3) no condicionan ese cierre.

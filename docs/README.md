# Documentación del proyecto de grado

**Diseño y validación de una arquitectura multi-tenant jerárquica con RLS para aislamiento verificable e inmutable en mantenimiento mecánico.**

Maestría en Full Stack Development · Universidad Católica Boliviana "San Pablo" · Septiembre – diciembre de 2026

---

## Base normativa

Toda la documentación se ajusta **estrictamente** a la [Guía de Investigación Aplicada y Desarrollo Full Stack](<Guía de Investigación Aplicada y Desarrollo Full Stack.md>): fija el contenido mínimo del documento final (§15), los criterios de redacción de problema, objetivos, hipótesis y variables (§2–§6), el diseño metodológico (§7) y la propuesta técnica (§8–§13), y la revisión de consistencia con que se cierra (§14). Si un documento contradice la guía, se corrige el documento.

## Cómo está organizada

La documentación se divide en dos: el **anteproyecto** es el documento académico que se entrega y defiende; los **artefactos de ingeniería** son la especificación técnica que lo sustenta y que gobierna la construcción del sistema.

### [anteproyecto/](anteproyecto/README.md) — el documento académico

| # | Capítulo | Qué establece |
|---|---|---|
| — | [**Anteproyecto integrado**](anteproyecto/04-anteproyecto-integrado.md) | **El documento de entrega**: los 29 puntos de la guía en dos partes —Parte I · Investigación y Parte II · Propuesta técnica— y el anexo de revisión de consistencia |
| — | [**Perfil de proyecto**](anteproyecto/00-perfil-proyecto.md) | El documento que se presenta para aprobación: condensa los capítulos en la estructura del perfil, con matriz de consistencia, cronograma, presupuesto y viabilidad |
| 1 | [Definición y alcance](anteproyecto/01-definicion-y-alcance.md) | Tema, árbol de problemas, cuatro delimitaciones, preguntas, objetivos, alcance, exclusiones y justificación |
| 2 | [Antecedentes y estado del arte](anteproyecto/02-antecedentes-y-estado-del-arte.md) | Contexto del sector, antecedentes tecnológicos, revisión sistemática y vacío de investigación |
| 3 | [Marco teórico y conceptual](anteproyecto/03-marco-teorico-y-conceptual.md) | Glosario técnico operacional, teorías que justifican cada decisión, enfoque de investigación y revisión crítica |
| — | [Anexo · Verificación de referencias](anteproyecto/anexo-referencias.md) | Estado de comprobación de cada fuente citada |

### [ingenieria/](ingenieria/) — los artefactos que lo sustentan

| # | Documento | Qué establece |
|---|---|---|
| 1 | [Glosario](ingenieria/01-glosario.md) | Terminología del dominio, de la arquitectura y de la investigación. **Leer antes que el resto** |
| 2 | [Requisitos](ingenieria/02-requisitos.md) | Actores, requisitos funcionales con criterios *Dado–Cuando–Entonces*, reglas de negocio, no funcionales con métrica y umbral, requisitos de seguridad, MVP y trazabilidad |
| 3 | [Historias de usuario](ingenieria/03-historias-usuario.md) | Los requisitos desde la perspectiva de quien usa el sistema |
| 4 | [Arquitectura](ingenieria/04-arquitectura.md) | Estilo arquitectónico, diagramas C4, capas, integración, persistencia, seguridad y matriz de selección tecnológica |
| 5 | [Modelo de datos](ingenieria/05-modelo-datos.md) | Entidades, relaciones, restricciones y políticas de aislamiento |
| 6 | [Seguridad](ingenieria/06-seguridad.md) | Autenticación, control de acceso, aislamiento en dos capas y superficie de exposición |
| 7 | [Decisiones de diseño](ingenieria/07-decisiones-diseno.md) | Por qué se eligió cada opción, con las alternativas evaluadas |
| 8 | [Plan de trabajo](ingenieria/08-plan-trabajo.md) | Metodología, EDT, cronograma, hitos, riesgos, restricciones y supuestos, recursos, presupuesto y viabilidad |
| 9 | [Análisis del mercado](ingenieria/09-analisis-mercado.md) | Soluciones existentes en Bolivia, comparativo y funcionalidades desatendidas |
| 10 | [Contrato de la interfaz de programación](ingenieria/10-contrato-api.md) | Rutas, contexto activo, códigos de error y reglas de no divulgación |
| 11 | [Plan de pruebas y validación](ingenieria/11-plan-pruebas.md) | Estrategia multinivel, KPIs, condiciones C0–C3, matriz requisito → caso → evidencia y evaluaciones complementarias |
| 12 | [Material de campo](ingenieria/12-material-de-campo.md) | Consentimiento informado, guion de tareas T1–T3, planilla de registro y cuestionario SUS en español para la evaluación con operadores |

---

## Cómo se relacionan

La secuencia reproduce la cadena de coherencia de la guía (§14): cada eslabón se justifica por el anterior.

```
Problema ──> Objetivos ──> Solución propuesta ──> Requerimientos ──> Arquitectura
(cap. 1–2)   (cap. 1)      (anteproyecto §21)     (Requisitos)       (Arquitectura · Modelo · Seguridad · ADR)
                                                                           │
Planificación <── Validación <── Metodología de desarrollo <── Tecnologías ─┘
(Plan de trabajo)  (Plan de pruebas)  (Plan de trabajo)        (matriz de selección)
```

## Fuente de verdad por tema

Antes de escribir sobre un tema, verificar quién es su responsable. Si ya lo tiene, **enlazar** en lugar de duplicar.

**Regla para los dos documentos condensados.** El [Perfil de proyecto](anteproyecto/00-perfil-proyecto.md) y el [Anteproyecto integrado](anteproyecto/04-anteproyecto-integrado.md) **resumen** los documentos responsables; salvo lo que la tabla asigna al anteproyecto integrado, **no son fuente de verdad**. Si un dato cambia, se corrige primero en el documento responsable y después se replica en ambos.

| Tema | Documento responsable |
|---|---|
| Estructura exigida del documento y criterios metodológicos | [Guía de Investigación Aplicada y Desarrollo Full Stack](<Guía de Investigación Aplicada y Desarrollo Full Stack.md>) |
| Terminología del dominio y alcance de cada dato por nivel | [ingenieria/01-glosario.md](ingenieria/01-glosario.md) |
| Título, problema, delimitación, preguntas, objetivos, alcance, exclusiones y justificación | [anteproyecto/01-definicion-y-alcance.md](anteproyecto/01-definicion-y-alcance.md) |
| Antecedentes, protocolo de revisión, estado del arte y vacío | [anteproyecto/02-antecedentes-y-estado-del-arte.md](anteproyecto/02-antecedentes-y-estado-del-arte.md) · [anexo-referencias.md](anteproyecto/anexo-referencias.md) |
| Definición formal de una tecnología y teoría que justifica una decisión | [anteproyecto/03-marco-teorico-y-conceptual.md](anteproyecto/03-marco-teorico-y-conceptual.md) |
| Hipótesis, variables, operacionalización y matriz de consistencia | [anteproyecto/04-anteproyecto-integrado.md](anteproyecto/04-anteproyecto-integrado.md) §10–§13 |
| Enfoque, diseño, población, muestra, técnicas, instrumentos y estrategia de análisis | [anteproyecto/04-anteproyecto-integrado.md](anteproyecto/04-anteproyecto-integrado.md) §14–§18 |
| Consideraciones éticas | [anteproyecto/04-anteproyecto-integrado.md](anteproyecto/04-anteproyecto-integrado.md) §19 · [ingenieria/11-plan-pruebas.md](ingenieria/11-plan-pruebas.md) §8.5 para la sesión con operadores |
| Actores, requisitos, reglas de negocio, requisitos de seguridad y MVP | [ingenieria/02-requisitos.md](ingenieria/02-requisitos.md) |
| Cómo lo vive quien lo usa | [ingenieria/03-historias-usuario.md](ingenieria/03-historias-usuario.md) |
| Estilo arquitectónico, C4 y matriz de selección tecnológica | [ingenieria/04-arquitectura.md](ingenieria/04-arquitectura.md) |
| Entidades y restricciones | [ingenieria/05-modelo-datos.md](ingenieria/05-modelo-datos.md) |
| Aislamiento y control de acceso | [ingenieria/06-seguridad.md](ingenieria/06-seguridad.md) |
| Por qué se diseñó así | [ingenieria/07-decisiones-diseno.md](ingenieria/07-decisiones-diseno.md) |
| EDT, cronograma, hitos, riesgos, restricciones y supuestos, recursos, presupuesto y viabilidad | [ingenieria/08-plan-trabajo.md](ingenieria/08-plan-trabajo.md) |
| Contexto de mercado y análisis comparativo | [ingenieria/09-analisis-mercado.md](ingenieria/09-analisis-mercado.md) |
| Rutas, cabeceras y códigos de error de la API | [ingenieria/10-contrato-api.md](ingenieria/10-contrato-api.md) |
| Estrategia de pruebas, KPIs, matriz de validación y evidencia | [ingenieria/11-plan-pruebas.md](ingenieria/11-plan-pruebas.md) |
| Instrumentos de la evaluación con operadores | [ingenieria/12-material-de-campo.md](ingenieria/12-material-de-campo.md) |

## Pendientes

Lo que falta resolver antes de la entrega final —datos por completar, fuentes por leer y decisiones que corresponden al autor— está en un registro único: **[PENDIENTES.md](PENDIENTES.md)**. Los documentos de entrega se mantienen limpios de notas internas; todo lo que quede por decidir vive ahí.

## Premisas que rigen toda la documentación

- **Dominio y delimitación**: el título declara la aplicabilidad al **servicio de mantenimiento mecánico**; el estudio se **valida** sobre el servicio de motocicletas en **Bolivia**, que es de donde proceden los datos oficiales, la oferta relevada y los operadores de la evaluación de usabilidad.
- **Modelo jerárquico**: una cuenta administra varias **organizaciones**; cada organización opera varios **talleres**. La organización es la unidad de aislamiento; el taller, una subdivisión operativa.
- **Aislamiento en dos capas**: políticas en el motor de base de datos, más verificación en la capa de aplicación.
- **Inmutabilidad del aislamiento**: la separación **no puede desactivarse desde la aplicación**, y eso es comprobable — se anula la verificación de membresía y las políticas siguen filtrando (RNF-102). No confundir con el historial inmutable, que es de dos tablas.
- **Línea base**: la arquitectura se contrasta con el aislamiento resuelto **solo en la capa de aplicación**, que es lo que hace hoy la oferta relevada.
- **Cuatro objetivos núcleo y dos complementarios**: diagnosticar, diseñar, desarrollar y validar; la usabilidad y el costo se evalúan como objetivos complementarios, con un criterio de continuidad que permite descartarlos sin afectar la tesis.
- **Alcance acotado**: se especifica el sistema completo, pero se construye y valida el corte vertical que demuestra el modelo jerárquico. Lo excluido está declarado de forma explícita.
- **La documentación precede a la construcción**: define el sistema a construir; no describe un estado de avance. Cuando la construcción difiera de lo aquí especificado, **se corrige la construcción** — salvo que la diferencia revele un error de la especificación, en cuyo caso se enmienda el documento responsable y, si la decisión era estructural, se registra un ADR.

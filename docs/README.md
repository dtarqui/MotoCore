# Documentación del proyecto de grado

**Diseño, implementación y validación de una arquitectura multi-tenant jerárquica con aislamiento verificable en la base de datos para empresas de servicio de motocicletas en Bolivia.**

Maestría en Full Stack Development · Universidad Católica Boliviana "San Pablo" · Septiembre – diciembre de 2026

---

## Cómo está organizada

La documentación se divide en dos: el **anteproyecto** es el documento académico que se entrega y defiende; los **artefactos de ingeniería** son la especificación técnica que lo sustenta y que gobierna la construcción del sistema.

### [anteproyecto/](anteproyecto/README.md) — el documento académico

| # | Capítulo | Qué establece |
|---|---|---|
| — | [**Anteproyecto integrado**](anteproyecto/04-anteproyecto-integrado.md) | **El documento de entrega**: responde a los 16 puntos exigidos, incluidos hipótesis, operacionalización de variables, matriz de consistencia, diseño de investigación y población y muestra |
| — | [**Perfil de proyecto**](anteproyecto/00-perfil-proyecto.md) | El documento que se presenta para aprobación: condensa los tres capítulos en la estructura del perfil, con matriz de consistencia, cronograma y presupuesto |
| 1 | [Definición y alcance](anteproyecto/01-definicion-y-alcance.md) | Tema, problema, preguntas, objetivos y fronteras del proyecto |
| 2 | [Antecedentes y estado del arte](anteproyecto/02-antecedentes-y-estado-del-arte.md) | Contexto del sector, literatura revisada y vacío de investigación |
| 3 | [Marco teórico y conceptual](anteproyecto/03-marco-teorico-y-conceptual.md) | Definiciones formales, teorías que justifican cada decisión y revisión crítica |
| — | [Anexo · Verificación de referencias](anteproyecto/anexo-referencias.md) | Estado de comprobación de cada fuente citada |

### [ingenieria/](ingenieria/) — los artefactos que lo sustentan

| # | Documento | Qué establece |
|---|---|---|
| 1 | [Glosario](ingenieria/01-glosario.md) | Terminología del dominio y de la arquitectura. **Leer antes que el resto** |
| 2 | [Requisitos](ingenieria/02-requisitos.md) | Requisitos funcionales y no funcionales, con criterios de verificación |
| 3 | [Historias de usuario](ingenieria/03-historias-usuario.md) | Los requisitos desde la perspectiva de quien usa el sistema |
| 4 | [Arquitectura](ingenieria/04-arquitectura.md) | Estructura general, capas, tecnologías y modelo jerárquico |
| 5 | [Modelo de datos](ingenieria/05-modelo-datos.md) | Entidades, relaciones, restricciones y políticas de aislamiento |
| 6 | [Seguridad](ingenieria/06-seguridad.md) | Autenticación, control de acceso y aislamiento en dos capas |
| 7 | [Decisiones de diseño](ingenieria/07-decisiones-diseno.md) | Por qué se eligió cada opción, con las alternativas evaluadas |
| 8 | [Plan de trabajo](ingenieria/08-plan-trabajo.md) | Metodología, cronograma por iteraciones, hitos y riesgos |
| 9 | [Análisis del mercado](ingenieria/09-analisis-mercado.md) | Soluciones existentes en Bolivia y funcionalidades desatendidas |
| 10 | [Contrato de la interfaz de programación](ingenieria/10-contrato-api.md) | Rutas, contexto activo, códigos de error y reglas de no divulgación |
| 11 | [Plan de pruebas y validación](ingenieria/11-plan-pruebas.md) | Niveles de prueba y matriz requisito → caso → evidencia |

---

## Cómo se relacionan

```
Capítulos 1–3 ──>  definen el problema, la literatura y los objetivos
      │
      ├──> Marco teórico y conceptual  (fundamenta las decisiones que vienen después)
      │
      ├──> Perfil de proyecto      ┐  condensan los capítulos para
      ├──> Anteproyecto integrado  ┘  presentación y entrega — no son fuente de verdad
      │
      v
Glosario      ──>  fija el lenguaje
      │
      v
Requisitos    ──>  traducen los objetivos en condiciones verificables
      │
      ├──> Historias de usuario   (los mismos requisitos, en lenguaje de uso)
      │
      v
Diseño        ──>  arquitectura, datos y seguridad resuelven los requisitos
      │
      ├──> Decisiones de diseño   (registran por qué se resolvió así)
      │
      v
Contrato de API ──> fija la interfaz que se construye
      │
      v
Plan de pruebas ──> fija con qué evidencia se da por cumplido cada requisito
      │
      v
Plan de trabajo ──> ordena la construcción en el tiempo
```

## Fuente de verdad por tema

Antes de escribir sobre un tema, verificar quién es su responsable. Si ya lo tiene, **enlazar** en lugar de duplicar.

**Regla adicional para los dos documentos condensados.** El [Perfil de proyecto](anteproyecto/00-perfil-proyecto.md) y el [Anteproyecto integrado](anteproyecto/04-anteproyecto-integrado.md) **resumen** los capítulos 1–3 para presentarlos con la estructura que exige cada entrega; **no son fuente de verdad de ningún tema**. Si un dato cambia, se corrige primero en el documento responsable de la tabla siguiente y después se replica en ambos. Nunca al revés.

| Tema | Documento responsable |
|---|---|
| Terminología del dominio y alcance de cada dato por nivel | [ingenieria/01-glosario.md](ingenieria/01-glosario.md) |
| Título del proyecto y formulación del objetivo general | [anteproyecto/01-definicion-y-alcance.md](anteproyecto/01-definicion-y-alcance.md) §1.1 y §1.6 |
| Hipótesis, variables y operacionalización | [anteproyecto/04-anteproyecto-integrado.md](anteproyecto/04-anteproyecto-integrado.md) §10–§12 |
| Enfoque, diseño de investigación, población y muestra | [anteproyecto/04-anteproyecto-integrado.md](anteproyecto/04-anteproyecto-integrado.md) §14–§16 |
| Fuentes del estado del arte y su verificación | [anteproyecto/02-antecedentes-y-estado-del-arte.md](anteproyecto/02-antecedentes-y-estado-del-arte.md) §2.2 · [anexo-referencias.md](anteproyecto/anexo-referencias.md) |
| Definición formal de una tecnología, con su fuente | [anteproyecto/03-marco-teorico-y-conceptual.md](anteproyecto/03-marco-teorico-y-conceptual.md) §3.1 |
| Teoría o modelo que justifica una decisión | [anteproyecto/03-marco-teorico-y-conceptual.md](anteproyecto/03-marco-teorico-y-conceptual.md) §3.2 |
| Objetivos, alcance y exclusiones | [anteproyecto/01-definicion-y-alcance.md](anteproyecto/01-definicion-y-alcance.md) |
| Vacío de investigación frente a la literatura | [anteproyecto/02-antecedentes-y-estado-del-arte.md](anteproyecto/02-antecedentes-y-estado-del-arte.md) §2.3 |
| Qué debe hacer el sistema | [ingenieria/02-requisitos.md](ingenieria/02-requisitos.md) |
| Cómo lo vive quien lo usa | [ingenieria/03-historias-usuario.md](ingenieria/03-historias-usuario.md) |
| Cómo está estructurado | [ingenieria/04-arquitectura.md](ingenieria/04-arquitectura.md) |
| Entidades y restricciones | [ingenieria/05-modelo-datos.md](ingenieria/05-modelo-datos.md) |
| Aislamiento y control de acceso | [ingenieria/06-seguridad.md](ingenieria/06-seguridad.md) |
| Por qué se diseñó así | [ingenieria/07-decisiones-diseno.md](ingenieria/07-decisiones-diseno.md) |
| Cuándo se hace cada cosa · cronograma, hitos, riesgos y presupuesto | [ingenieria/08-plan-trabajo.md](ingenieria/08-plan-trabajo.md) |
| Contexto de mercado | [ingenieria/09-analisis-mercado.md](ingenieria/09-analisis-mercado.md) |
| Rutas, cabeceras y códigos de error de la API | [ingenieria/10-contrato-api.md](ingenieria/10-contrato-api.md) |
| Con qué evidencia se verifica cada requisito | [ingenieria/11-plan-pruebas.md](ingenieria/11-plan-pruebas.md) |

## Pendientes

Lo que falta resolver antes de la entrega final, las decisiones que corresponden al autor y las correcciones que el código debe absorber están en un registro único: **[PENDIENTES.md](PENDIENTES.md)**. Los documentos de entrega se mantienen limpios de notas internas; todo lo que quede por decidir vive ahí.

## Premisas que rigen toda la documentación

- **Mercado objetivo**: Bolivia.
- **Modelo jerárquico**: una cuenta administra varias **empresas**; cada empresa opera varias **sucursales**. La empresa es la unidad de aislamiento; la sucursal, una subdivisión operativa.
- **Aislamiento en dos capas**: políticas en el motor de base de datos, más verificación en la capa de aplicación.
- **Alcance acotado**: se especifica el sistema completo, pero se construye y valida el corte vertical que demuestra el modelo jerárquico. Lo excluido está declarado de forma explícita.
- **La documentación precede a la construcción**: define el sistema a construir; no describe un estado de avance. Cuando la implementación difiera de lo aquí especificado, **se corrige la implementación** — salvo que la diferencia revele un error de la especificación, en cuyo caso se enmienda el documento responsable y, si la decisión era estructural, se registra un ADR.

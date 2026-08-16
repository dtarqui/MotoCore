# Documentación del proyecto de grado

**Arquitectura multi-tenant jerárquica con aislamiento a nivel de base de datos, para la gestión centralizada de empresas de servicio de motocicletas en Bolivia.**

Maestría en Full Stack Development · Universidad Católica Boliviana "San Pablo" · Septiembre – diciembre de 2026

---

## Cómo está organizada

La documentación se divide en dos: el **anteproyecto** es el documento académico que se entrega y defiende; los **artefactos de ingeniería** son la especificación técnica que lo sustenta y que gobierna la construcción del sistema.

### [anteproyecto/](anteproyecto/README.md) — el documento académico

| # | Capítulo | Qué establece |
|---|---|---|
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

---

## Cómo se relacionan

```
Anteproyecto  ──>  define el problema y los objetivos
      │
      ├──> Marco teórico y conceptual  (fundamenta las decisiones que vienen después)
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
Plan de trabajo ──> ordena la construcción en el tiempo
```

## Fuente de verdad por tema

Antes de escribir sobre un tema, verificar quién es su responsable. Si ya lo tiene, **enlazar** en lugar de duplicar.

| Tema | Documento responsable |
|---|---|
| Terminología del dominio y alcance de cada dato por nivel | [ingenieria/01-glosario.md](ingenieria/01-glosario.md) |
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
| Cuándo se hace cada cosa | [ingenieria/08-plan-trabajo.md](ingenieria/08-plan-trabajo.md) |
| Contexto de mercado | [ingenieria/09-analisis-mercado.md](ingenieria/09-analisis-mercado.md) |

## Premisas que rigen toda la documentación

- **Mercado objetivo**: Bolivia.
- **Modelo jerárquico**: una cuenta administra varias **empresas**; cada empresa opera varias **sucursales**. La empresa es la unidad de aislamiento; la sucursal, una subdivisión operativa.
- **Aislamiento en dos capas**: políticas en el motor de base de datos, más verificación en la capa de aplicación.
- **Alcance acotado**: se especifica el sistema completo, pero se construye y valida el corte vertical que demuestra el modelo jerárquico. Lo excluido está declarado de forma explícita.
- **La documentación precede a la construcción**: define el sistema a construir; no describe un estado de avance.

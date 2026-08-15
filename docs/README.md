# Documentación del proyecto de grado

**Arquitectura multi-tenant jerárquica con aislamiento a nivel de base de datos, para la gestión centralizada de empresas de servicio de motocicletas en Bolivia.**

Maestría en Full Stack Development · Universidad Católica Boliviana "San Pablo" · Septiembre – diciembre de 2026

---

## Orden de lectura

La documentación está numerada para leerse en secuencia: cada documento asume lo establecido en los anteriores.

### Punto de partida — el anteproyecto

| # | Documento | Qué establece |
|---|---|---|
| 1 | [Definición y alcance](anteproyecto/01-definicion-y-alcance.md) | Tema, problema, preguntas, objetivos y fronteras del proyecto |
| 2 | [Antecedentes y estado del arte](anteproyecto/02-antecedentes-y-estado-del-arte.md) | Contexto del sector, literatura revisada y vacío de investigación |
| 3 | [Marco teórico y conceptual](anteproyecto/03-marco-teorico-y-conceptual.md) | Definiciones formales, teorías que justifican cada decisión y revisión crítica |
| — | [Verificación de referencias](anteproyecto/verificacion-referencias.md) | Anexo: estado de comprobación de cada fuente citada |

### Especificación — qué debe hacer el sistema

| # | Documento | Qué establece |
|---|---|---|
| 1 | [Glosario](01-glosario.md) | Terminología del dominio y de la arquitectura. **Leer antes que el resto** |
| 2 | [Requisitos](02-requisitos.md) | Requisitos funcionales y no funcionales, con criterios de verificación |
| 3 | [Historias de usuario](03-historias-usuario.md) | Los requisitos desde la perspectiva de quien usa el sistema |

### Diseño — cómo se resuelve

| # | Documento | Qué establece |
|---|---|---|
| 4 | [Arquitectura](04-arquitectura.md) | Estructura general, capas, tecnologías y modelo jerárquico |
| 5 | [Modelo de datos](05-modelo-datos.md) | Entidades, relaciones, restricciones y políticas de aislamiento |
| 6 | [Seguridad](06-seguridad.md) | Autenticación, control de acceso y aislamiento en dos capas |
| 7 | [Decisiones de diseño](07-decisiones-diseno.md) | Por qué se eligió cada opción, con las alternativas evaluadas |

### Ejecución y contexto

| # | Documento | Qué establece |
|---|---|---|
| 8 | [Plan de trabajo](08-plan-trabajo.md) | Metodología, cronograma por iteraciones, hitos y riesgos |
| 9 | [Análisis del mercado](09-analisis-mercado.md) | Soluciones existentes en Bolivia y funcionalidades desatendidas |

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
| Terminología del dominio | [01-glosario.md](01-glosario.md) |
| Definición formal de una tecnología, con su fuente | [anteproyecto/03-marco-teorico-y-conceptual.md](anteproyecto/03-marco-teorico-y-conceptual.md) §3.1 |
| Teoría o modelo que justifica una decisión | [anteproyecto/03-marco-teorico-y-conceptual.md](anteproyecto/03-marco-teorico-y-conceptual.md) §3.2 |
| Objetivos, alcance y exclusiones | [anteproyecto/01-definicion-y-alcance.md](anteproyecto/01-definicion-y-alcance.md) |
| Qué debe hacer el sistema | [02-requisitos.md](02-requisitos.md) |
| Cómo lo vive quien lo usa | [03-historias-usuario.md](03-historias-usuario.md) |
| Cómo está estructurado | [04-arquitectura.md](04-arquitectura.md) |
| Entidades y restricciones | [05-modelo-datos.md](05-modelo-datos.md) |
| Aislamiento y control de acceso | [06-seguridad.md](06-seguridad.md) |
| Por qué se diseñó así | [07-decisiones-diseno.md](07-decisiones-diseno.md) |
| Cuándo se hace cada cosa | [08-plan-trabajo.md](08-plan-trabajo.md) |
| Contexto de mercado | [09-analisis-mercado.md](09-analisis-mercado.md) |

## Premisas que rigen toda la documentación

- **Mercado objetivo**: Bolivia.
- **Modelo jerárquico**: una cuenta administra varias **empresas**; cada empresa opera varias **sucursales**. La empresa es la unidad de aislamiento; la sucursal, una subdivisión operativa.
- **Aislamiento en dos capas**: políticas en el motor de base de datos, más verificación en la capa de aplicación.
- **Alcance acotado**: se especifica el sistema completo, pero se construye y valida el corte vertical que demuestra el modelo jerárquico. Lo excluido está declarado de forma explícita.
- **La documentación precede a la construcción**: define el sistema a construir; no describe un estado de avance.

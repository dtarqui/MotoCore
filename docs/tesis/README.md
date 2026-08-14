# Proyecto de grado de maestría — MotoCore

Documentación del Anteproyecto de Maestría (Full Stack Development), alineada sesión por sesión con el **Seminario del Proyecto de Maestría** (ver `docs/diapositivas/`). Se avanza **solo hasta donde el seminario ya cubrió** — no se adelanta contenido de sesiones futuras.

## Estado: 2 de N sesiones cubiertas

| Sesión | Tema | Archivo | Estado |
|---|---|---|---|
| 1 | Definición y Alcance del Proyecto | [01-definicion-y-alcance.md](01-definicion-y-alcance.md) | **Completo** — tema, problema, delimitación (sep–dic 2026), preguntas, 8 objetivos específicos con trazabilidad, alcance y exclusiones cerradas |
| 2 | Antecedentes y Estado del Arte | [02-antecedentes-y-estado-del-arte.md](02-antecedentes-y-estado-del-arte.md) | **Completo** — antecedentes del sector con datos del INE, matriz de extracción con 3 fuentes revisadas por pares (ACM SIGMOD, MDPI, tesis de maestría), vacío de investigación redactado y referencias |

Cuando tengas la siguiente sesión del seminario, se agrega el siguiente archivo (`03-...`) — no se escribe contenido de capítulos que el curso todavía no cubrió.

Los artefactos de ingeniería que sustentan estos capítulos (requisitos, historias de usuario, modelo de datos, plan de trabajo, decisiones de arquitectura) viven en [`docs/`](../README.md) y se referencian desde aquí, sin duplicarse.

## Reglas que rigen todo este documento (de las diapositivas del profesor)

- **Nivel maestría, no pregrado**: arquitectura, escalabilidad, seguridad, integración tecnológica — no solo "software funcional". El proyecto ya califica por diseño: serverless (Vercel), BD cloud gestionada (Supabase), aislamiento por Row-Level Security.
- **El problema no es "falta de software"** — es el impacto negativo real de esa ausencia. Bien delimitado (espacial, temporal, técnico) = proyecto resuelto al 50%.
- **Objetivos con verbos de ingeniería**: Analizar, Diseñar/Modelar, Implementar/Desarrollar, Validar/Evaluar — nunca "conocer", "entender", "hacer".
- **Alcance = contrato con el tribunal**: funcional + técnico + exclusiones explícitas.
- **Estado del Arte = solo fuentes revisadas por pares**, últimos 5 años. Antecedentes ≠ Estado del Arte (uno es local/histórico, el otro es la frontera científica global).
- El objetivo de leer literatura no es resumirla, es encontrar su **Vacío de Investigación** (el "SIN EMBARGO" que este proyecto resuelve).

## Índice

1. [Definición y Alcance del Proyecto](01-definicion-y-alcance.md)
2. [Antecedentes y Estado del Arte](02-antecedentes-y-estado-del-arte.md)

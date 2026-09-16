# Material de campo — evaluación de usabilidad con operadores

Instrumentos que se aplican en las sesiones del **objetivo complementario 5**, cuyo diseño, umbrales y análisis define el [Plan de pruebas](11-plan-pruebas.md), sección 8. Este documento **no decide nada**: redacta lo que allí se especifica, en la forma en que llegará al participante.

Se prepara por escrito **antes** de I8 porque un instrumento improvisado en la sesión no es replicable, y porque la guía metodológica exige instrumentos probados y validados previamente. Su prueba piloto está en el [Plan de pruebas](11-plan-pruebas.md), sección 8.9.

| Pieza | Sección | Cuándo se usa |
|---|---|---|
| Consentimiento informado | [Sección 2](#2-consentimiento-informado) | Antes de empezar, firmado |
| Guion de tareas T1–T3 | [Sección 3](#3-guion-de-tareas) | Durante la sesión, leído literalmente |
| Planilla de registro | [Sección 4](#4-planilla-de-registro) | Durante la sesión, la completa el observador |
| Cuestionario SUS en español | [Sección 5](#5-cuestionario-sus-en-español) | Al terminar cada condición |
| Asignación contrabalanceada | [Sección 6](#6-asignación-contrabalanceada) | Al reclutar, fija el orden de cada participante |

---

## 1. Antes de la sesión

| Requisito | Detalle |
|---|---|
| **Escenario cargado** | Dos organizaciones con dos talleres cada una, clientes e inventario precargados ([Plan de pruebas](11-plan-pruebas.md), sección 3.2), y el escenario de línea base con una cuenta por local (sección 3.3 del mismo documento) |
| **Credenciales** | Preparadas y probadas para las dos condiciones, con la sesión cerrada al iniciar |
| **Cronómetro** | Uno por tarea; se detiene al declarar el participante que terminó |
| **Duración prevista** | 40 minutos por participante, incluidas las dos condiciones |
| **Modalidad** | Presencial o remota; en remoto, el participante comparte pantalla y **no se graba** |

---

## 2. Consentimiento informado

> **Evaluación de usabilidad — Proyecto de grado, Maestría en Full Stack Development, Universidad Católica Boliviana «San Pablo»**
>
> **Qué se evalúa.** Se evalúa un sistema de gestión para talleres de mantenimiento. **No se evalúa a usted**: no hay respuestas correctas ni incorrectas, y cualquier dificultad que aparezca es un resultado útil para corregir el sistema.
>
> **En qué consiste.** Realizará tres tareas breves en dos versiones distintas del sistema, y responderá un cuestionario de diez preguntas después de cada versión. La sesión dura alrededor de 40 minutos.
>
> **Qué se registra.** Si completa o no cada tarea, cuánto tarda, las dificultades observadas y sus respuestas al cuestionario. **No se graba vídeo ni audio**, y no se registra ningún dato que permita identificarlo a usted o a su organización.
>
> **Cómo se usan los datos.** De forma agregada, en el informe del proyecto de grado. Usted aparecerá como un código (P01, P02…). Ni su nombre ni el de su organización se mencionan ni se describen de modo que permitan reconocerlos.
>
> **Participación voluntaria.** Puede interrumpir la sesión en cualquier momento, sin dar motivo y sin consecuencia alguna. Si lo hace, sus datos se descartan.
>
> **Contacto.** Daniel Mauricio Tarqui Apaza — postulante.
>
> He leído lo anterior, he podido preguntar lo que necesitaba y acepto participar.
>
> Nombre: ____________________; Firma: ____________________; Fecha: ____________

El formulario firmado se conserva **separado** de la planilla de datos, de modo que no exista forma de vincular un nombre con un resultado.

---

## 3. Guion de tareas

Se lee **literalmente**, en el mismo orden, a todos los participantes. El observador **no asiste** durante la tarea: si interviene, la tarea se registra como fallo ([Plan de pruebas](11-plan-pruebas.md), sección 8.6).

### Presentación

> «Va a usar un sistema de gestión para talleres. Le pediré tres cosas, una por vez. Trabaje como lo haría normalmente y dígame en voz alta cuando considere que terminó. Si algo no resulta claro, dígalo: eso es justamente lo que necesito saber. No puedo ayudarle durante la tarea, y eso no es un problema suyo sino parte del método.»

### Las tres tareas

| # | Enunciado que se lee | Se considera **éxito** cuando | Tiempo previsto |
|---|---|---|---|
| **T1** | «Esta organización no es la única que administra. Muéstreme los datos de la **otra organización**.» | El participante llega a una pantalla que presenta datos de la segunda organización y afirma que el contexto cambió | 60 s |
| **T2** | «Ahora sitúese en el taller **Central** de esta organización y registre un repuesto nuevo: filtro de aceite, cantidad 10.» | El repuesto queda registrado en el inventario de ese taller | 120 s |
| **T3** | «Busque al cliente **Rosa Mamani**. Fue atendido en otro taller de esta misma organización.» | El participante encuentra la ficha del cliente sin cambiar de organización | 90 s |

Los tiempos previstos **no se comunican** al participante: orientan al observador sobre cuándo una tarea se ha estancado. Una tarea sin avance a los tres minutos se cierra y se registra como fallo.

### Las dos condiciones

| Condición | Qué se le entrega al participante |
|---|---|
| **A, Selector de contexto** *(propuesta)* | Una sola cuenta, ya iniciada, con los selectores de organización y taller activos |
| **B, Cambio de cuenta** *(línea base)* | Las credenciales de las cuatro cuentas, una por local; para cambiar de local debe cerrar sesión e iniciarla con la cuenta correspondiente |

Entre una condición y otra se dice: «Ahora repetirá las mismas tres tareas en otra versión del sistema.» No se anticipa cuál es la propuesta del proyecto, ni se menciona que una es la línea base.

### Cierre

> «¿Qué le resultó confuso? ¿Qué esperaba que ocurriera y no ocurrió?»

Se transcribe literalmente, sin interpretar.

---

## 4. Planilla de registro

Una planilla **por participante y condición**. Se completa durante la sesión, no después.

| Campo | Valores |
|---|---|
| Participante | P01 … P30 |
| Condición | A (selector), B (cuenta por local) |
| Orden | Primera o segunda condición de la sesión |
| Fecha y modalidad | Fecha, presencial o remota |
| T1 — resultado | Éxito, fallo, intervención del observador *(cuenta como fallo)* |
| T1 — tiempo | Segundos |
| T1 — incidencias | Descripción breve de cada dificultad observada |
| T2 — resultado, tiempo, incidencias | Ídem |
| T3 — resultado, tiempo, incidencias | Ídem |
| SUS | Las diez respuestas, de 1 a 5 |
| Comentario abierto | Transcripción literal |

> **Regla de registro.** Se anota lo que ocurre, no su interpretación: «buscó el cliente en el menú de talleres durante 40 s» y no «no entendió el modelo».

---

## 5. Cuestionario SUS en español

Se aplica **al terminar cada condición**, sobre esa condición y no sobre el sistema en general. Diez ítems, escala de 1 —*totalmente en desacuerdo*— a 5 —*totalmente de acuerdo*—.

> **Versión que se aplica.** La escala original es de Brooke (1996); se aplica la **versión en español desarrollada y validada** por Sevilla-González et al. (2020), transcrita literalmente de su material complementario (*Multimedia Appendix 2*, obtenido de Europe PMC, PMC7773510, el 16 de septiembre de 2026), publicado con licencia abierta. Los ítems se refieren a «la herramienta»: se conserva esa redacción, porque cambiarla alteraría la versión validada.

**Instrucción al participante**, que se lee o se imprime tal cual:

> «Por favor seleccione de cada uno de los enunciados la opción que mejor describa su experiencia con la herramienta electrónica. Un puntaje de 1 significa que usted se encuentra totalmente en desacuerdo con el enunciado, mientras que un puntaje en 5 significa que está totalmente de acuerdo, un puntaje de 3 significaría que usted se encuentra neutral con el enunciado.»

| # | Ítem | Polaridad |
|---|---|---|
| 1 | Me gustaría usar esta herramienta frecuentemente. | Positiva |
| 2 | Considero que esta herramienta es innecesariamente compleja | Negativa |
| 3 | Considero que la herramienta es fácil de usar. | Positiva |
| 4 | Considero necesario el apoyo de personal experto para poder utilizar esta herramienta | Negativa |
| 5 | Considero que las funciones de la herramienta están bien integradas | Positiva |
| 6 | Considero que la herramienta presenta muchas contradicciones | Negativa |
| 7 | Imagino que la mayoría de las personas aprenderían a usar esta herramienta rápidamente | Positiva |
| 8 | Considero que el uso de esta herramienta es tedioso | Negativa |
| 9 | Me sentí muy confiado al usar la herramienta | Positiva |
| 10 | Necesité saber bastantes cosas antes de poder empezar a usar esta herramienta | Negativa |

**Cálculo de la puntuación.** A los ítems impares se les resta 1; a los pares se los resta de 5; se suman los diez valores resultantes y el total se multiplica por 2,5. El resultado va de 0 a 100 y **no es un porcentaje**. El umbral de aceptabilidad es **68** (Bangor et al., 2008), y la consistencia interna de los diez ítems se reporta con **α de Cronbach** (Cronbach, 1951), con umbral **> 0,8**.

---

## 6. Asignación contrabalanceada

La mitad de los participantes empieza por la condición A y la otra mitad por la B, para que el aprendizaje de las tareas no favorezca sistemáticamente a una condición. Se asigna **al reclutar**, no en la sesión.

| Participante | Primera condición | Segunda condición |
|---|---|---|
| P01, P03, P05 … P29 *(impares)* | **A**, selector de contexto | **B**, cuenta por local |
| P02, P04, P06 … P30 *(pares)* | **B**, cuenta por local | **A**, selector de contexto |

Si un participante abandona, su reemplazo **hereda su orden**, de modo que el reparto se mantenga equilibrado. Con los 36 reclutados previstos ([Plan de pruebas](11-plan-pruebas.md), sección 8.2), los seis adicionales se asignan alternando.

---

## 7. Después de la sesión

| Acción | Detalle |
|---|---|
| **Anonimizar** | La planilla se archiva con el código del participante; el consentimiento firmado, por separado |
| **Digitalizar** | Las planillas se vuelcan a la hoja de cálculo el mismo día, para evitar reconstrucciones de memoria |
| **Conservar** | Lo que enumera el [Plan de pruebas](11-plan-pruebas.md), sección 8.8 |
| **Descartar** | Los datos de quien interrumpa la sesión, y los del piloto |

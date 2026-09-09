# Pendientes

Registro único de lo que **falta resolver** antes de la entrega final. **Este documento no se entrega**: existe para que los entregables queden limpios de notas internas.

Registra lo pendiente **sobre los documentos y sobre las condiciones que estos declaran**, no el avance de la construcción: el estado del sistema se lee en el cronograma del [Plan de trabajo](ingenieria/08-plan-trabajo.md), y su cumplimiento, en la matriz del [Plan de pruebas](ingenieria/11-plan-pruebas.md). Lo resuelto sale de aquí; cuando haga falta saber cómo se resolvió algo, está en el documento responsable o en su ADR. Última depuración: **24 de agosto de 2026**.

## Cómo leer esto

Las secciones van **ordenadas por urgencia**, y dentro de cada una los ítems se agrupan por el tipo de trabajo que exigen. Cada ítem lleva uno de tres estados:

| Estado | Qué significa |
|---|---|
| `Bloqueante` | Impide entregar o defender |
| `Antes de la defensa` | Puede entregarse así, pero debe resolverse |
| `Decisión` | No hay nada que investigar: hay que elegir |

**De un vistazo — 26 pendientes**

| § | Sección | Ítems | Qué exige de ti |
|---|---|---|---|
| **1** | Bloqueantes | 4 | Dos datos a mano y dos exports por regenerar |
| **2** | Comprobaciones antes de la defensa | 7 | Leer fuentes y contrastar cifras contra su origen |
| **3** | Condiciones que la validación debe cumplir | 3 | Preparar entorno y evidencia **antes** de la ventana de I8 |
| **4** | Trabajo de campo | 3 | Preparar material y contactar operadores |
| **5** | Decisiones que te corresponden | 9 | Elegir entre opciones ya planteadas |

> El **§3 es el que condiciona el objetivo 4**, y no es trabajo de programación: son las condiciones que el anteproyecto **ya declaró por escrito** —entorno dedicado, ciclo repetido tres veces, evidencia conservada—. Si no se preparan antes de la ventana de validación, convierten en falsas unas afirmaciones que el documento entregado ya sostiene.

---

## 1. Bloqueantes

### Datos que faltan en la carátula

Es lo único que impide **firmar** los documentos. Quedan como línea en blanco para llenar a mano.

| # | Dato | Dónde aparece |
|---|---|---|
| **1.1** | **Nombre del tutor** | Carátula del [Perfil](anteproyecto/00-perfil-proyecto.md) y del [Anteproyecto integrado](anteproyecto/04-anteproyecto-integrado.md); pie de firmas del perfil |
| **1.2** | **Fecha de presentación** (día y mes) | Pie de firmas del perfil |

### Exports desincronizados

Bloquean **solo si se reentregan**. El Markdown, que es la fuente de verdad, está al día.

| # | Artefacto | Qué le falta |
|---|---|---|
| **1.3** | `ANTEPROYECTO.docx` | El export es anterior a la revisión de consistencia del 24 de agosto y no recoge tres cambios del Markdown: la **hipótesis enunciada en presente** (§10.1 y la celda correspondiente de la matriz §13), el **instrumento del nivel N6** añadido a la tabla de §17, y la nueva redacción de §20 sobre el estado de verificación de las referencias. Regenerar |
| **1.4** | `matriz de consistencia.docx` (ACTIVIDAD 4) | Conserva **14 apariciones de «empresa/sucursal»**, su pregunta y objetivo 4 **no incluyen la usabilidad**, y su quinta columna no lleva población, muestra, instrumentos ni enfoque, que el [anteproyecto §13](anteproyecto/04-anteproyecto-integrado.md) ya trae. **`ACTIVIDAD 5.docx` sí está al día** y sirve de base |

---

## 2. Comprobaciones antes de la defensa

Todas exigen contrastar algo **contra su fuente**. Ninguna se resuelve razonando: hay que abrir el documento o el cuadro y mirarlo.

### Fuentes

Detalle por entrada, enlaces de acceso y lista APA consolidada: [Anexo de verificación de referencias](anteproyecto/anexo-referencias.md).

| # | Pendiente | Estado |
|---|---|---|
| **2.1** | **Leer el texto completo de las cinco fuentes de las que hoy solo se ha leído el resumen** — Alobaywi et al. (2026), Andriianenko (2026), Bezemer & Zaidman (2010), Simić et al. (2024) y Olabanji et al. (2023). El anexo ya trae el enlace de acceso abierto de las cinco, de modo que solo queda leerlas. Citar a partir de un resumen es admisible en un anteproyecto, no en el documento final | **Requiere tu lectura** |
| **2.2** | **Confirmar el ISBN de Brooke (1996).** La obra se incorporó al cuerpo como fuente primaria de la escala SUS declarando el ISBN **978-0-7484-0460-5** para *Usability evaluation in industry* (Taylor & Francis). Ese ISBN **no se ha contrastado contra el catálogo del editor**, y el [anexo §1.2](anteproyecto/anexo-referencias.md) lo consigna como la única entrada `Falta` de los once ISBN citados. Su **contenido** sí está verificado: el capítulo es la fuente primaria del instrumento | **Requiere tu comprobación** |
| **2.3** | **Fijar la fecha de recuperación definitiva** —el día de la entrega— de las fuentes sin fecha de publicación: documentación técnica con autor corporativo (OpenJS, Microsoft, PostgreSQL GDG ×2, Zod, Meta Open Source, Scrum Guide) y páginas del INE. Hoy figuran con «Recuperado el 14 de agosto de 2026» | El día de la entrega |

### Cifras y normativa

| # | Pendiente | Estado |
|---|---|---|
| **2.4** | **Confirmar las cifras de 2025 contra el Cuadro N.º 1.2 del INE.** La serie se cierra en 2025 con las cifras ya extraídas: **931.205 motocicletas**, **34,8 %** del parque y **+41,6 %** desde 2021 frente al **+20,0 %** del parque total. Falta contrastarlas contra el cuadro descargado y **añadir la desagregación por tipo de servicio de 2025** (particular + público + oficial) a la nota de método del capítulo 2, que hoy solo trae la de 2024 como ejemplo. El total absoluto del parque de 2025 **no se afirma en ningún documento**: los tres pasajes se redactaron con porcentajes para no depender de una cifra sin verificar. Afecta al capítulo 2, al [perfil §2](anteproyecto/00-perfil-proyecto.md) y al [anteproyecto §5](anteproyecto/04-anteproyecto-integrado.md) | **Requiere tu comprobación** |
| **2.5** | **Localizar el cuadro oficial del 84,2 % de informalidad laboral.** Es el único dato del apartado apoyado en difusión secundaria: procede de la Encuesta Continua de Empleo del INE, pero no se localizó el cuadro exacto. La salvedad ya está replicada en el capítulo 2, el perfil §2 y el anteproyecto §5: los tres declaran que se emplea solo como caracterización cualitativa y fuera de todo cálculo | Alternativa: citar el análisis de **UDAPE** (organismo estatal) en lugar de prensa |
| **2.6** | **Fijar la fecha de acceso del cuadro del INE** el día de la entrega, con el formato que el propio INE recomienda en su catálogo ANDA (`BOL-INE-EPARQAUTO`): «Fuente: Instituto Nacional de Estadística, [producto] (años) — [URL]; Fecha de acceso: [fecha]; Condición de Uso: Archivos de Uso Público» | El día de la entrega |
| **2.7** | **El plazo del SIN vence durante el proyecto.** El [análisis del mercado](ingenieria/09-analisis-mercado.md) afirma que «el SIN extendió la adecuación hasta el 30 de septiembre de 2026»: es correcto —lo formaliza la RND 102600000007 de marzo de 2026, para los grupos 9.º a 12.º—, pero **desde el 1 de octubre de 2026 la modalidad en línea pasa a ser obligatoria**, es decir, durante la fase de construcción y antes de la defensa. La redacción quedará desactualizada y hoy no cita la RND de la prórroga | Citar la RND y redactar el plazo en pasado, o actualizar el pasaje en diciembre |

---

## 3. Condiciones que la validación debe cumplir

El objetivo 4 no se cumple ejecutando la suite: se cumple ejecutándola **en las condiciones que el propio anteproyecto declaró**. Las tres siguientes son preparación, no programación, y deben estar resueltas **antes** de la ventana de I8: después ya no hay margen para repetir el ciclo.

| # | Pendiente | Estado |
|---|---|---|
| **3.1** | **Conseguir un proyecto de base de datos dedicado y desechable.** El [anteproyecto §17.1](anteproyecto/04-anteproyecto-integrado.md) declara «proyecto dedicado y desechable, sin datos preexistentes de ninguna clase», y el §18.2, que las pruebas «no se ejecutarán contra infraestructura de terceros». Reutilizar un proyecto que ya aloje otro esquema **haría falsas ambas declaraciones**, aunque las tablas de negocio estén separadas por el prefijo `mt_`. O se crea un proyecto propio, o se reescriben §17.1 y §18.2 renunciando a esa afirmación. El riesgo concreto de contaminación por identidades compartidas **se comprobó y hoy no existe** —el otro sistema alojado en la base no usa `auth.users`, sino su propia tabla de usuarios—, pero eso es una circunstancia, no una garantía: basta que ese sistema adopte Supabase Auth para que el escenario deje de partir de vacío | `Bloqueante` para la defensa |
| **3.2** | **Definir cómo se conserva la evidencia, antes de generarla.** Por ciclo hay que guardar el guion de construcción del escenario, la salida del ejecutor de pruebas y el identificador de la última migración aplicada ([Plan de pruebas](ingenieria/11-plan-pruebas.md) §5.5). Una ejecución en verde cuya salida no se conservó no es reproducible por un tercero, y esa reproducibilidad **es** la condición del objetivo 4: sin ella el resultado no vale como evidencia por correcto que sea | `Antes de la defensa` |
| **3.3** | **Planificar las tres corridas del *test–retest* con antelación.** El plan exige **tres ejecuciones del ciclo completo**, en momentos distintos y **sobre entornos reconstruidos desde las migraciones** ([Plan de pruebas](ingenieria/11-plan-pruebas.md) §5.4). Encadenarlas en una tarde no cumple el criterio, y una corrida que parta de los datos que dejó la anterior **no prueba lo mismo**: comprueba el aislamiento sobre un escenario acumulado. Antes de cada ciclo el esquema debe reconstruirse aplicando **todas** las migraciones en orden — una omitida invalida los casos que dependen de ella, empezando por la política que reserva la lectura de la auditoría al `Owner`, de la que depende CP-704.2 | `Antes de la defensa` |

---

## 4. Trabajo de campo

Lo que exige la evaluación de usabilidad con operadores (RNF-404) y que no depende del código. Todos son `Antes de la defensa`.

| # | Pendiente |
|---|---|
| **4.1** | **Contactar y confirmar a los operadores participantes durante I6**, no en I8. Es la mitigación del riesgo R8 del [plan de trabajo](ingenieria/08-plan-trabajo.md): dejarlo para la ventana de I8 es justamente el escenario que el riesgo advierte |
| **4.2** | **Preparar el material de campo**: formulario de consentimiento informado, guion de tareas T1–T3 y planilla de registro. Deben existir **antes de I8**, y su contenido está fijado en el [Plan de pruebas](ingenieria/11-plan-pruebas.md) §7 y en el [anteproyecto §18.3](anteproyecto/04-anteproyecto-integrado.md) |
| **4.3** | **Contrastar el formato de los entregables con la guía oficial de la UCB.** No fue posible localizarla en línea; la estructura empleada sigue el estándar del perfil de proyecto de grado boliviano |

---

## 5. Decisiones que te corresponden

No hay nada que investigar en ninguna: las opciones están planteadas y falta elegir.

### Sobre los entregables

| # | Decisión | Opciones |
|---|---|---|
| **5.1** | **Revisar y entregar `ACTIVIDAD 5.docx`.** Está generado y sincronizado con la fuente de verdad —anteproyecto §13, §17 y §18—: matriz con población, muestra e instrumentos, detalle de las cuatro poblaciones, configuración de cada instrumento y párrafo ético. Solo queda tu revisión | Revisarlo y subirlo |
| **5.2** | **Orientación de la matriz de consistencia.** La diapositiva 55 de la Sesión 4 indica que «normalmente» va apaisada; la plantilla del docente es vertical, y con cinco columnas en A4 vertical quedan ~2,9 cm por columna y la tabla se extiende varias páginas. Afecta solo al `.docx` | Mantener vertical, fiel a la plantilla · **o** apaisar |
| **5.3** | **Extensión del §7 del anteproyecto.** El marco teórico y conceptual quedó en el **27,8 % del documento**, casi el triple que el estado del arte, pese a tres pasadas de compresión. Cubre todo lo que exige la Sesión 3 y es el 45 % del capítulo 3, pero la instrucción dice «NO DEBE SER MUY EXTENSO» | Aceptarlo así · **o** recortar fusionando §7.2.2 con §7.2.3, lo que empieza a tocar bloques que el docente pide explícitamente |
| **5.4** | **Si el Perfil se entrega en Word.** Solo existe export del anteproyecto; no hay `PERFIL.docx` | Generarlo · **o** entregar solo el anteproyecto |

### Sobre una fuente

| # | Decisión | Opciones |
|---|---|---|
| **5.5** | **Aceptar o sustituir Krasner & Pope (1988).** Sin DOI por ser revista descontinuada, pero indexado en ACM DL con identificador estable `10.5555/50757.50759`, que es la vía por la que el capítulo 3 lo verifica hoy (entrada A8). La única copia localizada es un escaneo de UC Irvine de **18 páginas**, y el artículo abarca las páginas 26–49, así que no se pudo verificar que esté completo | Mantenerlo vía ACM DL, que es la situación actual · **o** sustituirlo por Bass et al. (2021) o Richards & Ford (2020) |

### Sobre la especificación y la construcción

Cuatro decisiones que la fase de construcción obliga a tomar y que **tienen consecuencia documental**: la opción elegida cambia lo que dice un requisito, un ADR o un README. Por eso viven aquí y no solo en el código.

| # | Decisión | Opciones |
|---|---|---|
| **5.6** | **Política de inserción de `mt_audit_log`.** Si la política de inserción se apoya en `mt_is_org_member`, un miembro autenticado puede insertar entradas directamente contra la base de datos y falsear el registro. La escritura de auditoría es la séptima excepción de ADR-008 —siempre pasa por la clave de servicio—, de modo que restringir la inserción a `service_role` no cerraría ningún camino previsto; pero la especificación no lo dice hoy | Documentarlo primero (RF-703 y [modelo de datos](ingenieria/05-modelo-datos.md)) y reflejarlo después en la migración · **o** declararlo riesgo aceptado |
| **5.7** | **Los permisos de esquema y de tabla deben declararse en las migraciones.** Un esquema que se apoye en los valores por defecto de un proyecto recién creado —`usage` sobre `public` y privilegios por defecto hacia `anon`, `authenticated` y `service_role`— **no es reconstruible en cualquier base**: donde esos valores no estén, todo responde `permission denied for schema public`. RNF-304 exige reconstrucción reproducible, así que los permisos son parte del esquema y han de ir declarados tabla por tabla | Registrarlo como **ADR-009**, por ser una decisión de portabilidad con consecuencias · **o** dejarlo documentado solo en la migración que los declara |
| **5.8** | **Despliegue continuo.** El pipeline verifica pero no despliega. No es exigible —RNF-203 solo pide la verificación en cada integración, y el [alcance técnico §1.8.2](anteproyecto/01-definicion-y-alcance.md) excluye explícitamente el despliegue automático— pero conviene decidir si se añade antes de la demostración o se deja manual y se declara como tal | Añadirlo · **o** dejarlo manual y declararlo |
| **5.9** | **Registrar el prefijo `mt_` como ADR.** Todos los objetos del esquema —nueve tablas, ocho funciones, veintiocho políticas, once índices y el disparador sobre `auth.users`— llevan el prefijo, de modo que MotoCore pueda convivir en `public` con otro sistema sin colisionar y su limpieza sea acotada. Es una decisión de convivencia y portabilidad con consecuencias (RNF-304, y el alcance de `reset.sql`), del tipo que RNF-206 exige registrar. Su número depende de qué se decida en 5.7 | Registrarlo como ADR (010 si 5.7 se resuelve como ADR-009; 009 si no) · **o** dejarlo documentado solo en el modelo de datos |

---

## Reglas de trabajo permanentes

No son pendientes, pero rigen mientras el proyecto siga vivo:

- **El Markdown es la fuente de verdad**; los `.docx` son salidas. `ANTEPROYECTO.docx` debe regenerarse tras cada cambio de `04-anteproyecto-integrado.md`.
- **Los `.docx` no están versionados** (`docs/diapositivas/` está en `.gitignore`): no hay historial al que volver. Respaldarlos antes de regenerarlos.
- **El perfil y el anteproyecto comparten cerca de diez secciones**: todo cambio debe replicarse en ambos, y siempre en el orden que fija la tabla de fuente de verdad del [índice](README.md) — primero el documento responsable, después los dos condensados.
- **Los entregables no reportan avance.** Ni el perfil, ni el anteproyecto, ni los artefactos de ingeniería describen en qué estado está la construcción: especifican el sistema a construir y el procedimiento con que se lo validará. El avance vive en el cronograma; los resultados, en la fase de validación.
- **La documentación es la norma y el código se conforma a ella.** Cuando la implementación difiera de lo especificado se corrige la implementación — salvo que la diferencia revele un error de la especificación, en cuyo caso se enmienda el documento responsable y, si la decisión era estructural, se registra un ADR.
- **El catálogo de códigos de error del §4 del contrato es cerrado**: la interfaz no emite ningún código fuera de esa tabla, y hay una comprobación por contraste que lo verifica.
- **Entregas ya calificadas que no se actualizan**: `ACTIVIDAD 1.docx` y `ACTIVIDAD 3.docx` conservan el título anterior y la terminología retirada.
- **El trabajo futuro declarado** (canal lateral de RLS, módulos fuera del corte vertical, facturación del SIN y mensajería por WhatsApp) ya consta en [09-analisis-mercado](ingenieria/09-analisis-mercado.md) y en [01-definicion-y-alcance §1.8.3](anteproyecto/01-definicion-y-alcance.md); no se duplica aquí.

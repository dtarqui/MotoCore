# 3. Marco Teórico y Conceptual

El **marco conceptual** responde *«¿qué herramientas se usan?»* y el **marco teórico**, *«¿por qué se usan y cómo funcionan internamente?»*. El primero se limita a las tecnologías propias de esta solución —protocolos, motores, estilos de interfaz de programación— y no a conceptos universales; el peso del capítulo recae deliberadamente en el segundo. De cada teoría se consignan además sus limitaciones y cuellos de botella, contrastados con la realidad de una pequeña empresa boliviana (§3.3), y se deja constancia de los conceptos descartados por no contribuir a resolver el problema (§3.4.2). Toda afirmación técnica no propia lleva crédito a su autor en normas APA 7.ª edición, con autor corporativo cuando la fuente es documentación técnica sin autor humano.

> **Relación con el glosario del proyecto.** El [Glosario](../ingenieria/01-glosario.md) fija el **lenguaje del dominio** (empresa, sucursal, membresía, rol) y es la fuente de verdad de esos términos. Este capítulo no lo repite: define el **vocabulario tecnológico** con su fuente formal. Cuando ambos nombran un mismo término —seguridad a nivel de fila, serverless, defensa en profundidad—, el glosario da el uso interno y §3.1 la definición citable.

---

## 3.1 Marco conceptual — el «qué»

Definiciones formales de las tecnologías que sostienen la solución. Se limita a diez entradas, las mínimas necesarias para que un evaluador comprenda el vocabulario técnico del documento.

| # | Término | Definición formal | Fuente |
|---|---|---|---|
| 1 | **Node.js** | Entorno de ejecución de JavaScript del lado del servidor, construido sobre el motor V8, con un modelo de entrada/salida no bloqueante y orientado a eventos. | OpenJS Foundation (s. f.) |
| 2 | **TypeScript** | Lenguaje que extiende JavaScript añadiendo un **sistema de tipos estático opcional**, verificado en tiempo de compilación y borrado en la salida ejecutable. | Microsoft (s. f.) |
| 3 | **API REST** | Estilo arquitectónico para sistemas distribuidos definido por seis restricciones —cliente-servidor, **sin estado**, cacheable, interfaz uniforme, sistema por capas y código bajo demanda—, orientado a la manipulación de recursos identificados por URI. | Fielding (2000) |
| 4 | **JSON Web Token (JWT)** | Formato compacto y seguro para URL que representa un conjunto de declaraciones (*claims*) como objeto JSON, transferible entre partes y verificable mediante firma digital. Estándar RFC 7519. | Jones et al. (2015) |
| 5 | **PostgreSQL** | Sistema gestor de bases de datos objeto-relacional de código abierto, con cumplimiento de las propiedades transaccionales ACID y soporte extensible de tipos, funciones y políticas de acceso. | PostgreSQL Global Development Group (s. f.-a) |
| 6 | **Row-Level Security (RLS)** | Mecanismo de PostgreSQL que restringe, **dentro del propio motor**, qué filas de una tabla puede leer o modificar cada usuario, mediante políticas evaluadas automáticamente en toda consulta, con independencia de la aplicación que la origine. | PostgreSQL Global Development Group (s. f.-b) |
| 7 | **Función serverless** | Unidad de cómputo desplegada sin aprovisionamiento ni administración de servidores, de ejecución **efímera y sin estado**, invocada por evento y facturada por consumo real, con escalado automático hasta cero. | Jonas et al. (2019) |
| 8 | **Validación por esquema** | Declaración de la forma y las restricciones esperadas de un dato como un esquema ejecutable, que valida el valor recibido en tiempo de ejecución y del cual se **deriva** el tipo estático correspondiente, evitando mantener dos definiciones paralelas. | Zod (s. f.) |
| 9 | **Progressive Web App (PWA)** | Aplicación web que, mediante un manifiesto y un *service worker*, resulta instalable en el dispositivo y capaz de operar con conectividad intermitente, sin distribuirse por una tienda de aplicaciones. | World Wide Web Consortium [W3C] (2026) |
| 10 | **Problem Details** | Formato normalizado de respuesta de error para interfaces HTTP, que transporta tipo, título, estado y detalle en un cuerpo estructurado, evitando que cada servicio invente el suyo. Estándar RFC 9457, que sustituye al RFC 7807. | Nottingham et al. (2023) |

> **Nota técnica derivada de la entrada 10.** La especificación vigente es la **RFC 9457** (julio de 2023), que dejó obsoleta a la RFC 7807. El requisito RNF-204 se actualiza en consecuencia ([Requisitos](../ingenieria/02-requisitos.md)); el formato del cuerpo es compatible, de modo que la corrección es de referencia normativa, no de diseño.

---

## 3.2 Marco teórico — el «por qué» y el «cómo»

Principios, teoremas, modelos y metodologías que gobiernan el sistema. Se organiza según la estructura sugerida por el módulo: arquitectura, *backend* y persistencia, *frontend*, y modelos de seguridad; se añade un bloque de metodología, exigido para justificar el proceso de construcción.

### 3.2.1 Teorías de arquitectura — el diseño global

**Estilo arquitectónico REST y la restricción de ausencia de estado.** Fielding (2000) derivó el estilo REST imponiendo restricciones sucesivas sobre una arquitectura de red, y demostró que cada una aporta una propiedad concreta: la restricción *stateless* —cada petición contiene toda la información necesaria para ser atendida, sin que el servidor conserve contexto entre llamadas— produce visibilidad, fiabilidad y, sobre todo, **escalabilidad horizontal**. Esta restricción no es un detalle de estilo en este proyecto: es la condición que hace posible el despliegue serverless, donde la función que atiende una petición puede no ser la misma que atienda la siguiente. De ahí se sigue una consecuencia de diseño directa: el contexto activo de trabajo —empresa y sucursal— **no puede residir en memoria del servidor** y debe viajar explícitamente en cada petición, tal como se resolvió en ADR-005 ([Decisiones de diseño](../ingenieria/07-decisiones-diseno.md)).

**Atributos de calidad y tácticas arquitectónicas.** Bass et al. (2021) sostienen que la arquitectura de un sistema se determina por sus **atributos de calidad** —seguridad, modificabilidad, disponibilidad— y no por su funcionalidad, y que cada atributo se alcanza aplicando *tácticas* deliberadas y trazables hasta un requisito. Bajo este marco, el aislamiento entre empresas de este proyecto no es una funcionalidad más: es el atributo de calidad rector (RNF-101), y las decisiones registradas en los ADR son precisamente las tácticas que lo materializan. Richards y Ford (2020) añaden que toda decisión arquitectónica es un intercambio (*trade-off*) y que su valor documental está en registrar las alternativas descartadas y sus consecuencias, criterio que este proyecto adopta como formato de sus decisiones.

**Modelos de multi-tenancy.** La literatura reconoce tres estrategias para servir a múltiples inquilinos desde una misma aplicación: base de datos separada por inquilino, esquema separado por inquilino y **esquema compartido con discriminador de inquilino**. La formulación original de esta taxonomía proviene de la literatura técnica de la industria (Chong et al., 2006), pero su sistematización académica —con el análisis de los compromisos entre alternativas— corresponde a Krebs et al. (2012), que es la fuente que aquí se toma como sustento. Bezemer y Zaidman (2010) analizaron el impacto de la multi-tenancy sobre la mantenibilidad y advirtieron que compartir una instancia entre inquilinos introduce una complejidad transversal que atraviesa toda la base de código: cada consulta debe ser consciente del inquilino, y el olvido en un solo punto compromete el aislamiento. Krebs et al. (2012) sistematizaron los compromisos entre estas alternativas en términos de aprovechamiento de recursos frente a grado de aislamiento. Este cuerpo teórico fundamenta la elección del proyecto —esquema compartido, por el requisito de costo proporcional al uso (RNF-302)— y, simultáneamente, explica **por qué esa elección obliga a un mecanismo de aislamiento por debajo de la aplicación**: precisamente el punto débil que Bezemer y Zaidman identifican es el que RLS neutraliza al mover la condición de inquilino desde la consulta hacia el motor.

**De la multi-tenancy plana a la jerárquica.** La taxonomía anterior supone inquilinos **planos**: cada uno es una unidad indivisible y el problema se reduce a separarlos entre sí. El caso de este proyecto no encaja en ese supuesto, porque el inquilino posee una subdivisión interna —la empresa opera varias sucursales— cuyas entidades **no comparten el mismo alcance**: unas acompañan al cliente y pertenecen a la empresa, otras responden a la existencia física de un local y pertenecen a la sucursal.

Simić et al. (2024) son quienes más se aproximan a formalizar esa jerarquía: modelan inquilinos anidados mediante una jerarquía de espacios de nombres y demuestran que el aislamiento lógico se sostiene entre niveles, permitiendo que un nivel superior reorganice los recursos de los inferiores. Su aporte es valioso y directamente pertinente, pero su jerarquía organiza **recursos de infraestructura** —cómputo, memoria y almacenamiento—, no filas de una base de datos relacional compartida.

De ahí se sigue el problema teórico que el proyecto debe resolver por su cuenta, porque la literatura no lo cubre: **dónde situar el límite de aislamiento cuando el inquilino tiene subdivisiones**. Caben tres respuestas, y elegir mal tiene consecuencias opuestas. Situarlo en la subdivisión fragmenta la información que se quería centralizar; no modelar la subdivisión impide distinguir dónde ocurre cada operación; situarlo en el nivel superior y tratar la subdivisión como criterio de alcance conserva ambas propiedades, a costa de que el alcance de cada entidad pase a ser una **decisión de diseño explícita** y no una consecuencia automática del modelo. Esta última es la vía que adopta ADR-006, y la razón por la que el reparto de entidades por nivel se documenta entidad por entidad en el glosario en lugar de deducirse.

**El modelo de despliegue serverless.** Jonas et al. (2019) caracterizan la computación serverless como la separación entre cómputo y almacenamiento, con provisión automática y facturación por uso real, y la describen como la forma predominante que adoptará la nube; identifican como propiedad distintiva el **escalado a cero**, que elimina el costo fijo cuando no hay tráfico. Esa propiedad es la que hace económicamente viable ofrecer el sistema a talleres con presupuesto de tecnología reducido (§2.1), y sostiene RNF-301 y RNF-302. Sus limitaciones se examinan en §3.3.

### 3.2.2 Teorías de *backend* y persistencia — cómo se procesan y guardan los datos

**El modelo relacional.** Codd (1970) propuso representar los datos como relaciones matemáticas y separar su descripción lógica de su representación física, de modo que las aplicaciones no dependan de cómo estén almacenados. Esa independencia es la que permite que en este proyecto una regla de acceso se exprese como una condición lógica sobre una relación —una política— y no como código disperso en la aplicación.

**Propiedades transaccionales ACID.** Haerder y Reuter (1983) formalizaron las propiedades de atomicidad, consistencia, aislamiento y durabilidad que debe garantizar una transacción para preservar la integridad de la base ante fallos. Este es el fundamento teórico de una regla de negocio concreta del sistema: el registro de un movimiento de existencias y la actualización de la existencia del repuesto **deben ocurrir en una sola transacción**, porque un fallo entre ambas operaciones dejaría el inventario en un estado inconsistente ([Modelo de datos](../ingenieria/05-modelo-datos.md)). Lo mismo aplica a la transferencia entre sucursales, que genera dos movimientos vinculados.

**El teorema CAP y la justificación de un motor relacional único.** Gilbert y Lynch (2002) demostraron formalmente la conjetura de Brewer: en presencia de particiones de red, un sistema distribuido no puede garantizar simultáneamente consistencia y disponibilidad. Kleppmann (2017) matiza que el teorema aplica a un modelo de fallo muy específico y que suele invocarse con excesiva ligereza, pero de él se extrae la decisión pertinente para este proyecto: dado que el aislamiento entre empresas exige **consistencia fuerte** —una lectura no puede devolver datos de una membresía revocada— y que el volumen esperado no justifica un almacén distribuido, se adopta un motor relacional único con transacciones ACID, en lugar de un sistema distribuido de consistencia eventual. La escalabilidad se obtiene, en cambio, en la capa de cómputo, que sí es sin estado (§3.2.1).

**Sistemas de tipos como verificación estática.** Pierce (2002) define un sistema de tipos como un método sintáctico tratable para demostrar la ausencia de ciertos comportamientos erróneos mediante la clasificación de las expresiones del programa; es decir, una forma ligera de verificación formal aplicada antes de ejecutar. La evidencia empírica respalda su utilidad en el ecosistema concreto de este proyecto: Gao et al. (2017) reprodujeron errores públicos de proyectos JavaScript y determinaron que **aproximadamente el 15 % de ellos habría sido detectado** por un verificador de tipos estático como TypeScript, sin ejecutar prueba alguna. Esto fundamenta RNF-201 y la decisión de lenguaje de ADR-001, y también acota su alcance: el 85 % restante exige pruebas.

### 3.2.3 Teorías de *frontend* — cómo interactúa el usuario

**De la separación por responsabilidades a la composición por componentes.** Krasner y Pope (1988) formularon el paradigma Modelo-Vista-Controlador, cuyo aporte permanente es la separación entre el estado del dominio, su presentación y la gestión de la interacción. Las interfaces web actuales conservan ese principio pero reorganizan la unidad de descomposición: en lugar de tres capas transversales, se componen **componentes** que encapsulan estado y presentación, actualizados mediante un flujo de datos unidireccional (Meta Open Source, s. f.). Para este proyecto la consecuencia es concreta: el contexto activo —empresa y sucursal seleccionadas— es estado compartido por toda la interfaz, por lo que se eleva a un componente contenedor del que descienden los datos, y no se replica en cada vista.

**Tiempos de respuesta y percepción.** Nielsen (1993) estableció, a partir de la investigación en factores humanos, tres umbrales de respuesta que siguen vigentes: **0,1 segundos** para que una acción se perciba como instantánea, **1 segundo** para que no se interrumpa el flujo de pensamiento, y **10 segundos** como límite de la atención sostenida del usuario. Estos umbrales fundamentan cualitativamente RNF-501; el proyecto los declara como criterio de diseño y **no** como objetivo medido, coherentemente con la exclusión de pruebas de rendimiento (§1.8.3).

**Alcance de plataforma.** La opción de una aplicación web instalable en lugar de aplicaciones nativas se apoya en el estándar de manifiesto de aplicación web (W3C, 2026), que permite la instalación desde el navegador sin distribución por tiendas de aplicaciones. Es la vía que sostiene RNF-402 y RNF-403 con una sola base de código, decisiva para un desarrollo individual.

**Evaluación de usabilidad: por qué cinco participantes bastan.** El proyecto somete el cambio de contexto a prueba con operadores reales (RNF-404), y el tamaño de esa muestra suele ser el punto que más se cuestiona. Nielsen y Landauer (1993) construyeron un modelo matemático del hallazgo de problemas de usabilidad y mostraron que la proporción de problemas descubiertos sigue una **curva de rendimientos decrecientes**: los primeros participantes revelan la mayor parte de los defectos y cada participante adicional aporta cada vez menos, porque tiende a tropezar con los mismos obstáculos que los anteriores.

La consecuencia metodológica es la que gobierna el diseño de §16.4 del anteproyecto, y conviene enunciarla con precisión para no exagerar lo que se afirma: una muestra pequeña es adecuada **para detectar problemas**, que es el objetivo aquí, y sería insuficiente **para estimar un parámetro poblacional**, que no se pretende. Confundir ambos propósitos es el error habitual en la evaluación de interfaces, y por eso el proyecto declara que sus métricas de tiempo y de error se reportan como evidencia descriptiva, sin afirmación de significancia estadística.

**Medición de la satisfacción percibida.** La eficacia y la eficiencia se observan; la satisfacción, no. Para incorporarla sin recurrir a una apreciación subjetiva del investigador, el proyecto emplea la escala de usabilidad del sistema (*System Usability Scale*), un cuestionario breve y agnóstico de la tecnología cuya validación psicométrica y baremo de interpretación establecieron Bangor et al. (2008) sobre casi tres mil aplicaciones del instrumento. De ese trabajo procede el umbral que el proyecto adopta: **68 puntos** como valor medio de referencia, lo que convierte una impresión —«resultó cómodo de usar»— en un criterio comparable y declarado de antemano.

Esta es, además, la respuesta teórica a una objeción previsible ante el tribunal: que la arquitectura sea correcta no implica que sea utilizable, y una jerarquía de dos niveles que el operador no logra manejar no resuelve el problema que motivó la tesis (§1.2).

### 3.2.4 Modelos de seguridad — cómo se protege la información

**Principios de diseño de sistemas protegidos.** Saltzer y Schroeder (1975) enunciaron los principios que aún hoy rigen el diseño de mecanismos de protección. Cuatro de ellos gobiernan directamente decisiones de este sistema:

| Principio (Saltzer & Schroeder, 1975) | Enunciado | Materialización en el proyecto |
|---|---|---|
| **Mediación completa** (*complete mediation*) | Todo acceso a todo objeto debe ser verificado | Las políticas se evalúan en el motor de base de datos, de modo que ninguna consulta —provenga de donde provenga— elude la verificación (RNF-101) |
| **Valores por defecto seguros** (*fail-safe defaults*) | La decisión predeterminada es denegar; el acceso se concede por excepción explícita | Sin membresía activa no hay acceso; si falta la cabecera de contexto, la petición se rechaza en vez de asumir un valor (ADR-005) |
| **Mínimo privilegio** (*least privilege*) | Cada sujeto opera con los permisos mínimos necesarios | El rol se otorga por empresa y las operaciones administrativas se reservan al propietario ([Seguridad](../ingenieria/06-seguridad.md)) |
| **Economía del mecanismo** (*economy of mechanism*) | El diseño de protección debe ser lo bastante simple para poder inspeccionarse | Un **único** criterio de aislamiento (`organization_id`) en todas las tablas, incluidas las de nivel sucursal, mantiene las políticas auditables (ADR-006) |

El cuarto principio merece énfasis porque explica una decisión que, de otro modo, parecería una simplificación: modelar la sucursal como segunda frontera de seguridad habría duplicado la complejidad de las políticas, y un mecanismo de protección que no puede inspeccionarse con confianza deja de proteger.

**Control de acceso basado en roles (RBAC).** Sandhu et al. (1996) formalizaron el modelo en el que los permisos se asignan a roles y los usuarios adquieren permisos por su pertenencia a un rol, en lugar de recibirlos individualmente; el modelo incorpora el concepto de **sesión**, en la que un usuario activa un subconjunto de sus roles. Este proyecto aplica RBAC en su forma plana (RBAC₀, sin jerarquía de roles) con una particularidad derivada del modelo multiempresa: **el rol no es un atributo global del usuario, sino de la relación usuario-empresa**. La misma cuenta puede ser propietaria en una empresa y mecánica en otra, y la «sesión» del modelo de Sandhu se corresponde aquí con el contexto activo enviado en cada petición.

**Arquitectura de confianza cero.** Rose et al. (2020), en la publicación especial NIST SP 800-207, definen la confianza cero como el conjunto de principios que elimina la confianza implícita basada en la ubicación de red: cada solicitud de acceso a un recurso se autentica y autoriza de forma individual, y la confianza nunca se hereda de una decisión previa. El sistema adopta el principio en la forma que le corresponde a su escala: la interfaz de programación **no confía en el cliente** aunque la petición traiga una credencial válida, y vuelve a verificar la membresía y el rol en cada operación, en lugar de aceptar el contexto que el cliente declara. La adopción es parcial y deliberada; sus límites se discuten en §3.3.

**Defensa en profundidad.** El principio de disponer controles redundantes e independientes, de modo que el fallo de uno no comprometa el sistema, es el que articula la arquitectura de seguridad de este proyecto (ADR-002). Su justificación no es meramente doctrinal: Dar et al. (2023) demostraron empíricamente que RLS, pese a impedir la devolución de datos no autorizados, filtra información por el **tiempo de ejecución** de la consulta, y la serie de vulnerabilidades registradas en la aplicación de políticas de seguridad de fila en PostgreSQL —CVE-2016-2193, CVE-2023-2455 y CVE-2024-10976— evidencia que el mecanismo ha fallado de forma recurrente en implementaciones de producción (§2.2). Confiar el aislamiento a una sola capa es, a la luz de esa evidencia, insostenible.

### 3.2.5 Metodología de desarrollo — el proceso de trabajo

**Desarrollo iterativo e incremental.** Larman y Basili (2003) documentan que el desarrollo iterativo, lejos de ser una moda reciente, cuenta con evidencia de aplicación exitosa desde los años sesenta, y que su ventaja frente al modelo en cascada reside en obtener retroalimentación verificable antes de haber comprometido la totalidad del esfuerzo. El proyecto adopta iteraciones de dos semanas, cada una cerrada con software ejecutable y verificado ([Plan de trabajo](../ingenieria/08-plan-trabajo.md)).

**Por qué no un marco de trabajo de equipo.** Scrum define roles, eventos y artefactos concebidos para la coordinación de un equipo (Schwaber & Sutherland, 2020). Al ser este un proyecto de un solo desarrollador, las ceremonias de coordinación —planificación conjunta, reunión diaria, retrospectiva grupal— carecen de contraparte y su adopción sería nominal. Se conserva, por tanto, lo que sí aporta valor en un contexto individual: iteración corta, incremento demostrable y definición de terminado explícita.

**Integración continua y entrega.** Humble y Farley (2010) establecen que la automatización del ciclo de compilación, prueba y despliegue reduce el riesgo de la entrega al convertirla en una operación rutinaria y repetible, y que la retroalimentación rápida ante un cambio defectuoso es su beneficio principal. Forsgren et al. (2018) aportan la validación empírica: a partir de un estudio de varios años sobre miles de organizaciones, identifican la integración continua y la automatización de pruebas entre las prácticas que predicen estadísticamente un mayor desempeño en entrega de software. Ambas obras fundamentan la parte de automatización del objetivo específico 3 y RNF-203.

**Las pruebas como especificación previa.** Beck (2002) propone escribir la prueba antes que el código, de modo que la prueba actúe como especificación ejecutable del comportamiento esperado. El proyecto aplica este orden específicamente donde más importa: las **pruebas de aislamiento se escriben antes** que la funcionalidad que protegen, medida de mitigación del riesgo R1 del plan de trabajo.

**Registro de decisiones.** La práctica de documentar cada decisión estructural con su contexto, alternativas y consecuencias (Richards & Ford, 2020) sostiene RNF-206 y constituye el formato del documento de decisiones de diseño.

---

## 3.3 Revisión crítica de la literatura

Ninguna de las teorías anteriores se acepta como verdad absoluta. Para cada una se consigna su limitación documentada y la adaptación que impone el contexto real del proyecto: una pequeña empresa boliviana, con presupuesto de tecnología reducido (§2.1) y un único desarrollador.

| Teoría o modelo | Lo que promete | Limitación documentada | Adaptación adoptada |
|---|---|---|---|
| **Serverless** (Jonas et al., 2019) | Escalado automático, costo proporcional al uso, cero administración | Los propios autores identifican como obstáculos la **latencia de arranque en frío**, la ausencia de estado entre invocaciones, las limitaciones de comunicación directa entre funciones y el riesgo de dependencia del proveedor | Se asume el arranque en frío como aceptable: el sistema es de uso interno de un taller, no de tráfico masivo con exigencia de latencia estricta. La dependencia del proveedor se mitiga aislando su acceso tras una capa propia (riesgo R3) y manteniendo el aislamiento en RLS, que es del motor y no del proveedor |
| **Row-Level Security** (PostgreSQL GDG, s. f.-b) | Aislamiento aplicado en el motor, imposible de eludir desde la aplicación | Dar et al. (2023) demuestran fuga por canal lateral temporal; los CVE-2016-2193, CVE-2023-2455 y CVE-2024-10976 muestran fallos recurrentes en la aplicación de políticas | No se emplea como único control: se refuerza con verificación de membresía en la capa de aplicación (ADR-002). La fuga por canal lateral se documenta como amenaza conocida y queda fuera del alcance de mitigación, por exceder el objeto del proyecto |
| **Esquema compartido** (Krebs et al., 2012) | Máximo aprovechamiento de recursos, costo mínimo por inquilino | Bezemer y Zaidman (2010) advierten que la conciencia de inquilino se dispersa por toda la base de código y degrada la mantenibilidad; el aislamiento es el más débil de las tres estrategias | Se elige igualmente, porque una base de datos por inquilino impone un costo fijo por empresa incompatible con el mercado objetivo. La dispersión se contiene concentrando la regla de inquilino en las políticas del motor y en un único punto de verificación reutilizable |
| **Microservicios** (Newman, 2021) | Despliegue y escalado independientes por servicio | El propio autor advierte que introducen complejidad operativa —observabilidad distribuida, consistencia entre servicios, sobrecarga de despliegue— y desaconseja adoptarlos sin una organización que los sostenga | Se descarta. El comparable más cercano del estado del arte (Andriianenko, 2026) los emplea, pero un desarrollador único no puede sostener esa carga operativa. Se adopta una aplicación modular desplegada como funciones, que conserva la separación lógica sin el costo distribuido |
| **Confianza cero** (Rose et al., 2020) | Verificación individual de cada acceso, sin confianza implícita | La publicación describe una arquitectura empresarial completa —motor de políticas, inventario de activos, telemetría continua, análisis de comportamiento— cuya implantación supone una infraestructura y un equipo de operaciones inexistentes en una pequeña empresa | Se adopta el **principio**, no la arquitectura: verificación explícita en cada petición y ausencia de contexto asumido por defecto. La telemetría continua y la evaluación dinámica de confianza quedan fuera del alcance |
| **Tipado estático** (Pierce, 2002; Gao et al., 2017) | Detección de errores antes de la ejecución | La medición de Gao et al. acota el beneficio: alrededor del **15 %** de los errores públicos detectables. No sustituye a las pruebas ni verifica reglas de negocio | Se combina obligatoriamente con la suite de pruebas (RNF-202). El tipado se trata como primera barrera, no como garantía de corrección |
| **Multi-tenancy jerárquica** (Simić et al., 2024) | Un modelo de inquilinos anidados con aislamiento sostenido entre niveles | Su jerarquía organiza **recursos de infraestructura**, no filas de una base relacional compartida; no resuelve cómo repartir entidades de negocio entre niveles ni cómo hacer cumplir esa separación en el motor de datos | Se retiene el principio —el aislamiento puede sostenerse entre niveles— y se traslada a la capa de datos, que es donde este proyecto lo necesita. El reparto de entidades por nivel se resuelve como decisión de diseño explícita (ADR-006), no por deducción del modelo |
| **Evaluación con muestras pequeñas** (Nielsen & Landauer, 1993) | Que cinco participantes bastan para descubrir la mayoría de los problemas de usabilidad | El resultado vale para **detectar problemas**, no para estimar parámetros poblacionales; la curva depende de la probabilidad media de que un participante encuentre un problema dado, que varía entre interfaces | Se adopta el tamaño de 5 a 8 participantes declarando explícitamente qué **no** permite concluir: ni representatividad del sector ni significancia sobre tiempos o puntuaciones (§16.5 del anteproyecto) |
| **Teorema CAP** (Gilbert & Lynch, 2002) | Marco para razonar los compromisos de un sistema distribuido | Kleppmann (2017) señala que su modelo de fallo es estrecho y que se invoca con frecuencia fuera de su ámbito de validez | Se utiliza únicamente para justificar la elección de un motor relacional con consistencia fuerte, no como criterio general de diseño |

**Sobre la viabilidad financiera en el contexto boliviano.** La literatura de arquitectura suele asumir condiciones —despliegue multirregión, equipos de plataforma, presupuesto de observabilidad— que no se sostienen en un sector con 84,2 % de informalidad laboral y talleres de presupuesto mínimo (§2.1). Criticar la teoría, en este proyecto, consiste en retener el principio y descartar la implantación: se conserva el aislamiento verificable, la verificación explícita y la entrega automatizada, y se descartan la distribución en microservicios, la redundancia multirregión y la infraestructura de confianza cero completa. Toda decisión de esta clase queda registrada como ADR con su justificación económica explícita.

---

## 3.4 Alineación metodológica

### 3.4.1 El hilo conductor

La coherencia del documento se verifica siguiendo la cadena desde el antecedente hasta el artefacto: si el antecedente describe un riesgo de fuga de datos y el problema busca cómo evitarlo, el marco teórico debe consistir en modelos de aislamiento y control de acceso — y en nada más.

| Antecedente (§2.1) | Problema (§1.2) | Teoría que lo sustenta (§3.2) | Artefacto del proyecto |
|---|---|---|---|
| Parque de motocicletas en crecimiento sostenido; operadores que abren más de un local | Pérdida de la visión consolidada del cliente entre sucursales | Modelos de multi-tenancy y niveles de aislamiento (Krebs et al., 2012) | Jerarquía empresa → sucursales con alcance de datos por nivel (ADR-006) |
| Aislamiento resuelto solo en el código de la aplicación en las soluciones relevadas | Riesgo de fuga de datos entre empresas ante un solo error de programación | Mediación completa y valores por defecto seguros (Saltzer & Schroeder, 1975); RBAC (Sandhu et al., 1996) | Políticas de seguridad a nivel de fila más verificación de membresía (ADR-002) |
| Fallos documentados del mecanismo de aislamiento en producción | Insuficiencia de una única capa de control | Defensa en profundidad; evidencia de Dar et al. (2023) y serie de CVE | Aislamiento en dos capas independientes (RNF-101, RNF-102) |
| Alta informalidad y bajo presupuesto de tecnología en el sector | Barrera de costo de la infraestructura tradicional | Computación serverless y escalado a cero (Jonas et al., 2019) | Despliegue en funciones serverless sin costo fijo (RNF-301, RNF-302) |
| Ausencia de una plataforma con visión consolidada | Necesidad de operar varias empresas desde una cuenta | Restricción de ausencia de estado del estilo REST (Fielding, 2000) | Contexto activo declarado por petición y validado (ADR-005) |
| Operadores que hoy llevan cada local por separado y deben aprender la herramienta sin formación | Que la jerarquía propuesta resulte comprensible para quien la opera | Evaluación con muestras pequeñas (Nielsen & Landauer, 1993); medición de satisfacción (Bangor et al., 2008) | Evaluación de usabilidad del cambio de contexto con operadores del rubro (RNF-404, objetivo 4) |
| — | Verificar que la separación efectivamente se cumple | Pruebas como especificación previa (Beck, 2002); integración continua (Humble & Farley, 2010; Forsgren et al., 2018) | Suite de pruebas de aislamiento por dos vías y pipeline automatizado (objetivos 3 y 4) |

### 3.4.2 Auditoría de pertinencia: lo que se excluyó del marco teórico

Se deja constancia de los temas descartados para evidenciar que la selección fue deliberada y no un relleno de páginas:

| Tema excluido | Por qué no entra |
|---|---|
| Arquitectura de microservicios en profundidad | Se menciona solo como alternativa descartada (§3.3); desarrollarla no ayuda a resolver el problema de aislamiento |
| Aprendizaje automático y analítica predictiva | No existe requisito que lo demande; incluirlo sería sumar páginas sin sustentar ninguna decisión |
| Cadena de bloques para trazabilidad | Tecnología ajena al problema: la trazabilidad requerida se resuelve con historial inmutable en una tabla de solo inserción |
| Teoría de colas y modelado de rendimiento | Las pruebas de carga están excluidas del alcance (§1.8.3); modelar rendimiento no tendría contraparte verificable |
| Criptografía aplicada y algoritmos de cifrado | La gestión de credenciales está delegada en el proveedor de identidad (ADR-004); el proyecto no implementa primitivas criptográficas |
| Interoperabilidad con facturación electrónica del SIN | Excluida del alcance (§1.8.3); pertenece al trabajo futuro y su marco normativo se citaría sin uso en este documento |

---

## 3.5 Referencias del capítulo

Estilo **APA (7.ª edición)**. Se agrupan según **cómo se comprueba cada entrada**, para poder auditarlas una a una: los libros por ISBN, los artículos por DOI, y los enlaces consultando la página. El estado de comprobación está en [Verificación de referencias](anexo-referencias.md).

Las referencias del capítulo 2 no se repiten; cuando una obra de aquel capítulo se cita también en este, se marca con **(cap. 2)** y conserva allí su entrada.

### A. Libros publicados

*Fuente impresa o edición electrónica en catálogo. No llevan URL: se verifican por ISBN.*

| # | Referencia | ISBN |
|---|---|---|
| L1 | Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4.ª ed.). Addison-Wesley Professional. **(cap. 2)** | 978-0-13-688609-9 |
| L2 | Beck, K. (2002). *Test-driven development: By example*. Addison-Wesley Professional. | 978-0-321-14653-3 |
| L3 | Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The science of lean software and DevOps*. IT Revolution Press. **(cap. 2)** | 978-1-942788-33-1 |
| L4 | Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley Professional. **(cap. 2)** | 978-0-321-60191-9 |
| L5 | Kleppmann, M. (2017). *Designing data-intensive applications*. O'Reilly Media. **(cap. 2)** | 978-1-4493-7332-0 |
| L6 | Newman, S. (2021). *Building microservices: Designing fine-grained systems* (2.ª ed.). O'Reilly Media. **(cap. 2)** | 978-1-4920-3402-5 |
| L7 | Nielsen, J. (1993). *Usability engineering*. Morgan Kaufmann. | 978-0-12-518406-9 |
| L8 | Pierce, B. C. (2002). *Types and programming languages*. MIT Press. | 978-0-262-16209-8 |
| L9 | Richards, M., & Ford, N. (2020). *Fundamentals of software architecture: An engineering approach*. O'Reilly Media. **(cap. 2)** | 978-1-4920-4345-4 |

### B. Artículos y ponencias revisadas por pares

*Se verifican por DOI. Todos provienen de ACM, IEEE o editoriales indexadas — las fuentes que el módulo admite como sustento teórico.*

| # | Referencia | DOI |
|---|---|---|
| A1 | Bezemer, C.-P., & Zaidman, A. (2010). Multi-tenant SaaS applications: Maintenance dream or nightmare? En *Proceedings of the Joint ERCIM Workshop on Software Evolution (EVOL) and International Workshop on Principles of Software Evolution (IWPSE)* (pp. 88–92). ACM. | https://doi.org/10.1145/1862372.1862393 |
| A2 | Codd, E. F. (1970). A relational model of data for large shared data banks. *Communications of the ACM, 13*(6), 377–387. | https://doi.org/10.1145/362384.362685 |
| A3 | Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS side channels: Investigating leakage of row-level security protected data through query execution time. *Proceedings of the ACM on Management of Data, 1*(1), Artículo 89, 1–25. **(cap. 2)** | https://doi.org/10.1145/3588943 |
| A3b | Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the System Usability Scale. *International Journal of Human–Computer Interaction, 24*(6), 574–594. | https://doi.org/10.1080/10447310802205776 |
| A4 | Gao, Z., Bird, C., & Barr, E. T. (2017). To type or not to type: Quantifying detectable bugs in JavaScript. En *2017 IEEE/ACM 39th International Conference on Software Engineering (ICSE)* (pp. 758–769). IEEE. | https://doi.org/10.1109/ICSE.2017.75 |
| A5 | Gilbert, S., & Lynch, N. (2002). Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services. *ACM SIGACT News, 33*(2), 51–59. | https://doi.org/10.1145/564585.564601 |
| A6 | Haerder, T., & Reuter, A. (1983). Principles of transaction-oriented database recovery. *ACM Computing Surveys, 15*(4), 287–317. | https://doi.org/10.1145/289.291 |
| A7 | Krebs, R., Momm, C., & Kounev, S. (2012). Architectural concerns in multi-tenant SaaS applications. En *Proceedings of the 2nd International Conference on Cloud Computing and Services Science (CLOSER 2012)* (pp. 426–431). SciTePress. | https://doi.org/10.5220/0003957604260431 |
| A8 | Larman, C., & Basili, V. R. (2003). Iterative and incremental developments: A brief history. *Computer, 36*(6), 47–56. | https://doi.org/10.1109/MC.2003.1204375 |
| A9 | Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. *Proceedings of the IEEE, 63*(9), 1278–1308. | https://doi.org/10.1109/PROC.1975.9939 |
| A10 | Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer, 29*(2), 38–47. | https://doi.org/10.1109/2.485845 |
| A10b | Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. En *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems* (pp. 206–213). ACM. | https://doi.org/10.1145/169059.169166 |
| A11 | Krasner, G. E., & Pope, S. T. (1988). A cookbook for using the model-view-controller user interface paradigm in Smalltalk-80. *Journal of Object-Oriented Programming, 1*(3), 26–49. | *Sin DOI* — revista descontinuada; ver nota al final |

### C. Documentos normativos y publicaciones oficiales

*Estándares e informes de organismos, con identificador permanente.*

| # | Referencia | Identificador |
|---|---|---|
| N1 | Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)* (RFC 7519). Internet Engineering Task Force. | https://doi.org/10.17487/RFC7519 |
| N2 | Nottingham, M., Wilde, E., & Dalal, S. (2023). *Problem details for HTTP APIs* (RFC 9457). Internet Engineering Task Force. | https://doi.org/10.17487/RFC9457 |
| N3 | Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). *Zero trust architecture* (NIST Special Publication 800-207). National Institute of Standards and Technology. | https://doi.org/10.6028/NIST.SP.800-207 |
| N4 | Jonas, E., Schleier-Smith, J., Sreekanti, V., Tsai, C.-C., Khandelwal, A., Pu, Q., Shankar, V., Carreira, J., Krauth, K., Yadwadkar, N., Gonzalez, J. E., Popa, R. A., Stoica, I., & Patterson, D. A. (2019). *Cloud programming simplified: A Berkeley view on serverless computing* (Informe técnico N.º UCB/EECS-2019-3). University of California, Berkeley. | https://arxiv.org/abs/1902.03383 |
| N5 | Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Tesis doctoral, University of California, Irvine]. | https://ics.uci.edu/~fielding/pubs/dissertation/top.htm |
| N6 | World Wide Web Consortium. (2026). *Web application manifest* (W3C Working Draft, 13 de agosto de 2026). | https://www.w3.org/TR/appmanifest/ |

### D. Enlaces — documentación oficial de las tecnologías

*Autor corporativo, sin fecha de publicación fija. Admitidos por el módulo **solo para el marco conceptual** (§3.1), nunca como sustento teórico. Fecha de recuperación consignada: 14 de agosto de 2026.*

| # | Referencia | Enlace |
|---|---|---|
| E1 | Meta Open Source. (s. f.). *React documentation*. | https://react.dev/ |
| E2 | Microsoft. (s. f.). *TypeScript documentation*. | https://www.typescriptlang.org/docs/ |
| E3 | OpenJS Foundation. (s. f.). *Node.js documentation*. | https://nodejs.org/docs/latest/api/ |
| E4 | PostgreSQL Global Development Group. (s. f.-a). *PostgreSQL documentation*. | https://www.postgresql.org/docs/current/ |
| E5 | PostgreSQL Global Development Group. (s. f.-b). *Row security policies*. | https://www.postgresql.org/docs/current/ddl-rowsecurity.html |
| E6 | Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide: The definitive guide to Scrum*. | https://scrumguides.org/ |
| E7 | Zod. (s. f.). *Zod documentation*. | https://zod.dev/ |
| E8 | Chong, F., Carraro, G., & Wolter, R. (2006). *Multi-tenant data architecture*. Microsoft Corporation. [Original retirado; se cita la copia archivada] | https://web.archive.org/web/20170530080303/https://msdn.microsoft.com/en-us/library/aa479086.aspx |

> **Nota sobre A11 (Krasner & Pope, 1988).** El *Journal of Object-Oriented Programming* dejó de publicarse y sus artículos nunca recibieron DOI, por lo que esta referencia **no puede comprobarse por identificador**. Es una obra fundacional ampliamente citada; su verificación exige consultar el artículo en una biblioteca universitaria. Si no se consigue el original, la alternativa es sustentar el mismo argumento con una obra ya verificada (L1 o L9) y retirar esta entrada.

> **Nota sobre E8 (Chong et al., 2006).** El artículo original de MSDN fue retirado por Microsoft. Se cita la copia archivada, comprobada y accesible. Por tratarse de documentación corporativa **no se emplea como sustento teórico**: la taxonomía de modelos de multi-tenancy se atribuye en §3.2.1 a Krebs et al. (2012), que es literatura revisada por pares.


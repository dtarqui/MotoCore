# Análisis del mercado

Relevamiento de las soluciones de gestión de talleres de motocicletas y automóviles disponibles en **Bolivia**, con el objeto de determinar qué capacidades cubre la oferta existente y cuáles quedan desatendidas. Constituye parte del insumo del objetivo específico 1 y alimenta el estado del arte ([anteproyecto/02-antecedentes-y-estado-del-arte.md](../anteproyecto/02-antecedentes-y-estado-del-arte.md)).

Del relevamiento se desprenden dos capacidades determinantes para el mercado boliviano: la **mensajería con el cliente por WhatsApp** y la **facturación electrónica del Servicio de Impuestos Nacionales (SIN)**.

## Plataformas del mismo objetivo (mercado: Bolivia)

### Con presencia / uso en Bolivia
| Plataforma | Dirección | Conocida por |
|---|---|---|
| AutoSoft Taller | https://autosofttaller.com | Talleres mecánicos y de servicios (con IA); clientes en Bolivia |
| ServitechApp | https://servitechapp.com | Órdenes de trabajo, presupuestos, venta de productos, clientes |
| TuneraTaller | https://programa-taller.com | Talleres de motos: órdenes, presupuestos, facturación, repuestos y stock |
| AppTaller (Proyecto Nube) | https://proyectonube.com/software-taller-mecanico/ | Talleres mecánicos y servicios automotrices |

### Regionales (LATAM) usados también en Bolivia
| Plataforma | Dirección | Conocida por |
|---|---|---|
| Appli-Car | https://www.appli-car.com | Talleres LATAM, **presupuestos por WhatsApp**, inventario en la nube |
| Garage App | https://garageauto.app | Autos/motos/camiones, soporte español y portugués |

### Referentes de producto (internacionales — solo como inspiración de features)
No compiten en Bolivia, pero marcan el estándar de features (inspección digital, booking, portal del cliente): **Shopmonkey** (https://www.shopmonkey.io), **Tekmetric** (https://www.tekmetric.com), **AutoLeap** (https://www.autoleap.com) y **Blackpurl** (https://www.blackpurl.com, powersports).

> **Criterio de la comparativa**: se relevan únicamente plataformas del **mismo objetivo** —gestión de talleres de servicio vehicular—. El software administrativo o contable de propósito general queda fuera, por no resolver la operación del taller.

**Recuento**: **10 plataformas relevadas** — 4 con presencia o uso en Bolivia, 2 regionales de uso extendido en el país y 4 referentes internacionales tomados como estándar de funcionalidades.

**Fuentes de relevamiento que no entran en el recuento.** Dos referencias sirvieron para localizar y contrastar la oferta, pero no son plataformas del mismo objetivo y por eso quedan fuera de la comparativa:

| Fuente | Qué es | Para qué se usó |
|---|---|---|
| [ComparaSoftware Bolivia](https://www.comparasoftware.com.bo/taller-mecanico) | Comparador y directorio de software del mercado boliviano | Identificar qué productos se ofrecen activamente en Bolivia y con qué posicionamiento |
| [Oficina Integrada](https://www.oficinaintegrada.com.br) (Brasil) | Plataforma de gestión de talleres sin comercialización en Bolivia | Evidenciar que el envío de la orden de servicio por WhatsApp es estándar en la región (apartado A) |

## Cobertura de la oferta existente

Capacidades relevadas en las soluciones disponibles, y su relevancia para el mercado boliviano.

| Capacidad | Presencia en la oferta relevada | Relevancia para el mercado |
|---|---|---|
| Órdenes de trabajo con estados | Generalizada | Base — funcionalidad esperada |
| Inventario de repuestos con existencias | Generalizada | Base — funcionalidad esperada |
| Registro de clientes y vehículos | Generalizada | Base — funcionalidad esperada |
| **Gestión de varias organizaciones desde una cuenta** | **Ausente** en la oferta local | **Alta** |
| **Gestión de varios talleres por organización** | Escasa; presente solo en soluciones internacionales orientadas a cadenas | **Alta** |
| **Aislamiento de datos verificable entre organizaciones** | No documentado por ninguna solución relevada | **Alta** |
| Mensajería con el cliente por WhatsApp | Presente en soluciones regionales | **Alta** |
| Facturación electrónica del SIN | Presente en soluciones locales, como módulo independiente | **Alta** (obligación normativa) |
| Presupuestos con aprobación del cliente | Presente en soluciones internacionales | Media |
| Agendamiento de citas | Presente en soluciones internacionales | Media |
| Inspección digital con fotografías | Presente en soluciones internacionales | Media |
| Portal de autoservicio para el cliente | Presente en soluciones internacionales | Media |
| Recordatorios de servicio por kilometraje o tiempo | Parcial | Media |
| Reportes y analítica de operación | Parcial | Media |
| Integración contable | Escasa | Baja |

**Lectura del relevamiento.** Las capacidades operativas básicas están cubiertas por la oferta existente; lo que no se encuentra resuelto es la **estructura organizativa** ni el aislamiento verificable entre organizaciones. La elaboración de esa carencia como vacío que justifica el proyecto corresponde al estado del arte ([Sección 2.3](../anteproyecto/02-antecedentes-y-estado-del-arte.md)) y aquí no se repite.

## Análisis comparativo

La propuesta se compara con las dos alternativas reales a las que puede recurrir un operador: el software como servicio especializado que se relevó arriba, y un sistema de gestión empresarial de código abierto y propósito general. La segunda columna se caracteriza por **categoría**, no por un producto concreto: ninguno de esos sistemas entra en el recuento, porque no es una plataforma del mismo objetivo.

| Criterio | SaaS de gestión de talleres relevados | Sistema de gestión empresarial de código abierto y propósito general | **Propuesta** |
|---|---|---|---|
| **Estructura multiorganización** | Un taller por cuenta | Multiorganización genérica, sin alcance por nivel para el taller | Varias organizaciones por cuenta y varios talleres por organización, con alcance explícito por entidad |
| **Aislamiento entre organizaciones** | En el código de la aplicación, no documentado | Configurable en la aplicación | En el motor **y** en la aplicación, verificado frente a una línea base |
| **Personalización al rubro** | Alta, en estructuras fijas | Baja: requiere adaptación y esfuerzo de configuración | Alta en el corte vertical |
| **Costo de despliegue** | Suscripción recurrente por cuenta o local | Servidor y mantenimiento propios | Serverless con escalado a cero |
| **Integración** | Cerrada o acotada | Modular y heterogénea | Interfaz REST con contrato publicado |

**Innovar aquí significa integrar bien, no inventar desde cero**: el aporte se juzga por la calidad con que se integran el aislamiento en dos capas, la jerarquía de dos niveles y el despliegue sin costo fijo.

## Dos capacidades decisivas para Bolivia

El relevamiento destaca dos capacidades determinantes en el mercado boliviano: el canal de comunicación (WhatsApp) y el cumplimiento fiscal (factura electrónica del SIN).

### A. Mensajería y presupuestos por WhatsApp
WhatsApp es el canal por defecto para hablar con el cliente en Bolivia y la región. Los productos locales/regionales lo integran de forma nativa:
- **Appli-Car** (LATAM, https://www.appli-car.com): presupuestos por WhatsApp.
- **Oficina Integrada** (Brasil, https://www.oficinaintegrada.com.br): envío de la orden de servicio por WhatsApp — evidencia de que es estándar en la región.

**Implicación para el sistema**: el envío al cliente del presupuesto, del estado de la orden y de los recordatorios de servicio debería canalizarse por WhatsApp mediante la WhatsApp Business API. Queda **fuera del alcance** del presente proyecto y se documenta como línea de continuación.

### B. Facturación electrónica del SIN (Bolivia)
Bolivia exige facturación electrónica/en línea gestionada por el **Servicio de Impuestos Nacionales (SIN)**; los sistemas del rubro la integran como parte central del flujo. Puntos clave:
- **Modalidades**: Electrónica en Línea, Computarizada en Línea y Portal Web en Línea (según el volumen del contribuyente).
- **Códigos del SIN**: cada factura lleva un **CUF** (Código Único de Facturación); el sistema usa **CUIS** (inicio de sistema) y **CUFD** (código diario) emitidos por el SIN.
- **Formato y firma**: XML normado (RND Nº 102100000011) y **firma digital** obligatoria en la modalidad Electrónica en Línea.
- **Normativa/plazo**: serie **RND 1021** (p. ej. 1021-11, facturación en línea). Mediante la **[RND 102600000007](https://www.impuestos.gob.bo/wp-content/uploads/2026/03/RND-102600000007.pdf), de 25 de marzo de 2026**, el SIN amplió hasta el **30 de septiembre de 2026** el plazo de adecuación de los contribuyentes de los grupos noveno a duodécimo —alcanzados por las RND 102400000004, 102400000005, 102400000012 y 102400000025—; **desde el 1 de octubre de 2026** esos contribuyentes deben emitir sus documentos fiscales únicamente por la modalidad en línea que les corresponda.

**Implicación para el sistema**: la factura de una orden de trabajo debería emitirse como factura en línea del SIN, generando el documento normado, firmándolo digitalmente y remitiéndolo según la modalidad que corresponda al contribuyente. Es una obligación normativa, no una funcionalidad opcional. Queda **fuera del alcance** del presente proyecto por su extensión, y se documenta como línea de continuación prioritaria.

## Funcionalidades identificadas y su tratamiento en el proyecto

El relevamiento identifica un conjunto amplio de funcionalidades. El alcance del proyecto de grado ([anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md), sección 1.8) se concentra en la estructura organizativa y el aislamiento de datos; el resto se documenta como continuación.

### Dentro del alcance

| Funcionalidad | Motivo |
|---|---|
| Gestión de varias organizaciones desde una cuenta | Es el objeto central del proyecto |
| Gestión de varios talleres por organización | Segundo nivel de la jerarquía a diseñar y validar |
| Control de acceso por rol dentro de cada organización | Condición del aislamiento |
| Aislamiento verificable entre organizaciones | Requisito crítico del proyecto |
| Clientes e inventario | Corte vertical mínimo para demostrar los dos niveles de alcance |

### Fuera del alcance — líneas de continuación

Ordenadas por prioridad para el mercado boliviano:

1. Facturación electrónica del SIN — obligación normativa.
2. Mensajería con el cliente por WhatsApp — canal predominante en el mercado.
3. Presupuestos con aprobación del cliente antes de iniciar el trabajo.
4. Facturación y cobro en línea.
5. Órdenes de trabajo, motocicletas e historial de mantenimiento — completan la operación del taller.
6. Agendamiento de citas.
7. Inspección digital del vehículo con fotografías.
8. Portal de autoservicio para el cliente.
9. Recordatorios de servicio por kilometraje o tiempo.
10. Inventario avanzado: órdenes de compra, proveedores y códigos de barra.
11. Registro de tiempo por mecánico y métricas de productividad.
12. Reportes y analítica de operación.
13. Decodificación de número de chasis o placa.
14. Gestión de flotas para clientes corporativos.
15. Integración contable.

## Consideración de diseño

Aunque las funcionalidades de continuación quedan fuera del alcance, el modelo de datos se diseña de modo que su incorporación posterior no exija rehacer la estructura: las entidades que esas funcionalidades requerirán —facturas, presupuestos, citas— pertenecen al nivel taller o al nivel organización según el mismo criterio de alcance ya establecido ([01-glosario.md](01-glosario.md)), y se integran a las políticas de aislamiento existentes sin modificarlas.

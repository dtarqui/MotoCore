# Roadmap competitivo de MotoCore

Comparativa de MotoCore contra software **del mismo objetivo** —gestión de talleres de motos/autos— con presencia o uso en **Bolivia** (el mercado objetivo por ahora), con sus direcciones web y un listado priorizado de features a incorporar. El objetivo es pasar de un MVP a una plataforma competitiva en Bolivia, con capacidad multiempresa (una cuenta → varias organizaciones).

El benchmarking arroja **dos features decisivas para Bolivia** que no estaban en el análisis inicial: **mensajería/presupuestos por WhatsApp** y **facturación electrónica del SIN** (Servicio de Impuestos Nacionales). Ver la sección dedicada más abajo.

## Plataformas del mismo objetivo (mercado: Bolivia)

### Con presencia / uso en Bolivia
| Plataforma | Dirección | Conocida por |
|---|---|---|
| AutoSoft Taller | https://autosofttaller.com | Talleres mecánicos y de servicios (con IA); clientes en Bolivia |
| ServitechApp | https://servitechapp.com | Órdenes de trabajo, presupuestos, venta de productos, clientes |
| TuneraTaller | https://programa-taller.com | Talleres de motos: órdenes, presupuestos, facturación, repuestos y stock |
| AppTaller (Proyecto Nube) | https://proyectonube.com/software-taller-mecanico/ | Talleres mecánicos y servicios automotrices |
| ComparaSoftware Bolivia | https://www.comparasoftware.com.bo/taller-mecanico | Comparador/directorio del mercado boliviano de software de taller |

### Regionales (LATAM) usados también en Bolivia
| Plataforma | Dirección | Conocida por |
|---|---|---|
| Appli-Car | https://www.appli-car.com | Talleres LATAM, **presupuestos por WhatsApp**, inventario en la nube |
| Garage App | https://garageauto.app | Autos/motos/camiones, soporte español y portugués |

### Referentes de producto (internacionales — solo como inspiración de features)
No compiten en Bolivia, pero marcan el estándar de features (inspección digital, booking, portal del cliente): **Shopmonkey** (https://www.shopmonkey.io), **Tekmetric** (https://www.tekmetric.com), **AutoLeap** (https://www.autoleap.com) y **Blackpurl** (https://www.blackpurl.com, powersports).

> El modelo multiempresa (una cuenta → varias organizaciones) está inspirado en ERPs como QuickBooks/Zoho, pero esas herramientas **no** son del mismo objetivo y quedan fuera de la comparativa.

## Qué tiene MotoCore hoy

Clientes, motocicletas, órdenes de trabajo (con estados Pending → InDiagnosis → InRepair → Completed → Delivered), inventario con movimientos de stock, historial de mantenimiento, talleres con membresías y roles (Owner / Mechanic / Receptionist), autenticación, audit trail parcial (roles y talleres) y dashboard. El aislamiento por taller ya existe; el registro crea **un** taller por Owner.

## Tabla comparativa (resumen)

| Área | MotoCore hoy | Competidores | Gap |
|---|---|---|---|
| Órdenes de trabajo | Sí (estados) | Sí + tablero visual | Kanban, tiempos |
| Presupuestos + aprobación del cliente | No | Sí (link email/SMS) | **Alto** |
| Facturación + pagos online | Solo `FinalCost` | Sí (Stripe, recibos) | **Alto** |
| Agendamiento / booking | No | Sí (calendario, reserva) | **Alto** |
| Inspección digital (DVI) con fotos | No | Sí | **Alto** |
| Portal del cliente | No | Sí | **Alto** |
| Multiempresa / multi-sucursal | No (1 taller/Owner) | Sí (cadenas: GaragePlug, GarageBox, Tekmetric) | **Alto** |
| Mensajería con el cliente (SMS/email) | No | Sí (bidireccional) | Medio |
| Presupuestos / órdenes por **WhatsApp** | No | Sí (estándar en Bolivia y la región) | **Alto** |
| **Facturación electrónica del SIN** (Bolivia) | No | Sí (factura en línea del SIN) | **Alto** |
| Recordatorios de servicio | No | Sí (km/tiempo) | Medio |
| Inventario avanzado (OC, proveedores, códigos) | Básico (stock, mínimos) | Sí | Medio |
| Reportes / analítica | Dashboard básico | Sí (ARO, eficiencia) | Medio |
| Time-tracking de mecánicos | No | Sí | Medio |
| Decodificación VIN/placa | No | Sí | Bajo |
| Integración contable | No | Sí (QuickBooks/Zoho) | Bajo |

## Dos features nuevas decisivas para Bolivia

El benchmarking revela dos capacidades que hoy MotoCore no tiene y que son determinantes en el mercado boliviano: el canal de comunicación (WhatsApp) y el cumplimiento fiscal (factura electrónica del SIN).

### A. Mensajería y presupuestos por WhatsApp
WhatsApp es el canal por defecto para hablar con el cliente en Bolivia y la región. Los productos locales/regionales lo integran de forma nativa:
- **Appli-Car** (LATAM, https://www.appli-car.com): presupuestos por WhatsApp.
- **Oficina Integrada** (Brasil, https://www.oficinaintegrada.com.br): envío de la orden de servicio por WhatsApp — evidencia de que es estándar en la región.

**Feature para MotoCore**: enviar por WhatsApp el presupuesto (con link de aprobación), el estado de la orden y los recordatorios de servicio, vía WhatsApp Business API (Twilio / Meta / 360dialog). Es un diferenciador más fuerte que SMS/email en Bolivia.

### B. Facturación electrónica del SIN (Bolivia)
Bolivia exige facturación electrónica/en línea gestionada por el **Servicio de Impuestos Nacionales (SIN)**; los sistemas del rubro la integran como parte central del flujo. Puntos clave:
- **Modalidades**: Electrónica en Línea, Computarizada en Línea y Portal Web en Línea (según el volumen del contribuyente).
- **Códigos del SIN**: cada factura lleva un **CUF** (Código Único de Facturación); el sistema usa **CUIS** (inicio de sistema) y **CUFD** (código diario) emitidos por el SIN.
- **Formato y firma**: XML normado (RND Nº 102100000011) y **firma digital** obligatoria en la modalidad Electrónica en Línea.
- **Normativa/plazo**: serie **RND 1021** (p. ej. 1021-11, facturación en línea); el SIN extendió la adecuación hasta el **30 de septiembre de 2026**.

**Feature para MotoCore**: emitir la factura de la orden como **factura en línea del SIN** (generar el XML con CUF/CUFD, firmar digitalmente y enviarla al SIN según la modalidad del taller). Es requisito de cumplimiento —no un "nice to have"— y la barrera de entrada real en Bolivia.

## Roadmap priorizado

### Impacto alto — diferenciadores de negocio
1. **Presupuestos con aprobación del cliente**: generar una estimación y que el cliente la apruebe vía link (email/SMS/WhatsApp) antes de iniciar el trabajo. Es el núcleo del flujo en todos los competidores.
2. **Facturación y pagos online**: convertir la orden en factura, cobrar con Stripe u otra pasarela, emitir recibos. Hoy solo existe `FinalCost`.
3. **Mensajería y presupuestos por WhatsApp** *(clave Bolivia)*: WhatsApp Business API para presupuestos, estado de la orden y recordatorios. Diferenciador en Bolivia.
4. **Facturación electrónica del SIN (Bolivia)** *(cumplimiento)*: emitir la factura de la orden como factura en línea del SIN (XML con CUF/CUFD, firma digital, envío al SIN). Barrera de entrada en Bolivia.
5. **Agendamiento / booking**: calendario de citas, reserva por el cliente y asignación a mecánico.
6. **Inspección digital del vehículo (DVI)**: checklist con fotos/videos por orden; genera confianza y ventas adicionales.
7. **Portal del cliente**: ver el historial de su moto, aprobar presupuestos, pagar y recibir recordatorios.
8. **Multi-organización ERP**: una cuenta administra varias empresas/organizaciones con cambio de organización, invitación de miembros por org y aislamiento por RLS. *(Es la base que se construye en la reescritura a Node/Supabase.)*

### Impacto medio — eficiencia operativa y retención
9. **Recordatorios de servicio** por kilometraje/tiempo (intervalos por moto) y solicitudes de reseña.
10. **Inventario avanzado**: órdenes de compra, gestión de proveedores, reorden automático por stock mínimo (ya hay `MinimumStock`), escaneo de códigos de barra.
11. **Time-tracking de mecánicos** (reloj por trabajo) y métricas de productividad.
12. **Reportes y analítica**: ingresos, ticket promedio (ARO), conteo de órdenes, eficiencia por técnico, rotación de inventario.
13. **Tablero Kanban** de órdenes por estado (pipeline visual sobre los estados existentes).

### Impacto bajo / futuro
14. Decodificación de VIN/placa para autocompletar datos de la moto.
15. Gestión de flotas (clientes B2B con muchas motos).
16. Integración contable (QuickBooks/Zoho), coherente con el norte ERP.
17. Garantías/recalls, paquetes de servicio y membresías/fidelidad.
18. App móvil para mecánicos; impuestos y moneda por organización.

## Nota de arquitectura

El norte multiempresa (ítem 8) y varios de impacto alto (estimaciones, facturación, WhatsApp, facturación electrónica, booking) conviene contemplarlos en el diseño del nuevo backend (Node/TS + Supabase) desde el inicio, para no re-migrar el esquema más adelante. La reescritura arranca por la base multitenant (cuentas, organizaciones y membresías con RLS) y luego incorpora los módulos de negocio y estas features por orden de prioridad.

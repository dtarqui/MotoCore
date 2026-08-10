# Roadmap competitivo de MotoCore

Comparativa de MotoCore contra plataformas **del mismo objetivo** —software de gestión de talleres de motos/autos y powersports— **de distintos países** (EE.UU., España, LATAM, Brasil, India, Australia), con sus direcciones web y un listado priorizado de features a incorporar. El objetivo es pasar de un MVP de gestión de taller a una plataforma competitiva en el mercado hispano/luso, con capacidad multiempresa (una cuenta → varias organizaciones).

El benchmarking internacional arroja **dos features nuevas** decisivas para LATAM y España que no estaban en el análisis inicial: **mensajería/presupuestos por WhatsApp** y **facturación electrónica local por país** (ver la sección dedicada más abajo).

## Plataformas de referencia (internacionales, por país)

### EE.UU. / Canadá — referentes de producto
| Plataforma | Dirección | Conocida por |
|---|---|---|
| Shopmonkey | https://www.shopmonkey.io | Presupuestos con aprobación, inspección digital, facturación, pagos, agenda |
| Tekmetric | https://www.tekmetric.com | All-in-one: inspección digital (DVI), agenda, reportes, comunicación con el cliente |
| AutoLeap | https://www.autoleap.com | Órdenes, pagos, reseñas, marketing |
| Torque360 | https://www.torque360.co | Órdenes, facturación, seguimiento de técnicos |
| Blackpurl | https://www.blackpurl.com | Powersports/moto: unidades, repuestos, ventas + servicio |

### España — talleres de moto
| Plataforma | Dirección | Conocida por |
|---|---|---|
| RMS Gestión | https://rmsgestion.es | Talleres de motos y ciclomotores, **factura digital**, control de horas por reparación |
| GestFuturo | https://www.futuroinformatica.com | Talleres multimarca incl. motos (30+ años) |
| GemiCar | https://gemicar.net | Talleres de motos, bicis y náutica |

### LATAM (hispano) — autos y motos
| Plataforma | Dirección | Conocida por |
|---|---|---|
| Appli-Car | https://www.appli-car.com | Talleres LATAM, **presupuestos por WhatsApp**, inventario en la nube |
| Garage App | https://garageauto.app | Autos/motos/camiones, soporte español y portugués |

### Brasil — oficinas de moto
| Plataforma | Dirección | Conocida por |
|---|---|---|
| Oficina Integrada | https://www.oficinaintegrada.com.br | Ordem de serviço, **envío de O.S. por WhatsApp**, NF |
| WorkMotor | https://www.workmotor.com.br | Gestión de oficinas y autopeças (30+ años) |
| IS2 Automotive | http://is2.inf.br | OS, estoque, **NF-e / NFC-e** |

### India — dos ruedas (mercado masivo de motos)
| Plataforma | Dirección | Conocida por |
|---|---|---|
| GaragePlug | https://www.garageplug.com | Centros de servicio de moto: job cards, CRM, inventario, multi-sucursal |
| Easy Automobile | https://easyautomobile.in | Concesionarios de dos ruedas: ventas + service job cards + CRM |
| GarageBox | https://www.garagebox.io | Talleres de moto que escalan a cadenas multi-sucursal |

### Australia / global
| Plataforma | Dirección | Conocida por |
|---|---|---|
| Workshop Software | https://workshopsoftware.com | Software de reparación de motos, multi-país |

> El modelo multiempresa (una cuenta → varias organizaciones) que persigue MotoCore está inspirado en ERPs como QuickBooks/Zoho, pero esas herramientas **no** son competidores del mismo objetivo, así que quedan fuera de la comparativa. Aquí solo se comparan softwares de gestión de talleres/motos.

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
| Presupuestos / órdenes por **WhatsApp** | No | Sí (estándar en LATAM y Brasil) | **Alto** |
| **Facturación electrónica local** (por país) | No | Sí (NF-e, factura electrónica, CFDI) | **Alto** |
| Recordatorios de servicio | No | Sí (km/tiempo) | Medio |
| Inventario avanzado (OC, proveedores, códigos) | Básico (stock, mínimos) | Sí | Medio |
| Reportes / analítica | Dashboard básico | Sí (ARO, eficiencia) | Medio |
| Time-tracking de mecánicos | No | Sí | Medio |
| Decodificación VIN/placa | No | Sí | Bajo |
| Integración contable | No | Sí (QuickBooks/Zoho) | Bajo |

## Del mercado internacional: dos features nuevas (clave para LATAM y España)

El benchmarking por país revela un patrón claro: los productos exitosos en LATAM, Brasil y España se diferencian por dos capacidades que hoy MotoCore no tiene y que **no aparecen tan marcadas en los referentes de EE.UU.** Son la mayor oportunidad para el mercado hispano/luso.

### A. Mensajería y presupuestos por WhatsApp
WhatsApp es el canal por defecto para hablar con el cliente en LATAM, Brasil y España. Los líderes locales lo integran de forma nativa:
- **Appli-Car** (LATAM, https://www.appli-car.com): presupuestos por WhatsApp.
- **Oficina Integrada** (Brasil, https://www.oficinaintegrada.com.br): envío de la orden de servicio (O.S.) por WhatsApp.
- Onmotor y otros sistemas brasileños: orçamentos y manutenção preventiva vía WhatsApp.

**Feature para MotoCore**: enviar por WhatsApp el presupuesto (con link de aprobación), el estado de la orden y los recordatorios de servicio, vía WhatsApp Business API (Twilio / Meta / 360dialog). Es un diferenciador más fuerte que SMS/email para el mercado hispanohablante.

### B. Facturación electrónica local (por país)
Cada país tiene un régimen fiscal electrónico obligatorio, y los productos locales lo resuelven como parte central del flujo:
- **Brasil**: NF-e / NFC-e (IS2 Automotive https://is2.inf.br, Oficina Integrada).
- **España**: factura digital/electrónica (RMS Gestión https://rmsgestion.es).
- **México**: CFDI/SAT · **Colombia**: DIAN · **Perú**: SUNAT · **Argentina**: AFIP.

**Feature para MotoCore**: convertir la orden en factura electrónica válida por país, integrando un proveedor de emisión (PAC en México, emisor de NF-e en Brasil, etc.). Es requisito de cumplimiento —no un "nice to have"— y es la barrera de entrada real en cada mercado.

## Roadmap priorizado

### Impacto alto — diferenciadores de negocio
1. **Presupuestos con aprobación del cliente**: generar una estimación y que el cliente la apruebe vía link (email/SMS/WhatsApp) antes de iniciar el trabajo. Es el núcleo del flujo en todos los competidores.
2. **Facturación y pagos online**: convertir la orden en factura, cobrar con Stripe u otra pasarela, emitir recibos. Hoy solo existe `FinalCost`.
3. **Mensajería y presupuestos por WhatsApp** *(clave LATAM/España)*: WhatsApp Business API para presupuestos, estado de la orden y recordatorios. Diferenciador del mercado hispano/luso.
4. **Facturación electrónica local por país** *(cumplimiento)*: NF-e (Brasil), factura electrónica (España), CFDI (México), DIAN (Colombia), SUNAT (Perú). Barrera de entrada por mercado.
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

# Roadmap competitivo de MotoCore

Comparativa de MotoCore contra plataformas líderes de gestión de talleres, powersports y ERP, con un listado priorizado de features y mejoras a incorporar. El objetivo es pasar de un MVP de gestión de taller a una plataforma competitiva, y hacia un modelo ERP multiempresa (una cuenta → varias organizaciones) al estilo QuickBooks/Zoho.

## Plataformas de referencia

| Categoría | Plataformas | Conocidas por |
|---|---|---|
| Talleres automotriz/moto | Shopmonkey, Tekmetric, AutoLeap, Torque360, Mitchell 1/ShopKey, Shop Boss, Protractor | Presupuestos con aprobación, inspección digital, facturación, pagos, agenda, mensajería con el cliente |
| Powersports / moto | Blackpurl, Lightspeed DMS, CycleSoftware/DP360, Talon DMS | Gestión de unidades (motos), inventario de repuestos, ventas + servicio, integración con proveedores |
| ERP multiempresa | QuickBooks Online, Zoho Books/One | Una cuenta con varias compañías, contabilidad, facturación, impuestos, roles/permisos, cambio de organización |

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
| Multiempresa (cuenta → N orgs) | No (1 taller/Owner) | Sí (ERP) | **Alto** |
| Mensajería con el cliente (SMS/email) | No | Sí (bidireccional) | Medio |
| Recordatorios de servicio | No | Sí (km/tiempo) | Medio |
| Inventario avanzado (OC, proveedores, códigos) | Básico (stock, mínimos) | Sí | Medio |
| Reportes / analítica | Dashboard básico | Sí (ARO, eficiencia) | Medio |
| Time-tracking de mecánicos | No | Sí | Medio |
| Decodificación VIN/placa | No | Sí | Bajo |
| Integración contable | No | Sí (QuickBooks/Zoho) | Bajo |

## Roadmap priorizado

### Impacto alto — diferenciadores de negocio
1. **Presupuestos con aprobación del cliente**: generar una estimación y que el cliente la apruebe vía link (email/SMS) antes de iniciar el trabajo. Es el núcleo del flujo en todos los competidores.
2. **Facturación y pagos online**: convertir la orden en factura, cobrar con Stripe u otra pasarela, emitir recibos. Hoy solo existe `FinalCost`.
3. **Agendamiento / booking**: calendario de citas, reserva por el cliente y asignación a mecánico.
4. **Inspección digital del vehículo (DVI)**: checklist con fotos/videos por orden; genera confianza y ventas adicionales.
5. **Portal del cliente**: ver el historial de su moto, aprobar presupuestos, pagar y recibir recordatorios.
6. **Multi-organización ERP**: una cuenta administra varias empresas/organizaciones con cambio de organización, invitación de miembros por org y aislamiento por RLS. *(Es la base que se construye en la reescritura a Node/Supabase.)*

### Impacto medio — eficiencia operativa y retención
7. **Mensajería bidireccional** con el cliente (SMS/email) desde la orden.
8. **Recordatorios de servicio** por kilometraje/tiempo (intervalos por moto) y solicitudes de reseña.
9. **Inventario avanzado**: órdenes de compra, gestión de proveedores, reorden automático por stock mínimo (ya hay `MinimumStock`), escaneo de códigos de barra.
10. **Time-tracking de mecánicos** (reloj por trabajo) y métricas de productividad.
11. **Reportes y analítica**: ingresos, ticket promedio (ARO), conteo de órdenes, eficiencia por técnico, rotación de inventario.
12. **Tablero Kanban** de órdenes por estado (pipeline visual sobre los estados existentes).

### Impacto bajo / futuro
13. Decodificación de VIN/placa para autocompletar datos de la moto.
14. Gestión de flotas (clientes B2B con muchas motos).
15. Integración contable (QuickBooks/Zoho), coherente con el norte ERP.
16. Garantías/recalls, paquetes de servicio y membresías/fidelidad.
17. App móvil para mecánicos; impuestos y moneda por organización.

## Nota de arquitectura

El norte multiempresa (ítem 6) y varios de impacto alto (estimaciones, facturación, booking) conviene contemplarlos en el diseño del nuevo backend (Node/TS + Supabase) desde el inicio, para no re-migrar el esquema más adelante. La reescritura arranca por la base multitenant (cuentas, organizaciones y membresías con RLS) y luego incorpora los módulos de negocio y estas features por orden de prioridad.

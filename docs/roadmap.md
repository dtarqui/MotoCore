# Roadmap y Extensiones Futuras

## Estado actual

El MVP está implementado end-to-end: backend (Clean Architecture, 8 módulos de dominio, tests, CI) y frontend (auth, clientes, motocicletas, órdenes, inventario, talleres, historial de mantenimiento, dashboard) conectados entre sí. El backend está migrando a Node/TS + Supabase (ver [README.md](../README.md) y [CLAUDE.md](../CLAUDE.md)). Ver [roadmap-competitivo.md](roadmap-competitivo.md) para el roadmap priorizado enfocado en Bolivia.

## Próximas etapas sugeridas

1. ~~Definición del dominio y modelo de datos inicial.~~ 
2. ~~Diseño de contratos API para módulos core.~~ 
3. ~~Implementación de MVP (clientes, motocicletas, órdenes e inventario).~~ 
4. ~~Habilitación de historial técnico.~~ — recordatorios automáticos de mantenimiento (por kilometraje/tiempo) siguen pendientes.
5. ~~Incorporación de dashboard operativo.~~ — mejoras UX adicionales (paginación, filtros, generación de cliente API desde OpenAPI) son el siguiente paso natural.
6. Recordatorios automáticos de servicio (kilometraje / tiempo desde el último service).
7. Empaquetado multiplataforma real (PWA instalable, Capacitor, Electron) — hoy solo hay web.
8. Endurecer seguridad: 2FA, proveedor real de envío de email (confirmación/reset hoy solo registran en logs), OAuth con Google/Facebook.

## Posibles extensiones futuras

- Integración con facturación electrónica.
- Aplicación móvil para clientes finales.
- Notificaciones por WhatsApp.
- Predicción de mantenimiento basada en históricos.
- Integración con proveedores de repuestos.

## Criterios para priorización

- Impacto operativo en talleres.
- Complejidad técnica de implementación.
- Dependencias entre módulos.
- Valor incremental para el usuario final.
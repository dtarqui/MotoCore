
<p align="center">
        <img src="https://github.com/user-attachments/assets/37b92f90-e109-4989-9789-7bf45a1c6afa" alt="MotoCore logo" width="280" />
</p>

# MotoCore

Plataforma SaaS para la gestión integral de talleres de motocicletas, diseñada para operar en web, móvil y escritorio desde una misma base funcional.

## Resumen

MotoCore centraliza la operación diaria de un taller: clientes, motocicletas, órdenes de trabajo, inventario, historial técnico y recordatorios de mantenimiento. El enfoque del proyecto es construir una solución moderna, escalable y multiplataforma para talleres pequeños y medianos.

## Propuesta de valor

- Digitaliza procesos operativos del taller.
- Mejora el seguimiento de servicios y mantenimientos.
- Organiza el historial técnico de cada motocicleta.
- Facilita el control de repuestos y stock.
- Entrega métricas para soporte de decisiones.

## Alcance

MotoCore está orientado a:

- Talleres de motocicletas.
- Mecánicos independientes.
- Pequeños centros de servicio de motos.
- Talleres especializados en mantenimiento y reparación.

Incluye soporte para múltiples talleres bajo arquitectura SaaS.

## Arquitectura (alto nivel)

```text
Frontend (React PWA)
        |
Backend API (ASP.NET Core)
        |
Base de datos (PostgreSQL)
```

Distribución multiplataforma:

- Web: PWA.
- Móvil: empaquetado con Capacitor.
- Escritorio: empaquetado con Electron.

## Stack tecnológico

**Frontend**

- React
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router

**Backend**

- ASP.NET Core
- C#
- Arquitectura basada en servicios

**Datos**

- PostgreSQL

## Módulos principales

- Gestión de clientes.
- Gestión de motocicletas.
- Órdenes de trabajo.
- Inventario de repuestos.
- Historial de mantenimiento.
- Recordatorios de servicio.
- Dashboard de métricas.

## Seguridad

- Autenticación basada en tokens.
- Control de acceso por roles.
- Protección de endpoints API.

Roles contemplados:

- Administrador.
- Mecánico.
- Recepcionista.

## Estado del proyecto

Proyecto en fase de definición y estructuración funcional/técnica.

## Documentación

Para mantener este README claro y concreto, el detalle completo se documenta en archivos separados:

- [Objetivos del proyecto](docs/objetivos.md)
- [Arquitectura y plataforma](docs/arquitectura.md)
- [Módulos funcionales](docs/modulos.md)
- [Seguridad y roles](docs/seguridad.md)
- [Roadmap y extensiones futuras](docs/roadmap.md)

## Licencia

Este proyecto se distribuye bajo los términos definidos en [LICENSE](LICENSE).

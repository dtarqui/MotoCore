# Arquitectura y Plataforma

## Arquitectura base

MotoCore sigue una arquitectura cliente-servidor basada en API REST.

```text
Frontend (React PWA)
        |
Backend API (ASP.NET Core)
        |
Base de datos (PostgreSQL)
```

## Modelo multi-tenant por taller

- Cada taller se gestiona como una unidad lógica aislada.
- Cada `Owner` administra su propio taller y equipo (`Mechanic`, `Receptionist`).
- Los datos de clientes y motocicletas se mantienen aislados por taller.
- Las consultas y operaciones del backend deben filtrarse por el contexto del taller.

## Enfoque multiplataforma

Un mismo frontend se reutiliza para múltiples objetivos de despliegue:

- Web Application: Progressive Web App (PWA).
- Mobile App: empaquetado con Capacitor (Android e iOS).
- Desktop App: empaquetado con Electron (Windows, Linux y macOS).

## Tecnologías

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router

### Backend

- ASP.NET Core
- C#
- Arquitectura basada en servicios

Responsabilidades principales:

- Exponer API REST.
- Manejar autenticación y autorización.
- Implementar lógica de negocio.
- Gestionar acceso a datos.
- Aplicar controles de seguridad.

### Base de datos

- PostgreSQL

Características esperadas:

- Modelo relacional.
- Buen rendimiento para operación transaccional.
- Escalabilidad adecuada para un enfoque SaaS.
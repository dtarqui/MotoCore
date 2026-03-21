# Módulos Funcionales

## Contexto multi-taller

- Cada taller pertenece a un `Owner`.
- Un taller puede operar con varios `Mechanic` y varios `Receptionist`.
- La información operativa (clientes, motocicletas, órdenes, inventario e historial) es privada por taller.
- No se comparten clientes ni motocicletas entre talleres.

## 1) Gestión de clientes

Permite registrar y administrar clientes del taller.

Funciones clave:

- Registro de clientes.
- Información de contacto.
- Historial de servicios.
- Búsqueda rápida.

## 2) Gestión de motocicletas

Cada cliente puede tener múltiples motocicletas registradas.

Información de cada unidad:

- Marca.
- Modelo.
- Año.
- Número de chasis.
- Placa.
- Kilometraje.
- Historial de mantenimiento.

## 3) Órdenes de trabajo

Permite registrar servicios realizados por motocicleta.

Datos operativos:

- Apertura de orden de trabajo.
- Diagnóstico.
- Lista de servicios realizados.
- Repuestos utilizados.
- Estado del servicio.
- Costo total.

Estados sugeridos:

- Pendiente.
- En diagnóstico.
- En reparación.
- Finalizado.
- Entregado.

## 4) Inventario de repuestos

Controla repuestos disponibles y su consumo.

Funciones clave:

- Registro de repuestos.
- Control de stock.
- Alertas de bajo inventario.
- Historial de uso de repuestos.

Ejemplos de repuestos:

- Aceite de motor.
- Filtros.
- Bujías.
- Pastillas de freno.
- Neumáticos.

## 5) Historial de mantenimiento

Mantiene trazabilidad completa por motocicleta.

Incluye:

- Fecha de servicio.
- Kilometraje.
- Repuestos instalados.
- Diagnóstico del mecánico.
- Fotografías del estado del vehículo.

## 6) Recordatorios de servicio

Genera alertas automáticas de mantenimiento según:

- Kilometraje.
- Tiempo desde el último servicio.

Ejemplos:

- Cambio de aceite.
- Revisión de frenos.
- Cambio de filtro.

## 7) Dashboard

Panel de métricas para administración del taller.

Indicadores propuestos:

- Servicios realizados por mes.
- Ingresos del taller.
- Repuestos más utilizados.
- Clientes recurrentes.
- Motocicletas atendidas.
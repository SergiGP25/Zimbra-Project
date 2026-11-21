# Backlog priorizado · Próxima entrega

Este documento consolida las capacidades pendientes de las épicas existentes. Las historias conservan su identificador original; no se duplican HUs.

## Prioridad M · Debe completar

| Orden | HUs | Entrega pendiente | Alcance mínimo | Responsable |
|------:|-----|------------------|----------------|-------------|
| 1 | HU-16, HU-17, HU-18 | Prueba de 60 días | API para registrar descarga, generar `fecha_fin`, sumar puntos y vencer pruebas. | D2 |
| 2 | HU-20, HU-22, HU-23 | Visitas y alertas | API y pantalla de simulador de visitas, puntaje y alerta por visita calificada. | D2 |
| 3 | HU-30, HU-31, HU-32 | Propuestas | CRUD, cálculo de valor, estados Enviada/Aceptada/Rechazada y filtros. | D3 |
| 4 | HU-33, HU-34, HU-35 | Ventas | Registrar venta por propuesta aceptada, consultas y actualización de pago. | D3 |
| 5 | HU-27, HU-28, HU-29 | Interacciones | Registrar llamadas/correos, consultar historial y sumar puntaje positivo. | D3 |
| 6 | HU-05 a HU-10 | Gestión completa de prospectos | Alta, edición, estados, reasignación, ficha e historial integrado. | D1 |
| 7 | HU-13, HU-14, HU-15 | Campañas | CRUD de campañas y métricas de prospectos, descargas y ventas. | D2 |
| 8 | HU-11, HU-12 | Productos | CRUD y activación/desactivación sin borrar información histórica. | D1 |
| 9 | HU-36 a HU-38 | Reportes principales | Conversión, ventas por vendedor y campañas con datos reales. | D3 |
| 10 | HU-03, HU-04, HT-02 | Seguridad operativa | Completar gestión de empleados, filtros por rol y sesión en todas las pantallas. | D1 |
| 11 | HT-03 | Historial de estados | Implementar `historial_estado` en cambios de prospecto, propuesta y venta. | D2/D3 |
| 12 | HU-43, HU-44, HU-46, HU-47 | Calidad y entrega | Pruebas ACID, respaldo/restauración, manual y demostración. | Todos |

## Prioridad S · Debe incluirse si hay capacidad

| Orden | HUs | Entrega pendiente | Alcance mínimo | Responsable |
|------:|-----|------------------|----------------|-------------|
| 13 | HU-24, HU-25, HU-26 | Bandeja de alertas | Alertas de prueba por vencer, listado y marcar como atendida. | D2 |
| 14 | HU-39, HU-40 | Reportes secundarios | Embudo por estado y tasa de cierre sobre prospectos calificados. | D3 |
| 15 | HU-45 | Flujo integral | Prueba end-to-end de prospecto → prueba → alerta → interacción → propuesta → venta. | D1 |

## Prioridad C · Puede quedar como cierre opcional

| Orden | HUs | Entrega pendiente | Alcance mínimo | Responsable |
|------:|-----|------------------|----------------|-------------|
| 16 | HU-41 | Exportación CSV | Descargar reportes aplicando los filtros visibles. | D3 |
| 17 | HU-42 | Panel ejecutivo | Indicadores resumidos según el rol del usuario. | D1 |

## Orden recomendado de desarrollo

1. Completar modelo operativo y seguridad de empleados/prospectos.
2. Integrar pruebas, visitas y alertas con los procedimientos de base de datos.
3. Integrar interacciones, propuestas y ventas.
4. Completar campañas y reportes sobre datos reales.
5. Implementar historial de estados y pruebas end-to-end.
6. Ejecutar pruebas ACID, respaldo/restauración y documentación.
7. Cerrar CSV y panel si el tiempo lo permite.

# Datos listos para probar

Al montar el sistema (`docker compose up -d --build` con volumen nuevo) MySQL ejecuta solos los scripts `DB/01` a `DB/11`. No hay que cargar nada a mano.

| Script | Qué carga |
|---|---|
| `02_insertar_datos.sql` | Datos base: 30 empleados, 30 campañas, 30 productos, 60 prospectos, 209 visitas, 51 pruebas, 83 interacciones, 43 alertas, 40 propuestas, 30 ventas (fecha de referencia 2026-11-04) |
| `11_datos_demo.sql` | Datos **relativos a la fecha de hoy** para la demostración (abajo) |

Si la base ya existía (volumen anterior): `.\DB\herramientas\aplicar_datos_demo.ps1` (o `sh DB/herramientas/aplicar_datos_demo.sh`). Es idempotente: si ya están, no repite nada.
Para dejar todo como recién montado: `.\DB\herramientas\reiniciar_demo.ps1` (borra la base y la recrea). Hacerlo antes de cada demostración y después de correr `DB/pruebas/`, que modifican datos.

## Usuarios (contraseña `Zimbra2026*`)

| Rol | Correo |
|---|---|
| Admin | camila.rojas1@zimbra-demo.com |
| Marketing | valentina.bermudez3@zimbra-demo.com |
| Vendedor de la demo (id 6) | carlos.salazar6@zimbra-demo.com |

## Qué trae `11_datos_demo.sql` y para qué sirve

Todos los correos terminan en `@demo-sesion4.com`.

| Datos | Para demostrar |
|---|---|
| 10 clientes `demo.venta01` a `demo.venta10` con venta en los últimos ~4 meses (8 pagadas, 2 pendientes, vendedores 6 a 10) | Panel con "ventas de este mes", gráficos de Reportes, resumen anual, ranking de vendedores, reporte mensual del mes actual |
| `demo.concurrencia1/2/3`: prospectos Calificados con propuesta **Aceptada sin venta** (10, 20 y 30 licencias), vendedor 6 | T4 (registrar venta), bloqueo `FOR UPDATE`, "segunda venta" rechazada. Cada una sirve para una demostración; después quedan como clientes |
| 2 alertas pendientes del vendedor 6 (en `concurrencia1` y `2`) | Bandeja de alertas, marcar como atendida |
| `demo.alerta1`: Calificado, 70 puntos, sin alertas | T2: simular visita a `/precios` → se crea la alerta; una segunda visita en la hora no repite |
| `demo.vence1`: prueba que vence en 5 días | "Pruebas por vencer" del panel |
| `demo.vence2`: prueba que terminó ayer pero sigue Activa | Botón "Vencer pruebas" / `sp_vencer_pruebas` (SAVEPOINT) |
| `demo.nuevo1`, `demo.nuevo2` (vendedor 6) | T1: registrar descarga de prueba |
| `demo.sinvendedor` | T5: asignar / reasignar vendedor |

Los números de la base base (60 prospectos, 40 propuestas, 30 ventas) pasan a ser 79 prospectos, 53 propuestas y 40 ventas con los datos demo. El script de verificación `03_verificacion.sql` sigue dando 0 en las comprobaciones 3 a 7 y 10.

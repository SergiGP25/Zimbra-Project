# Guion de demostración · 10 minutos (HU-47)

Preparación: `docker compose up -d --build`, abrir http://localhost:5174, Swagger en :8000/docs, un cliente MySQL (o `docker exec -it zimbra_mysql mysql -uroot crm_zimbra`). Si se quiere partir limpio: `docker compose down -v && docker compose up -d`.

| Min | Quién | Qué mostrar | Qué decir |
|---|---|---|---|
| 0–1 | Sergio | Landing → login como Admin; `/api/v1/health` | Back-end conectado a MySQL: 30 empleados, 8 triggers, 14 procedimientos |
| 1–2 | Sergio | Empleados (Admin) y login como Vendedor 6: solo ve sus prospectos, `/empleados` da 403 | Permisos por rol en el servidor (RN-12, RNF-06) |
| 2–4 | Juan David | Prospecto 18 → descarga de prueba (T1) → ficha: 25 puntos, fecha_fin = hoy + 60. Intentar escribir `fecha_fin` en MySQL → ERROR 3105 | Columna generada (4.2) |
| 4–5 | Juan David | Visitas: prospecto 19 a `/precios` → alerta; segunda visita no repite. Mostrar SAVEPOINT `sp_antes_alerta` en `06_transacciones.sql` | Savepoint: lo obligatorio vs lo opcional |
| 5–7 | Andrés | Propuesta de 20 licencias del producto 10 → valor 900.00 (TR-02); aceptarla; registrar venta (T4); prospecto pasa a Cliente | Trigger + transacción atómica |
| 7–8 | Andrés | Errores: venta de propuesta 33 (Enviada) y segunda venta de la propuesta 1 → mensajes T4; tabla `historial_estado` | ROLLBACK y auditoría |
| 8–9 | Andrés | **Bloqueo:** dos terminales, parte D de `08_pruebas_transacciones.sql` (`FOR UPDATE`) | Aislamiento |
| 9–10 | Todos | Reportes (R-01 a R-06) y exportar CSV; `pytest -v`; respaldo con `respaldo.ps1` | Cierre: qué queda (rastreo web real, rendimiento medido) |

Ensayo: cronometrar una vez completa y recortar el bloque de reportes si se pasa de 10 minutos.

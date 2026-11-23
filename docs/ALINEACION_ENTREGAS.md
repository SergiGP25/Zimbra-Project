# Alineación entre el informe (Entrega 2) y el repositorio

Diferencias que conviene corregir en el PDF o tener presentes al sustentar.

| Tema | El informe dice | El repositorio tiene | Acción |
|---|---|---|---|
| Nombres de scripts | `04_triggers`, `05_transacciones`, `06_reportes`, `pruebas/07_pruebas_transacciones` | `04_create_admin_user`, `05_triggers`, `06_transacciones`, `07_reportes`, `pruebas/08_pruebas_transacciones` | Actualizar la sección 4, 9 y 13 del PDF |
| Número de tablas | Entrega 1: 10 tablas | 11 (se añadió `historial_estado`) | Ya explicado en la sección 4 de la Entrega 2 |
| Menú del Vendedor | «solo ve Prospectos» | Alertas, Prospectos, Pruebas, Visitas, Interacciones, Propuestas, Ventas, Productos | Actualizar sección 12 |
| Figuras 1–4 | Tema oscuro, 3 pantallas | Tema claro, landing, login aparte y 11 módulos | Tomar capturas nuevas |
| Anexo A | Script SQL completo | No está en el PDF | Anexar `DB/01` a `DB/07` |
| Referencia a SQL de pruebas | Partes A–E | Partes A–E + `09_carga_10000_prospectos.sql` (RNF-03) | Mencionar |
| Respaldo (RNF-13) | — | `DB/respaldo/` | Mencionar en sección 9 |
| Pruebas automáticas (HU-43/44) | Solo SQL manual | `backend/tests` (pytest) y `scripts/probar_api.py` | Mencionar en sección 9 |
| Moneda | Valores en dólares | Pesos colombianos (COP) en datos y pantallas | Actualizar tablas y capturas con montos |
| Correos | Fuera de alcance | Bienvenida, prueba activada, recuperación y aviso de cambio de contraseña (Mailpit en local, Brevo en la nube) | Mencionar como mejora sobre el alcance |
| Vencimiento de pruebas (RF-19) | Proceso manual | Evento diario `ev_vencer_pruebas` (`DB/12`) además del botón | Mencionar en transacciones |
| Paginación (RNF-04) | Prospectos | Todos los listados, 20 por página | — |

Pendiente que solo puede hacer el equipo: prueba manual en Chrome, Firefox y Edge (RNF-02) y registrar el resultado de `09_carga_10000_prospectos.sql` (RNF-03).

Datos: con `DB/11_datos_demo.sql` la base queda en 79 prospectos, 53 propuestas y 40 ventas (los 60/40/30 del informe son los datos base de `02`). Aclararlo en la Tabla 9 o ejecutar solo hasta el script 10 para las capturas del informe.

-- =====================================================================
-- Demostracion de indices con EXPLAIN (Sesion 4)
-- Ejecutar bloque por bloque. Conviene tener cargado el volumen de
-- 09_carga_10000_prospectos.sql para que la diferencia sea visible.
--   docker exec -it zimbra_mysql mysql -uroot crm_zimbra
-- Como leer EXPLAIN:
--   type = ALL        -> recorre toda la tabla (malo en tablas grandes)
--   type = ref/range  -> usa un indice (bueno)
--   key               -> indice elegido        rows -> filas estimadas
-- IGNORE INDEX simula "como estaria sin el indice".
-- =====================================================================

-- 1. Listado del vendedor 10 filtrado por estado
EXPLAIN SELECT prospecto_id, nombre, puntaje_calificacion FROM prospecto
         IGNORE INDEX (ix_prospecto_vendedor_estado, ix_prospecto_estado, ix_prospecto_puntaje)
 WHERE empleado_id = 10 AND estado = 'Calificado' ORDER BY puntaje_calificacion DESC;

EXPLAIN SELECT prospecto_id, nombre, puntaje_calificacion FROM prospecto
 WHERE empleado_id = 10 AND estado = 'Calificado' ORDER BY puntaje_calificacion DESC;

-- 2. Busqueda por prefijo del nombre
EXPLAIN SELECT prospecto_id FROM prospecto IGNORE INDEX (ix_prospecto_nombre) WHERE nombre LIKE 'Camila%';
EXPLAIN SELECT prospecto_id FROM prospecto WHERE nombre LIKE 'Camila%';

-- 3. Regla de T2: una alerta por hora para un prospecto
EXPLAIN SELECT 1 FROM alerta IGNORE INDEX (ix_alerta_prospecto_motivo)
 WHERE prospecto_id = 19 AND motivo = 'Visita al sitio' AND fecha_hora >= NOW() - INTERVAL 1 HOUR;
EXPLAIN SELECT 1 FROM alerta
 WHERE prospecto_id = 19 AND motivo = 'Visita al sitio' AND fecha_hora >= NOW() - INTERVAL 1 HOUR;

-- 4. Ventas pendientes de un mes (R-01, HU-34)
EXPLAIN SELECT COUNT(*) FROM venta IGNORE INDEX (ix_venta_estado_fecha, ix_venta_fecha)
 WHERE estado = 'Pendiente' AND fecha_venta >= '2026-06-01' AND fecha_venta < '2026-07-01';
EXPLAIN SELECT COUNT(*) FROM venta
 WHERE estado = 'Pendiente' AND fecha_venta >= '2026-06-01' AND fecha_venta < '2026-07-01';

-- 5. Tiempo real de una consulta con y sin indice
SET @t = NOW(6);
SELECT COUNT(*) FROM prospecto IGNORE INDEX (ix_prospecto_vendedor_estado, ix_prospecto_estado)
 WHERE empleado_id = 10 AND estado = 'Calificado';
SELECT ROUND(TIMESTAMPDIFF(MICROSECOND, @t, NOW(6)) / 1000, 2) AS ms_sin_indice;

SET @t = NOW(6);
SELECT COUNT(*) FROM prospecto WHERE empleado_id = 10 AND estado = 'Calificado';
SELECT ROUND(TIMESTAMPDIFF(MICROSECOND, @t, NOW(6)) / 1000, 2) AS ms_con_indice;

-- 6. Las vistas tambien se benefician: la consulta se expande a las tablas
EXPLAIN SELECT * FROM v_ventas_detalle WHERE vendedor_id = 10;

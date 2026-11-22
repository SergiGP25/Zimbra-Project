-- =====================================================================
-- Script   : 09_indices.sql  (Sesion 4: indices para optimizar consultas)
-- Requisito: 01 a 08 ejecutados.
-- 01_crear_tablas.sql ya crea 8 indices basicos. Aqui se agregan los que
-- sirven a consultas concretas del sistema. Cada uno indica la consulta
-- que acelera; DB/pruebas/10_explain_indices.sql lo demuestra con EXPLAIN.
-- Regla usada: primero las columnas con "=", despues las de rango/orden.
-- Costo: cada indice hace mas lento INSERT/UPDATE, por eso solo se crean
-- los que respaldan consultas frecuentes.
-- =====================================================================
SET NAMES utf8mb4;
USE crm_zimbra;

-- Listado del vendedor filtrado por estado (RN-12, HU-06)
CREATE INDEX ix_prospecto_vendedor_estado ON prospecto (empleado_id, estado, puntaje_calificacion);

-- Busqueda por nombre (prefijo) y reportes por fecha de registro
CREATE INDEX ix_prospecto_nombre   ON prospecto (nombre);
CREATE INDEX ix_prospecto_registro ON prospecto (fecha_registro);

-- Reporte por campana y embudo por campana
CREATE INDEX ix_prospecto_campana_estado ON prospecto (campana_id, estado);

-- Historial de interacciones de un prospecto, la mas reciente primero (HU-28)
CREATE INDEX ix_interaccion_prospecto ON interaccion (prospecto_id, fecha_hora DESC);

-- Regla "una alerta por hora" de T2 (HU-23): busca por prospecto, motivo y hora
CREATE INDEX ix_alerta_prospecto_motivo ON alerta (prospecto_id, motivo, fecha_hora);

-- Propuestas por prospecto y por vendedor (HU-32, R-01)
CREATE INDEX ix_propuesta_prospecto ON propuesta (prospecto_id, estado);
CREATE INDEX ix_propuesta_vendedor  ON propuesta (empleado_id, estado);

-- Ventas por estado de pago y fecha (HU-34, R-01)
CREATE INDEX ix_venta_estado_fecha ON venta (estado, fecha_venta);

-- Pruebas de un prospecto por estado (T1 y fichas)
CREATE INDEX ix_prueba_prospecto ON descarga_prueba (prospecto_id, estado);

-- Verificacion: lista los indices creados
SELECT table_name AS tabla, index_name AS indice,
       GROUP_CONCAT(column_name ORDER BY seq_in_index) AS columnas
  FROM information_schema.statistics
 WHERE table_schema = 'crm_zimbra' AND index_name LIKE 'ix\_%'
 GROUP BY table_name, index_name
 ORDER BY table_name, index_name;

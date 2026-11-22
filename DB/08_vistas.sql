-- =====================================================================
-- Script   : 08_vistas.sql  (Sesion 4: vistas para reportes simplificados)
-- Requisito: 01 a 07 ejecutados.
-- Una vista es una consulta guardada con nombre: quien reporta escribe
-- SELECT * FROM v_ventas_detalle en lugar de un JOIN de cinco tablas, y
-- la vista puede ser la unica puerta de lectura de un rol (ver 10_roles).
--
--  Vista                    Para que sirve
--  ------------------------ ------------------------------------------
--  v_prospecto_resumen      Ficha corta: campana, vendedor, actividad
--  v_embudo                 Prospectos por estado y porcentaje
--  v_ventas_detalle         Venta + propuesta + prospecto + producto
--  v_ventas_por_mes         Ventas y monto por mes
--  v_ranking_vendedores     Ventas y monto por vendedor
--  v_rendimiento_campana    Prospectos, ventas y costo por campana
--  v_alertas_pendientes     Bandeja de alertas sin atender
--  v_pruebas_activas        Pruebas Activas con dias restantes
-- =====================================================================
SET NAMES utf8mb4;
USE crm_zimbra;

CREATE OR REPLACE VIEW v_prospecto_resumen AS
SELECT p.prospecto_id,
       p.nombre,
       p.empresa,
       p.estado,
       p.puntaje_calificacion          AS puntaje,
       c.nombre                        AS campana,
       e.nombre                        AS vendedor,
       p.fecha_registro,
       (SELECT COUNT(*) FROM visita_web v WHERE v.prospecto_id = p.prospecto_id)       AS num_visitas,
       (SELECT MAX(i.fecha_hora) FROM interaccion i WHERE i.prospecto_id = p.prospecto_id) AS ultima_interaccion
  FROM prospecto p
  JOIN campana c       ON c.campana_id  = p.campana_id
  LEFT JOIN empleado e ON e.empleado_id = p.empleado_id;

CREATE OR REPLACE VIEW v_embudo AS
SELECT estado,
       COUNT(*)                                          AS prospectos,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct_total
  FROM prospecto
 GROUP BY estado;

CREATE OR REPLACE VIEW v_ventas_detalle AS
SELECT v.venta_id,
       v.fecha_venta,
       v.monto_final,
       v.forma_pago,
       v.estado          AS estado_pago,
       v.fecha_pago,
       pr.propuesta_id,
       pr.num_licencias,
       pd.nombre         AS producto,
       p.prospecto_id,
       p.nombre          AS prospecto,
       p.empresa,
       e.empleado_id     AS vendedor_id,
       e.nombre          AS vendedor
  FROM venta v
  JOIN propuesta pr ON pr.propuesta_id = v.propuesta_id
  JOIN producto  pd ON pd.producto_id  = pr.producto_id
  JOIN prospecto p  ON p.prospecto_id  = pr.prospecto_id
  JOIN empleado  e  ON e.empleado_id   = pr.empleado_id;

CREATE OR REPLACE VIEW v_ventas_por_mes AS
SELECT DATE_FORMAT(fecha_venta, '%Y-%m')   AS periodo,
       COUNT(*)                            AS num_ventas,
       SUM(monto_final)                    AS monto_total,
       SUM(estado = 'Pagada')              AS pagadas,
       SUM(estado = 'Pendiente')           AS pendientes
  FROM venta
 GROUP BY DATE_FORMAT(fecha_venta, '%Y-%m');

CREATE OR REPLACE VIEW v_ranking_vendedores AS
SELECT e.empleado_id,
       e.nombre                                  AS vendedor,
       COUNT(v.venta_id)                         AS num_ventas,
       COALESCE(SUM(v.monto_final), 0)           AS monto_total,
       RANK() OVER (ORDER BY COALESCE(SUM(v.monto_final), 0) DESC) AS posicion
  FROM empleado e
  LEFT JOIN propuesta pr ON pr.empleado_id  = e.empleado_id
  LEFT JOIN venta v      ON v.propuesta_id  = pr.propuesta_id
 WHERE e.rol = 'Vendedor' AND e.activo = TRUE
 GROUP BY e.empleado_id, e.nombre;

CREATE OR REPLACE VIEW v_rendimiento_campana AS
SELECT c.campana_id,
       c.nombre,
       c.canal,
       c.presupuesto,
       COUNT(DISTINCT p.prospecto_id)                          AS prospectos,
       COUNT(DISTINCT CASE WHEN p.estado = 'Cliente' THEN p.prospecto_id END) AS clientes,
       ROUND(100 * COUNT(DISTINCT CASE WHEN p.estado = 'Cliente' THEN p.prospecto_id END)
             / NULLIF(COUNT(DISTINCT p.prospecto_id), 0), 1)   AS pct_clientes
  FROM campana c
  LEFT JOIN prospecto p ON p.campana_id = c.campana_id
 GROUP BY c.campana_id, c.nombre, c.canal, c.presupuesto;

CREATE OR REPLACE VIEW v_alertas_pendientes AS
SELECT a.alerta_id,
       a.fecha_hora,
       a.motivo,
       p.prospecto_id,
       p.nombre   AS prospecto,
       p.telefono,
       e.empleado_id AS vendedor_id,
       e.nombre   AS vendedor
  FROM alerta a
  JOIN prospecto p ON p.prospecto_id = a.prospecto_id
  JOIN empleado  e ON e.empleado_id  = a.empleado_id
 WHERE a.atendida = FALSE;

CREATE OR REPLACE VIEW v_pruebas_activas AS
SELECT d.descarga_id,
       p.prospecto_id,
       p.nombre       AS prospecto,
       pd.nombre      AS producto,
       d.fecha_inicio,
       d.fecha_fin,
       DATEDIFF(d.fecha_fin, CURRENT_DATE) AS dias_restantes,
       p.empleado_id  AS vendedor_id
  FROM descarga_prueba d
  JOIN prospecto p  ON p.prospecto_id = d.prospecto_id
  JOIN producto  pd ON pd.producto_id = d.producto_id
 WHERE d.estado = 'Activa';

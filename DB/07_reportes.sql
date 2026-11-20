-- =====================================================================
-- Script   : 07_reportes.sql  (Sesión 3: procedimientos de reportes)
-- Requisito: 01 a 06 ejecutados.
-- Los reportes solo leen datos: no abren transacción. Los rangos de
-- fechas se escriben como "fecha >= desde AND fecha < hasta + 1 día"
-- para que MySQL pueda usar los índices de fecha.
--
--  Procedimiento               Historia  Requerimiento
--  --------------------------- --------- -------------
--  sp_reporte_ventas_mensual   HU-37     RF-41 (reporte mensual)
--  sp_reporte_resumen_anual    HU-42     RF-46 (indicadores por mes)
--  sp_reporte_conversion       HU-36     RF-40
--  sp_reporte_campanas         HU-38     RF-42
--  sp_reporte_embudo           HU-39     RF-43
--  sp_reporte_tasa_cierre      HU-40     RF-44
-- =====================================================================
-- Lee este archivo como UTF-8 (sin esto, las tildes y la ñ se guardan dañadas)
SET NAMES utf8mb4;

USE crm_zimbra;

DROP PROCEDURE IF EXISTS sp_reporte_ventas_mensual;
DROP PROCEDURE IF EXISTS sp_reporte_resumen_anual;
DROP PROCEDURE IF EXISTS sp_reporte_conversion;
DROP PROCEDURE IF EXISTS sp_reporte_campanas;
DROP PROCEDURE IF EXISTS sp_reporte_embudo;
DROP PROCEDURE IF EXISTS sp_reporte_tasa_cierre;

DELIMITER $$

-- ---------------------------------------------------------------------
-- R-01. Reporte mensual de ventas por vendedor (RF-41).
--   Devuelve dos resultados:
--   1) una fila por vendedor: ventas, monto, ticket promedio, % del mes;
--   2) el total del mes.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_reporte_ventas_mensual(
    IN p_anio INT,
    IN p_mes  INT
)
BEGIN
    DECLARE v_desde DATE;
    DECLARE v_hasta DATE;
    DECLARE v_total DECIMAL(14,2);

    IF p_mes NOT BETWEEN 1 AND 12 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'R-01: el mes debe estar entre 1 y 12.';
    END IF;

    SET v_desde = MAKEDATE(p_anio, 1) + INTERVAL (p_mes - 1) MONTH;
    SET v_hasta = v_desde + INTERVAL 1 MONTH;

    SELECT COALESCE(SUM(v.monto_final), 0) INTO v_total
      FROM venta v
     WHERE v.fecha_venta >= v_desde AND v.fecha_venta < v_hasta;

    SELECT e.empleado_id,
           e.nombre                                   AS vendedor,
           COUNT(v.venta_id)                          AS num_ventas,
           SUM(v.monto_final)                         AS monto_total,
           ROUND(AVG(v.monto_final), 2)               AS ticket_promedio,
           ROUND(100 * SUM(v.monto_final) / NULLIF(v_total, 0), 1) AS pct_del_mes
      FROM venta v
      JOIN propuesta p ON p.propuesta_id = v.propuesta_id
      JOIN empleado  e ON e.empleado_id  = p.empleado_id
     WHERE v.fecha_venta >= v_desde AND v.fecha_venta < v_hasta
     GROUP BY e.empleado_id, e.nombre
     ORDER BY monto_total DESC;

    SELECT DATE_FORMAT(v_desde, '%Y-%m')             AS periodo,
           COUNT(*)                                   AS num_ventas,
           COALESCE(SUM(monto_final), 0)              AS monto_total,
           SUM(estado = 'Pagada')                     AS pagadas,
           SUM(estado = 'Pendiente')                  AS pendientes
      FROM venta
     WHERE fecha_venta >= v_desde AND fecha_venta < v_hasta;
END$$

-- ---------------------------------------------------------------------
-- R-02. Resumen anual mes a mes: prospectos nuevos, pruebas, propuestas,
--       ventas y monto (indicadores del panel, RF-46).
--       Usa una CTE recursiva para generar los 12 meses aunque alguno no
--       tenga movimiento.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_reporte_resumen_anual(
    IN p_anio INT
)
BEGIN
    WITH RECURSIVE meses AS (
        SELECT 1 AS mes
        UNION ALL
        SELECT mes + 1 FROM meses WHERE mes < 12
    )
    SELECT m.mes,
           (SELECT COUNT(*) FROM prospecto
             WHERE YEAR(fecha_registro) = p_anio AND MONTH(fecha_registro) = m.mes) AS prospectos_nuevos,
           (SELECT COUNT(*) FROM descarga_prueba
             WHERE YEAR(fecha_inicio) = p_anio AND MONTH(fecha_inicio) = m.mes)     AS pruebas,
           (SELECT COUNT(*) FROM propuesta
             WHERE YEAR(fecha_emision) = p_anio AND MONTH(fecha_emision) = m.mes)   AS propuestas,
           (SELECT COUNT(*) FROM venta
             WHERE YEAR(fecha_venta) = p_anio AND MONTH(fecha_venta) = m.mes)       AS ventas,
           (SELECT COALESCE(SUM(monto_final), 0) FROM venta
             WHERE YEAR(fecha_venta) = p_anio AND MONTH(fecha_venta) = m.mes)       AS monto
      FROM meses m
     ORDER BY m.mes;
END$$

-- ---------------------------------------------------------------------
-- R-03. Conversión: pruebas descargadas en el rango contra pruebas que
--       terminaron en venta (RF-40). NULLIF evita dividir entre cero.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_reporte_conversion(
    IN p_desde DATE,
    IN p_hasta DATE
)
BEGIN
    IF p_hasta < p_desde THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'R-03: la fecha final es anterior a la inicial.';
    END IF;

    SELECT COUNT(*)                                         AS pruebas_descargadas,
           SUM(estado = 'Convertida')                       AS pruebas_convertidas,
           SUM(estado = 'Activa')                           AS pruebas_activas,
           SUM(estado = 'Vencida')                          AS pruebas_vencidas,
           ROUND(100 * SUM(estado = 'Convertida') / NULLIF(COUNT(*), 0), 1) AS pct_conversion
      FROM descarga_prueba
     WHERE fecha_inicio >= p_desde
       AND fecha_inicio <  p_hasta + INTERVAL 1 DAY;
END$$

-- ---------------------------------------------------------------------
-- R-04. Rendimiento por campaña (RF-42): prospectos, pruebas, ventas,
--       monto y costo por venta (presupuesto / ventas).
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_reporte_campanas(
    IN p_desde DATE,
    IN p_hasta DATE
)
BEGIN
    -- Cada métrica se agrega por separado (tablas derivadas) para no
    -- multiplicar filas al unir prospectos, pruebas y ventas.
    SELECT c.campana_id,
           c.nombre,
           c.canal,
           c.presupuesto,
           COALESCE(pr.prospectos, 0)                         AS prospectos,
           COALESCE(pb.pruebas, 0)                            AS pruebas,
           COALESCE(vt.ventas, 0)                             AS ventas,
           COALESCE(vt.monto, 0)                              AS monto_vendido,
           ROUND(c.presupuesto / NULLIF(vt.ventas, 0), 2)     AS costo_por_venta
      FROM campana c
      LEFT JOIN (SELECT campana_id, COUNT(*) AS prospectos
                   FROM prospecto
                  WHERE fecha_registro >= p_desde
                    AND fecha_registro <  p_hasta + INTERVAL 1 DAY
                  GROUP BY campana_id) pr ON pr.campana_id = c.campana_id
      LEFT JOIN (SELECT x.campana_id, COUNT(*) AS pruebas
                   FROM descarga_prueba d
                   JOIN prospecto x ON x.prospecto_id = d.prospecto_id
                  WHERE x.fecha_registro >= p_desde
                    AND x.fecha_registro <  p_hasta + INTERVAL 1 DAY
                  GROUP BY x.campana_id) pb ON pb.campana_id = c.campana_id
      LEFT JOIN (SELECT x.campana_id, COUNT(*) AS ventas, SUM(v.monto_final) AS monto
                   FROM venta v
                   JOIN propuesta p ON p.propuesta_id = v.propuesta_id
                   JOIN prospecto x ON x.prospecto_id = p.prospecto_id
                  WHERE x.fecha_registro >= p_desde
                    AND x.fecha_registro <  p_hasta + INTERVAL 1 DAY
                  GROUP BY x.campana_id) vt ON vt.campana_id = c.campana_id
     ORDER BY ventas DESC, monto_vendido DESC;
END$$

-- ---------------------------------------------------------------------
-- R-05. Embudo: prospectos por estado y % sobre el total (RF-43).
--       p_vendedor_id NULL = todos los vendedores.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_reporte_embudo(
    IN p_vendedor_id INT
)
BEGIN
    SELECT estado,
           COUNT(*)                                          AS prospectos,
           ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1)  AS pct_total
      FROM prospecto
     WHERE p_vendedor_id IS NULL OR empleado_id = p_vendedor_id
     GROUP BY estado
     ORDER BY FIELD(estado, 'Nuevo', 'En prueba', 'Calificado', 'Cliente', 'Descartado');
END$$

-- ---------------------------------------------------------------------
-- R-06. Tasa de cierre sobre prospectos que llegaron a Calificado
--       (RF-44), para comparar con la meta del caso: de 10 % a 15 %.
--       Calificados = los que hoy están Calificado o ya son Cliente.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_reporte_tasa_cierre(
    IN p_desde DATE,
    IN p_hasta DATE
)
BEGIN
    SELECT COUNT(*)                                    AS calificados,
           SUM(estado = 'Cliente')                     AS cerrados,
           ROUND(100 * SUM(estado = 'Cliente') / NULLIF(COUNT(*), 0), 1) AS tasa_cierre_pct
      FROM prospecto
     WHERE estado IN ('Calificado', 'Cliente')
       AND fecha_registro >= p_desde
       AND fecha_registro <  p_hasta + INTERVAL 1 DAY;
END$$

DELIMITER ;

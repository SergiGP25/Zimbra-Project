-- =====================================================================
-- Script   : 11_datos_demo.sql  (Sesion 4: datos listos para la demostracion)
-- Requisito: 01 a 10 ejecutados (usa los triggers y las reglas del sistema).
--
-- Que hace: agrega a los 60 prospectos base un conjunto pequeno de datos
-- RELATIVOS A LA FECHA ACTUAL, para que al montar el sistema todo se pueda
-- probar de inmediato (el script 02 tiene fecha fija 2026-11-04):
--   * 10 ventas de los ultimos 4 meses (graficos y reportes con datos
--     de este mes; el panel muestra "ventas de este mes")
--   * 3 propuestas Aceptadas SIN venta (para demostrar T4 y el bloqueo)
--   * 1 prospecto Calificado sin alertas (para demostrar T2: visita -> alerta)
--   * 2 alertas pendientes del vendedor 6
--   * 1 prueba por vencer en 5 dias y 1 ya vencida (para sp_vencer_pruebas)
--   * 3 prospectos Nuevos para registrar descargas / asignar vendedor
-- Todos los correos terminan en @demo-sesion4.com. El vendedor de la demo
-- es el 6 (carlos.salazar6@zimbra-demo.com, clave Zimbra2026*).
--
-- Es IDEMPOTENTE: si ya fue aplicado no hace nada. Docker lo ejecuta solo
-- al crear el volumen; en una base ya creada, usar DB/aplicar_datos_demo.ps1
-- (o .sh). Para borrar y recargar todo: docker compose down -v
-- =====================================================================
SET NAMES utf8mb4;
USE crm_zimbra;

DROP PROCEDURE IF EXISTS sp_demo_prospecto;
DROP PROCEDURE IF EXISTS sp_demo_propuesta;
DROP PROCEDURE IF EXISTS sp_demo_venta;
DROP PROCEDURE IF EXISTS sp_demo_cargar;

DELIMITER $$

-- Crea un prospecto y su estado inicial en el historial
CREATE PROCEDURE sp_demo_prospecto(
    IN  p_nombre    VARCHAR(100),
    IN  p_email     VARCHAR(120),
    IN  p_estado    VARCHAR(20),
    IN  p_puntaje   INT,
    IN  p_vendedor  INT,
    IN  p_dias      INT,
    OUT p_id        INT
)
BEGIN
    INSERT INTO prospecto (nombre, empresa, email, telefono, estado, puntaje_calificacion,
                           fecha_registro, empleado_id, fecha_asignacion, campana_id)
    VALUES (p_nombre, CONCAT('Demo ', SUBSTRING_INDEX(p_email, '@', 1)), p_email,
            CONCAT('+57 310 ', LPAD(FLOOR(RAND() * 10000000), 7, '0')),
            p_estado, p_puntaje, CURRENT_DATE - INTERVAL p_dias DAY,
            p_vendedor, IF(p_vendedor IS NULL, NULL, NOW()),
            1 + (p_puntaje + p_dias) MOD 30);
    SET p_id = LAST_INSERT_ID();
    INSERT INTO historial_estado (entidad, registro_id, estado_anterior, estado_nuevo, usuario_bd)
    VALUES ('Prospecto', p_id, NULL, p_estado, 'datos_demo');
END$$

-- Crea una propuesta (TR-02 calcula el valor) y la lleva al estado indicado
CREATE PROCEDURE sp_demo_propuesta(
    IN  p_prospecto INT,
    IN  p_vendedor  INT,
    IN  p_producto  INT,
    IN  p_licencias INT,
    IN  p_dias      INT,
    IN  p_final     VARCHAR(20),
    OUT p_id        INT
)
BEGIN
    INSERT INTO propuesta (prospecto_id, empleado_id, producto_id, num_licencias, valor_total, fecha_emision, estado)
    VALUES (p_prospecto, p_vendedor, p_producto, p_licencias, 0, CURRENT_DATE - INTERVAL p_dias DAY, 'Enviada');
    SET p_id = LAST_INSERT_ID();
    INSERT INTO historial_estado (entidad, registro_id, estado_anterior, estado_nuevo, usuario_bd)
    VALUES ('Propuesta', p_id, NULL, 'Enviada', 'datos_demo');
    IF p_final <> 'Enviada' THEN
        UPDATE propuesta SET estado = p_final WHERE propuesta_id = p_id;   -- TR-03 y TR-04
    END IF;
END$$

-- Recorre el proceso completo de un cliente: prueba -> propuesta -> venta (-> pago)
CREATE PROCEDURE sp_demo_venta(
    IN p_nombre    VARCHAR(100),
    IN p_email     VARCHAR(120),
    IN p_vendedor  INT,
    IN p_licencias INT,
    IN p_dias      INT,          -- hace cuantos dias fue la venta
    IN p_pagada    BOOLEAN
)
BEGIN
    DECLARE v_pid      INT;
    DECLARE v_prop     INT;
    DECLARE v_venta    INT;
    DECLARE v_gratis   INT;
    DECLARE v_comercial INT;

    SELECT producto_id INTO v_gratis    FROM producto WHERE version = 'Gratuita'  AND activo = TRUE ORDER BY producto_id LIMIT 1;
    SELECT producto_id INTO v_comercial FROM producto WHERE version = 'Comercial' AND activo = TRUE ORDER BY producto_id LIMIT 1;

    CALL sp_demo_prospecto(p_nombre, p_email, 'En prueba', 60, p_vendedor, p_dias + 25, v_pid);
    INSERT INTO descarga_prueba (prospecto_id, producto_id, fecha_inicio, estado)
    VALUES (v_pid, v_gratis, CURRENT_DATE - INTERVAL (p_dias + 20) DAY, 'Activa');

    CALL sp_demo_propuesta(v_pid, p_vendedor, v_comercial, p_licencias, p_dias + 3, 'Aceptada', v_prop);

    INSERT INTO venta (propuesta_id, fecha_venta, monto_final, forma_pago)       -- TR-06: monto 0 = valor total
    VALUES (v_prop, CURRENT_DATE - INTERVAL p_dias DAY, 0, ELT(1 + p_dias MOD 4, 'Transferencia', 'Tarjeta', 'Factura', 'Efectivo'));
    SET v_venta = LAST_INSERT_ID();
    INSERT INTO historial_estado (entidad, registro_id, estado_anterior, estado_nuevo, usuario_bd)
    VALUES ('Venta', v_venta, NULL, 'Pendiente', 'datos_demo');

    UPDATE prospecto       SET estado = 'Cliente'     WHERE prospecto_id = v_pid;     -- TR-05
    UPDATE descarga_prueba SET estado = 'Convertida'  WHERE prospecto_id = v_pid;

    IF p_pagada THEN
        UPDATE venta SET estado = 'Pagada' WHERE venta_id = v_venta;                 -- TR-07 y TR-08
        UPDATE venta SET fecha_pago = LEAST(CURRENT_DATE, fecha_venta + INTERVAL 3 DAY) WHERE venta_id = v_venta;
    END IF;
END$$

CREATE PROCEDURE sp_demo_cargar()
cuerpo: BEGIN
    DECLARE v_gratis    INT;
    DECLARE v_comercial INT;
    DECLARE v_p1 INT;
    DECLARE v_p2 INT;
    DECLARE v_p3 INT;
    DECLARE v_pr INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF EXISTS (SELECT 1 FROM prospecto WHERE email = 'demo.concurrencia1@demo-sesion4.com') THEN
        SELECT 'Datos demo ya cargados: no se hizo nada.' AS mensaje;
        LEAVE cuerpo;
    END IF;

    SELECT producto_id INTO v_gratis    FROM producto WHERE version = 'Gratuita'  AND activo = TRUE ORDER BY producto_id LIMIT 1;
    SELECT producto_id INTO v_comercial FROM producto WHERE version = 'Comercial' AND activo = TRUE ORDER BY producto_id LIMIT 1;

    START TRANSACTION;

    -- 1. Diez ventas de los ultimos ~4 meses (vendedores 6 a 10)
    CALL sp_demo_venta('Marta Delgado',    'demo.venta01@demo-sesion4.com', 6,  12, 110, TRUE);
    CALL sp_demo_venta('Hugo Parra',       'demo.venta02@demo-sesion4.com', 7,  25,  95, TRUE);
    CALL sp_demo_venta('Elena Cruz',       'demo.venta03@demo-sesion4.com', 8,   8,  80, TRUE);
    CALL sp_demo_venta('Iván Lozano',      'demo.venta04@demo-sesion4.com', 9,  40,  66, TRUE);
    CALL sp_demo_venta('Sofía Montoya',    'demo.venta05@demo-sesion4.com', 6,  15,  50, TRUE);
    CALL sp_demo_venta('Pablo Vega',       'demo.venta06@demo-sesion4.com', 10, 30,  38, TRUE);
    CALL sp_demo_venta('Lucía Herrera',    'demo.venta07@demo-sesion4.com', 7,  20,  24, TRUE);
    CALL sp_demo_venta('Andrés Ruiz',      'demo.venta08@demo-sesion4.com', 8,  10,  15, TRUE);
    CALL sp_demo_venta('Natalia Soto',     'demo.venta09@demo-sesion4.com', 6,  18,   8, FALSE);
    CALL sp_demo_venta('Daniel Mejía',     'demo.venta10@demo-sesion4.com', 9,  22,   2, FALSE);

    -- 2. Tres propuestas Aceptadas SIN venta, para demostrar T4 y el bloqueo (vendedor 6)
    CALL sp_demo_prospecto('Demo Concurrencia 1', 'demo.concurrencia1@demo-sesion4.com', 'Calificado', 60, 6, 12, v_p1);
    CALL sp_demo_prospecto('Demo Concurrencia 2', 'demo.concurrencia2@demo-sesion4.com', 'Calificado', 65, 6, 14, v_p2);
    CALL sp_demo_prospecto('Demo Concurrencia 3', 'demo.concurrencia3@demo-sesion4.com', 'Calificado', 75, 6, 16, v_p3);
    INSERT INTO descarga_prueba (prospecto_id, producto_id, fecha_inicio, estado) VALUES
        (v_p1, v_gratis, CURRENT_DATE - INTERVAL 12 DAY, 'Activa'),
        (v_p2, v_gratis, CURRENT_DATE - INTERVAL 14 DAY, 'Activa'),
        (v_p3, v_gratis, CURRENT_DATE - INTERVAL 16 DAY, 'Activa');
    CALL sp_demo_propuesta(v_p1, 6, v_comercial, 10, 4, 'Aceptada', v_pr);
    CALL sp_demo_propuesta(v_p2, 6, v_comercial, 20, 3, 'Aceptada', v_pr);
    CALL sp_demo_propuesta(v_p3, 6, v_comercial, 30, 2, 'Aceptada', v_pr);
    INSERT INTO interaccion (prospecto_id, empleado_id, campana_id, tipo, fecha_hora, resultado, notas)
    VALUES (v_p1, 6, NULL, 'Llamada', NOW() - INTERVAL 2 DAY, 'Positivo', 'Pidio propuesta de 10 licencias');
    -- dos alertas pendientes en la bandeja del vendedor 6
    INSERT INTO alerta (prospecto_id, empleado_id, fecha_hora, motivo, atendida) VALUES
        (v_p1, 6, NOW() - INTERVAL 1 DAY,  'Visita al sitio', FALSE),
        (v_p2, 6, NOW() - INTERVAL 3 HOUR, 'Visita al sitio', FALSE);

    -- 3. Calificado sin alertas: la primera visita genera alerta (T2)
    CALL sp_demo_prospecto('Demo Alerta', 'demo.alerta1@demo-sesion4.com', 'Calificado', 70, 6, 20, v_p1);
    INSERT INTO descarga_prueba (prospecto_id, producto_id, fecha_inicio, estado)
    VALUES (v_p1, v_gratis, CURRENT_DATE - INTERVAL 20 DAY, 'Activa');

    -- 4. Una prueba por vencer (5 dias) y una ya vencida pero aun "Activa"
    CALL sp_demo_prospecto('Demo Por Vencer', 'demo.vence1@demo-sesion4.com', 'En prueba', 35, 6, 56, v_p1);
    INSERT INTO descarga_prueba (prospecto_id, producto_id, fecha_inicio, estado)
    VALUES (v_p1, v_gratis, CURRENT_DATE - INTERVAL 55 DAY, 'Activa');
    CALL sp_demo_prospecto('Demo Vencida', 'demo.vence2@demo-sesion4.com', 'En prueba', 30, 6, 62, v_p1);
    INSERT INTO descarga_prueba (prospecto_id, producto_id, fecha_inicio, estado)
    VALUES (v_p1, v_gratis, CURRENT_DATE - INTERVAL 61 DAY, 'Activa');

    -- 5. Prospectos Nuevos: dos del vendedor 6 (T1) y uno sin vendedor (T5)
    CALL sp_demo_prospecto('Demo Nuevo 1',       'demo.nuevo1@demo-sesion4.com',       'Nuevo', 5, 6,    1, v_p1);
    CALL sp_demo_prospecto('Demo Nuevo 2',       'demo.nuevo2@demo-sesion4.com',       'Nuevo', 5, 6,    1, v_p1);
    CALL sp_demo_prospecto('Demo Sin Vendedor',  'demo.sinvendedor@demo-sesion4.com',  'Nuevo', 0, NULL, 0, v_p1);

    COMMIT;

    SELECT 'Datos demo cargados.' AS mensaje,
           (SELECT COUNT(*) FROM prospecto WHERE email LIKE '%@demo-sesion4.com') AS prospectos_demo,
           (SELECT COUNT(*) FROM venta) AS ventas_totales,
           (SELECT COUNT(*) FROM propuesta p LEFT JOIN venta v ON v.propuesta_id = p.propuesta_id
             WHERE p.estado = 'Aceptada' AND v.venta_id IS NULL) AS propuestas_aceptadas_sin_venta;
END$$

DELIMITER ;

CALL sp_demo_cargar();

DROP PROCEDURE sp_demo_cargar;
DROP PROCEDURE sp_demo_venta;
DROP PROCEDURE sp_demo_propuesta;
DROP PROCEDURE sp_demo_prospecto;

-- =====================================================================
-- Script   : 06_transacciones.sql
--            Transacciones ACID (START TRANSACTION / COMMIT / ROLLBACK),
--            SAVEPOINT y procedimientos almacenados T1 a T5.
-- Requisito: 01 a 05 ejecutados.
--
-- En MySQL, START TRANSACTION equivale a BEGIN TRANSACTION de SQL Server
-- (también se acepta BEGIN). Patrón usado en todos los procedimientos:
--
--   DECLARE EXIT HANDLER FOR SQLEXCEPTION
--   BEGIN
--       ROLLBACK;    -- deshace todo lo hecho desde START TRANSACTION
--       RESIGNAL;    -- devuelve el mismo error a quien llamó
--   END;
--   START TRANSACTION;
--       ... pasos ...
--   COMMIT;
--
-- Sin el manejador, MySQL solo deshace la instrucción que falló y deja
-- abiertas las anteriores: la transacción quedaría a medias.
--
--  Procedimiento               Transacción                   Savepoint
--  --------------------------- ----------------------------- ---------
--  sp_sumar_puntos             auxiliar (sin COMMIT propio)  -
--  sp_registrar_descarga       T1                            -
--  sp_registrar_visita         T2                            sí
--  sp_registrar_interaccion    T3                            -
--  sp_registrar_venta          T4 (SELECT ... FOR UPDATE)    -
--  sp_reasignar_prospecto      T5                            -
--  sp_vencer_pruebas           proceso por lotes (RF-19/26)  sí
--  sp_actualizar_propuesta     cambio de estado de propuesta -
-- =====================================================================
-- Lee este archivo como UTF-8 (sin esto, las tildes y la ñ se guardan dañadas)
SET NAMES utf8mb4;

USE crm_zimbra;

DROP PROCEDURE IF EXISTS sp_sumar_puntos;
DROP PROCEDURE IF EXISTS sp_registrar_descarga;
DROP PROCEDURE IF EXISTS sp_registrar_visita;
DROP PROCEDURE IF EXISTS sp_registrar_interaccion;
DROP PROCEDURE IF EXISTS sp_registrar_venta;
DROP PROCEDURE IF EXISTS sp_reasignar_prospecto;
DROP PROCEDURE IF EXISTS sp_vencer_pruebas;
DROP PROCEDURE IF EXISTS sp_actualizar_propuesta;

DELIMITER $$

-- ---------------------------------------------------------------------
-- sp_sumar_puntos: único lugar con las reglas RN-04 y RN-05.
--   - Suma puntos sin dejar el puntaje negativo.
--   - Si el prospecto está En prueba y llega a 50, pasa a Calificado.
--   No abre ni cierra transacción: siempre se llama DENTRO de T1, T2 o
--   T3, para que el puntaje se confirme o se deshaga junto con ellas.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_sumar_puntos(
    IN p_prospecto_id INT,
    IN p_puntos       INT
)
BEGIN
    DECLARE v_puntaje INT;
    DECLARE v_estado  VARCHAR(20);
    DECLARE v_nuevo   INT;

    SELECT puntaje_calificacion, estado
      INTO v_puntaje, v_estado
      FROM prospecto
     WHERE prospecto_id = p_prospecto_id
       FOR UPDATE;                                   -- bloquea la fila

    IF v_puntaje IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Puntaje: el prospecto no existe.';
    END IF;

    SET v_nuevo = GREATEST(v_puntaje + p_puntos, 0);

    IF v_estado = 'En prueba' AND v_nuevo >= 50 THEN
        SET v_estado = 'Calificado';                 -- RN-05
    END IF;

    UPDATE prospecto
       SET puntaje_calificacion = v_nuevo,
           estado               = v_estado
     WHERE prospecto_id = p_prospecto_id;
END$$

-- ---------------------------------------------------------------------
-- T1. Registrar descarga de prueba (HU-16, RF-17, RF-21)
--     Inserta la prueba, pasa el prospecto Nuevo a En prueba y suma 20.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_registrar_descarga(
    IN  p_prospecto_id INT,
    IN  p_producto_id  INT,
    OUT p_descarga_id  INT
)
BEGIN
    DECLARE v_estado VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT estado INTO v_estado
      FROM prospecto
     WHERE prospecto_id = p_prospecto_id
       FOR UPDATE;

    IF v_estado IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'T1: el prospecto no existe.';
    END IF;

    IF v_estado IN ('Cliente', 'Descartado') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'T1: no se registran pruebas para prospectos Cliente o Descartado.';
    END IF;

    IF EXISTS (SELECT 1 FROM descarga_prueba
                WHERE prospecto_id = p_prospecto_id
                  AND producto_id  = p_producto_id
                  AND estado       = 'Activa') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'T1: el prospecto ya tiene una prueba Activa de este producto (RN-03).';
    END IF;

    -- TR-01 valida que el producto sea Gratuita y activo.
    -- fecha_fin la calcula la columna generada.
    INSERT INTO descarga_prueba (prospecto_id, producto_id, fecha_inicio, estado)
    VALUES (p_prospecto_id, p_producto_id, CURRENT_DATE, 'Activa');
    SET p_descarga_id = LAST_INSERT_ID();

    IF v_estado = 'Nuevo' THEN
        UPDATE prospecto SET estado = 'En prueba'
         WHERE prospecto_id = p_prospecto_id;
    END IF;

    CALL sp_sumar_puntos(p_prospecto_id, 20);         -- RN-04

    COMMIT;
END$$

-- ---------------------------------------------------------------------
-- T2. Registrar visita web con SAVEPOINT (HU-20, HU-22, HU-23)
--     Paso 1: visita + puntaje (obligatorio).
--     SAVEPOINT sp_antes_alerta
--     Paso 2: alerta al vendedor (opcional). Si falla, se vuelve al
--             savepoint: la visita y el puntaje se conservan y la
--             transacción termina con COMMIT.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_registrar_visita(
    IN  p_prospecto_id    INT,
    IN  p_pagina          VARCHAR(200),
    IN  p_duracion        INT,
    OUT p_visita_id       INT,
    OUT p_alerta_generada BOOLEAN
)
BEGIN
    DECLARE v_estado   VARCHAR(20);
    DECLARE v_vendedor INT;
    DECLARE v_puntos   INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;                                     -- falla la visita: nada se guarda
        RESIGNAL;
    END;

    SET p_alerta_generada = FALSE;

    START TRANSACTION;

    SELECT estado INTO v_estado
      FROM prospecto
     WHERE prospecto_id = p_prospecto_id
       FOR UPDATE;

    IF v_estado IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'T2: el prospecto no existe.';
    END IF;

    INSERT INTO visita_web (prospecto_id, fecha_hora, pagina_visitada, duracion_segundos)
    VALUES (p_prospecto_id, NOW(), p_pagina, p_duracion);
    SET p_visita_id = LAST_INSERT_ID();

    -- RN-04: +5 por visita, +10 adicional si es la página de precios
    SET v_puntos = IF(p_pagina LIKE '/precios%', 15, 5);
    CALL sp_sumar_puntos(p_prospecto_id, v_puntos);

    SAVEPOINT sp_antes_alerta;

    -- Bloque interno con su propio manejador: solo afecta a la alerta
    BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK TO SAVEPOINT sp_antes_alerta;    -- deshace solo la alerta
            SET p_alerta_generada = FALSE;
        END;

        SELECT estado, empleado_id INTO v_estado, v_vendedor
          FROM prospecto
         WHERE prospecto_id = p_prospecto_id;

        -- RN-06 y HU-23: Calificado, con vendedor y máximo una alerta por hora
        IF v_estado = 'Calificado'
           AND v_vendedor IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM alerta
                            WHERE prospecto_id = p_prospecto_id
                              AND motivo = 'Visita al sitio'
                              AND fecha_hora >= NOW() - INTERVAL 1 HOUR) THEN
            INSERT INTO alerta (prospecto_id, empleado_id, fecha_hora, motivo, atendida)
            VALUES (p_prospecto_id, v_vendedor, NOW(), 'Visita al sitio', FALSE);
            SET p_alerta_generada = TRUE;
        END IF;
    END;

    COMMIT;
END$$

-- ---------------------------------------------------------------------
-- T3. Registrar interacción (HU-27, HU-29)
--     Inserta la interacción y, si el resultado es Positivo, suma 10.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_registrar_interaccion(
    IN  p_prospecto_id   INT,
    IN  p_empleado_id    INT,
    IN  p_tipo           VARCHAR(20),
    IN  p_resultado      VARCHAR(20),
    IN  p_notas          TEXT,
    IN  p_campana_id     INT,
    OUT p_interaccion_id INT
)
BEGIN
    DECLARE v_estado VARCHAR(20);
    DECLARE v_activo BOOLEAN;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT estado INTO v_estado
      FROM prospecto
     WHERE prospecto_id = p_prospecto_id
       FOR UPDATE;

    IF v_estado IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'T3: el prospecto no existe.';
    END IF;

    SELECT activo INTO v_activo
      FROM empleado
     WHERE empleado_id = p_empleado_id;

    IF v_activo IS NULL OR v_activo = FALSE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'T3: el empleado no existe o esta inactivo.';
    END IF;

    -- Los CHECK de la tabla validan tipo y resultado
    INSERT INTO interaccion (prospecto_id, empleado_id, campana_id, tipo, fecha_hora, resultado, notas)
    VALUES (p_prospecto_id, p_empleado_id, p_campana_id, p_tipo, NOW(), p_resultado, p_notas);
    SET p_interaccion_id = LAST_INSERT_ID();

    IF p_resultado = 'Positivo' THEN
        CALL sp_sumar_puntos(p_prospecto_id, 10);     -- RF-31
    END IF;

    COMMIT;
END$$

-- ---------------------------------------------------------------------
-- T4. Registrar venta (HU-33, RF-36, RF-37) - transacción crítica
--     SELECT ... FOR UPDATE bloquea la propuesta: si dos vendedores
--     intentan venderla al mismo tiempo, el segundo espera; cuando
--     continúa, encuentra la venta ya creada y falla.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_registrar_venta(
    IN  p_propuesta_id INT,
    IN  p_forma_pago   VARCHAR(20),
    IN  p_monto        DECIMAL(14,2),      -- NULL = valor total de la propuesta
    OUT p_venta_id     INT
)
BEGIN
    DECLARE v_estado    VARCHAR(20);
    DECLARE v_prospecto INT;
    DECLARE v_valor     DECIMAL(14,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- 1. Leer y bloquear la propuesta (aislamiento)
    SELECT estado, prospecto_id, valor_total
      INTO v_estado, v_prospecto, v_valor
      FROM propuesta
     WHERE propuesta_id = p_propuesta_id
       FOR UPDATE;

    IF v_estado IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'T4: la propuesta no existe.';
    END IF;

    IF v_estado <> 'Aceptada' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'T4: solo una propuesta Aceptada puede convertirse en venta.';
    END IF;

    IF EXISTS (SELECT 1 FROM venta WHERE propuesta_id = p_propuesta_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'T4: la propuesta ya tiene una venta registrada.';
    END IF;

    -- 2. Insertar la venta (TR-06 valida de nuevo; UNIQUE es la última barrera)
    INSERT INTO venta (propuesta_id, fecha_venta, monto_final, forma_pago)
    VALUES (p_propuesta_id, CURRENT_DATE, COALESCE(p_monto, v_valor), p_forma_pago);
    SET p_venta_id = LAST_INSERT_ID();

    -- 3. El prospecto pasa a Cliente (TR-05 lo registra en el historial)
    UPDATE prospecto SET estado = 'Cliente'
     WHERE prospecto_id = v_prospecto;

    -- 4. Sus pruebas Activas o Vencidas pasan a Convertida (RF-20)
    UPDATE descarga_prueba SET estado = 'Convertida'
     WHERE prospecto_id = v_prospecto
       AND estado IN ('Activa', 'Vencida');

    COMMIT;                                           -- todo o nada
END$$

-- ---------------------------------------------------------------------
-- T5. Reasignar prospecto (HU-09, RF-09)
--     Cambia el vendedor y le traslada las alertas no atendidas.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_reasignar_prospecto(
    IN  p_prospecto_id     INT,
    IN  p_vendedor_id      INT,
    OUT p_alertas_movidas  INT
)
BEGIN
    DECLARE v_rol      VARCHAR(20);
    DECLARE v_activo   BOOLEAN;
    DECLARE v_estado   VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT rol, activo INTO v_rol, v_activo
      FROM empleado
     WHERE empleado_id = p_vendedor_id;

    IF v_rol IS NULL OR v_rol <> 'Vendedor' OR v_activo = FALSE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'T5: solo se puede asignar a un Vendedor activo.';
    END IF;

    SELECT estado INTO v_estado
      FROM prospecto
     WHERE prospecto_id = p_prospecto_id
       FOR UPDATE;

    IF v_estado IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'T5: el prospecto no existe.';
    END IF;

    UPDATE prospecto
       SET empleado_id      = p_vendedor_id,
           fecha_asignacion = NOW()
     WHERE prospecto_id = p_prospecto_id;

    UPDATE alerta
       SET empleado_id = p_vendedor_id
     WHERE prospecto_id = p_prospecto_id
       AND atendida = FALSE;
    SET p_alertas_movidas = ROW_COUNT();

    COMMIT;
END$$

-- ---------------------------------------------------------------------
-- Proceso por lotes con SAVEPOINT (HU-18, HU-24, RF-19, RF-26)
--   Paso 1: pruebas Activas con fecha_fin pasada -> Vencida.
--   SAVEPOINT sp_vencidas_ok
--   Paso 2: alerta "Prueba por vencer" para pruebas Activas a 7 días o
--           menos, una sola por prueba. Si este paso falla, se vuelve al
--           savepoint y el vencimiento del paso 1 sí se confirma.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_vencer_pruebas(
    OUT p_vencidas INT,
    OUT p_alertas  INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET p_alertas = 0;

    START TRANSACTION;

    UPDATE descarga_prueba
       SET estado = 'Vencida'
     WHERE estado = 'Activa'
       AND fecha_fin < CURRENT_DATE;
    SET p_vencidas = ROW_COUNT();

    SAVEPOINT sp_vencidas_ok;

    BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK TO SAVEPOINT sp_vencidas_ok;
            SET p_alertas = 0;
        END;

        INSERT INTO alerta (prospecto_id, empleado_id, fecha_hora, motivo, atendida)
        SELECT d.prospecto_id, p.empleado_id, NOW(), 'Prueba por vencer', FALSE
          FROM descarga_prueba d
          JOIN prospecto p ON p.prospecto_id = d.prospecto_id
         WHERE d.estado = 'Activa'
           AND DATEDIFF(d.fecha_fin, CURRENT_DATE) BETWEEN 0 AND 7
           AND p.estado NOT IN ('Cliente', 'Descartado')
           AND p.empleado_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM alerta a
                            WHERE a.prospecto_id = d.prospecto_id
                              AND a.motivo = 'Prueba por vencer'
                              AND a.fecha_hora >= d.fecha_inicio);
        SET p_alertas = ROW_COUNT();
    END;

    COMMIT;
END$$

-- ---------------------------------------------------------------------
-- Cambio de estado de propuesta (HU-31, RF-34)
--   Lo valida TR-03; aquí se agrega que solo el vendedor dueño o un
--   Admin puede hacerlo, dentro de una transacción con bloqueo.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_actualizar_propuesta(
    IN p_propuesta_id INT,
    IN p_nuevo_estado VARCHAR(20),
    IN p_empleado_id  INT
)
BEGIN
    DECLARE v_dueno INT;
    DECLARE v_rol   VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT empleado_id INTO v_dueno
      FROM propuesta
     WHERE propuesta_id = p_propuesta_id
       FOR UPDATE;

    IF v_dueno IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Propuesta: no existe.';
    END IF;

    SELECT rol INTO v_rol FROM empleado WHERE empleado_id = p_empleado_id;

    IF v_rol IS NULL OR (v_rol <> 'Admin' AND v_dueno <> p_empleado_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Propuesta: solo el vendedor responsable o un Admin puede cambiarla.';
    END IF;

    UPDATE propuesta SET estado = p_nuevo_estado
     WHERE propuesta_id = p_propuesta_id;            -- TR-03 y TR-04 actúan aquí

    COMMIT;
END$$

DELIMITER ;

-- Comprobación: deben aparecer 8 procedimientos de este script
SELECT routine_name
  FROM information_schema.routines
 WHERE routine_schema = 'crm_zimbra'
   AND routine_type = 'PROCEDURE'
 ORDER BY routine_name;

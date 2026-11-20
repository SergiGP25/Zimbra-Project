-- =====================================================================
-- Script   : 05_triggers.sql  (Sesión 3: automatización con triggers)
-- Requisito: 01 a 04 ejecutados.
--
-- Un trigger es código que MySQL ejecuta solo, antes (BEFORE) o después
-- (AFTER) de un INSERT, UPDATE o DELETE sobre una tabla. NEW es la fila
-- que se va a guardar y OLD la fila como estaba. En un BEFORE se puede
-- modificar NEW o cancelar la operación con SIGNAL.
--
-- Regla de MySQL: un trigger no puede modificar la misma tabla que lo
-- disparó, pero sí otras tablas.
--
--  Trigger                  Tabla            Momento        Regla
--  ------------------------ ---------------- -------------- -----------------
--  trg_descarga_bi          descarga_prueba  BEFORE INSERT  RF-17 (solo Gratuita activa)
--  trg_propuesta_bi         propuesta        BEFORE INSERT  RN-07, RF-33, HU-30
--  trg_propuesta_bu         propuesta        BEFORE UPDATE  RF-34, HU-31 (transiciones)
--  trg_propuesta_au         propuesta        AFTER UPDATE   RNF-17 (historial)
--  trg_prospecto_au         prospecto        AFTER UPDATE   historial + propuestas
--                                                           Enviadas -> Rechazada al descartar
--  trg_venta_bi             venta            BEFORE INSERT  RN-09 (solo propuesta Aceptada)
--  trg_venta_bu             venta            BEFORE UPDATE  RF-39, HU-35 (pago irreversible)
--  trg_venta_au             venta            AFTER UPDATE   RNF-17 (historial)
-- =====================================================================
-- Lee este archivo como UTF-8 (sin esto, las tildes y la ñ se guardan dañadas)
SET NAMES utf8mb4;

USE crm_zimbra;

DROP TRIGGER IF EXISTS trg_descarga_bi;
DROP TRIGGER IF EXISTS trg_propuesta_bi;
DROP TRIGGER IF EXISTS trg_propuesta_bu;
DROP TRIGGER IF EXISTS trg_propuesta_au;
DROP TRIGGER IF EXISTS trg_prospecto_au;
DROP TRIGGER IF EXISTS trg_venta_bi;
DROP TRIGGER IF EXISTS trg_venta_bu;
DROP TRIGGER IF EXISTS trg_venta_au;

DELIMITER $$

-- ---------------------------------------------------------------------
-- TR-01. Una descarga de prueba solo se registra sobre un producto de
--        versión Gratuita y activo (RF-17, HU-12, HU-16).
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_descarga_bi
BEFORE INSERT ON descarga_prueba
FOR EACH ROW
BEGIN
    DECLARE v_version VARCHAR(20);
    DECLARE v_activo  BOOLEAN;

    SELECT version, activo INTO v_version, v_activo
      FROM producto
     WHERE producto_id = NEW.producto_id;

    IF v_version IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-01: el producto no existe.';
    ELSEIF v_version <> 'Gratuita' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-01: solo se registran pruebas de productos de version Gratuita.';
    ELSEIF v_activo = FALSE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-01: el producto esta inactivo y no admite nuevas pruebas.';
    END IF;
END$$

-- ---------------------------------------------------------------------
-- TR-02. Al crear una propuesta: producto Comercial y activo (RN-07),
--        valor_total = licencias x precio (RF-33) y estado inicial
--        Enviada (HU-30). El usuario no puede fijar el valor a mano.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_propuesta_bi
BEFORE INSERT ON propuesta
FOR EACH ROW
BEGIN
    DECLARE v_version VARCHAR(20);
    DECLARE v_activo  BOOLEAN;
    DECLARE v_precio  DECIMAL(12,2);

    SELECT version, activo, precio_unitario
      INTO v_version, v_activo, v_precio
      FROM producto
     WHERE producto_id = NEW.producto_id;

    IF v_version IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-02: el producto no existe.';
    ELSEIF v_version <> 'Comercial' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-02: solo se crean propuestas con productos de version Comercial (RN-07).';
    ELSEIF v_activo = FALSE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-02: el producto esta inactivo.';
    END IF;

    SET NEW.valor_total = NEW.num_licencias * v_precio;
    SET NEW.estado      = 'Enviada';
END$$

-- ---------------------------------------------------------------------
-- TR-03. Actualizar estado de propuesta: solo desde Enviada hacia
--        Aceptada o Rechazada; una propuesta cerrada no se modifica.
--        Si cambian las licencias o el producto, recalcula el valor.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_propuesta_bu
BEFORE UPDATE ON propuesta
FOR EACH ROW
BEGIN
    DECLARE v_precio DECIMAL(12,2);

    IF OLD.estado <> 'Enviada' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-03: una propuesta Aceptada o Rechazada no se puede modificar.';
    END IF;

    IF NEW.estado NOT IN ('Enviada', 'Aceptada', 'Rechazada') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-03: estado de propuesta no valido.';
    END IF;

    IF NEW.num_licencias <> OLD.num_licencias OR NEW.producto_id <> OLD.producto_id THEN
        SELECT precio_unitario INTO v_precio
          FROM producto WHERE producto_id = NEW.producto_id;
        SET NEW.valor_total = NEW.num_licencias * v_precio;
    ELSE
        SET NEW.valor_total = OLD.valor_total;   -- el valor no se edita a mano
    END IF;
END$$

-- ---------------------------------------------------------------------
-- TR-04. Deja constancia en el historial de cada cambio de estado de una
--        propuesta (RNF-17).
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_propuesta_au
AFTER UPDATE ON propuesta
FOR EACH ROW
BEGIN
    IF NEW.estado <> OLD.estado THEN
        INSERT INTO historial_estado (entidad, registro_id, estado_anterior, estado_nuevo, usuario_bd)
        VALUES ('Propuesta', NEW.propuesta_id, OLD.estado, NEW.estado, CURRENT_USER());
    END IF;
END$$

-- ---------------------------------------------------------------------
-- TR-05. Cambio de estado del prospecto:
--        a) lo registra en el historial (RNF-17);
--        b) si el prospecto pasa a Descartado, sus propuestas Enviadas
--           pasan a Rechazada (ya no tiene sentido esperar respuesta).
--        Ese UPDATE sobre propuesta dispara a su vez TR-03 y TR-04.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_prospecto_au
AFTER UPDATE ON prospecto
FOR EACH ROW
BEGIN
    IF NEW.estado <> OLD.estado THEN
        INSERT INTO historial_estado (entidad, registro_id, estado_anterior, estado_nuevo, usuario_bd)
        VALUES ('Prospecto', NEW.prospecto_id, OLD.estado, NEW.estado, CURRENT_USER());

        IF NEW.estado = 'Descartado' THEN
            UPDATE propuesta
               SET estado = 'Rechazada'
             WHERE prospecto_id = NEW.prospecto_id
               AND estado = 'Enviada';
        END IF;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- TR-06. Una venta solo nace de una propuesta Aceptada (RN-09) y su monto
--        no puede superar el valor pactado. Si no se envía monto, toma el
--        valor total de la propuesta. Siempre inicia como Pendiente.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_venta_bi
BEFORE INSERT ON venta
FOR EACH ROW
BEGIN
    DECLARE v_estado VARCHAR(20);
    DECLARE v_valor  DECIMAL(14,2);

    SELECT estado, valor_total INTO v_estado, v_valor
      FROM propuesta
     WHERE propuesta_id = NEW.propuesta_id;

    IF v_estado IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-06: la propuesta no existe.';
    ELSEIF v_estado <> 'Aceptada' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-06: solo una propuesta Aceptada puede convertirse en venta (RN-09).';
    END IF;

    IF NEW.monto_final IS NULL OR NEW.monto_final = 0 THEN
        SET NEW.monto_final = v_valor;
    ELSEIF NEW.monto_final > v_valor THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-06: el monto de la venta no puede superar el valor de la propuesta.';
    END IF;

    SET NEW.estado     = 'Pendiente';
    SET NEW.fecha_pago = NULL;
END$$

-- ---------------------------------------------------------------------
-- TR-07. Estado de pago (RF-39, HU-35): Pendiente -> Pagada, sin vuelta
--        atrás; guarda la fecha del pago.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_venta_bu
BEFORE UPDATE ON venta
FOR EACH ROW
BEGIN
    IF OLD.estado = 'Pagada' AND NEW.estado <> 'Pagada' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-07: una venta Pagada no puede volver a Pendiente.';
    END IF;

    IF NEW.propuesta_id <> OLD.propuesta_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TR-07: no se puede cambiar la propuesta de una venta.';
    END IF;

    IF OLD.estado = 'Pendiente' AND NEW.estado = 'Pagada' THEN
        SET NEW.fecha_pago = CURRENT_DATE;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- TR-08. Historial de cambios de estado de pago (RNF-17).
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_venta_au
AFTER UPDATE ON venta
FOR EACH ROW
BEGIN
    IF NEW.estado <> OLD.estado THEN
        INSERT INTO historial_estado (entidad, registro_id, estado_anterior, estado_nuevo, usuario_bd)
        VALUES ('Venta', NEW.venta_id, OLD.estado, NEW.estado, CURRENT_USER());
    END IF;
END$$

DELIMITER ;

-- Comprobación: deben aparecer 8 triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation
  FROM information_schema.triggers
 WHERE trigger_schema = 'crm_zimbra'
 ORDER BY event_object_table, action_timing, event_manipulation;

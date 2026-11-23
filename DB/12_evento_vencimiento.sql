-- =====================================================================
-- Script   : 12_evento_vencimiento.sql  (RF-19 y RF-26 automaticos)
-- Requisito: 01 a 11 ejecutados (usa sp_vencer_pruebas de 06).
--
-- Un EVENTO de MySQL es una tarea programada dentro del motor, como una
-- alarma: a la hora indicada MySQL ejecuta el cuerpo solo, sin que nadie
-- pulse un boton. Aqui, todos los dias a las 00:05:
--   1. Las pruebas Activas cuya fecha_fin ya paso pasan a Vencida (RF-19).
--   2. Se crea la alerta "Prueba por vencer" para las que terminan en
--      7 dias o menos (RF-26), una sola vez por prueba.
-- El boton "Actualizar vencimientos" de la pantalla Pruebas sigue sirviendo
-- para ejecutarlo a mano durante la demostracion.
--
-- Requiere event_scheduler = ON (es el valor por defecto en MySQL 8).
-- Verificar: SHOW VARIABLES LIKE 'event_scheduler';  SHOW EVENTS;
-- =====================================================================
SET NAMES utf8mb4;
USE crm_zimbra;

DROP EVENT IF EXISTS ev_vencer_pruebas;

CREATE EVENT ev_vencer_pruebas
    ON SCHEDULE EVERY 1 DAY
    STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 5 MINUTE)
    ON COMPLETION PRESERVE
    COMMENT 'RF-19 y RF-26: vence pruebas y avisa las que vencen pronto'
    DO CALL sp_vencer_pruebas(@vencidas, @alertas);

-- No se ejecuta al crear la base: 11_datos_demo.sql deja una prueba vencida
-- pero aun Activa a proposito, para demostrar el boton en la presentacion.

SELECT event_name, status, interval_value, interval_field, starts
  FROM information_schema.events
 WHERE event_schema = 'crm_zimbra';

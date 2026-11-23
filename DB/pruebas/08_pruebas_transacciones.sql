-- =====================================================================
-- Script   : pruebas/08_pruebas_transacciones.sql
--            Evidencia de transacciones ACID, savepoints, triggers,
--            procedimientos y reportes (HU-43).
-- Uso      : NO ejecutar completo. Copiar cada bloque a la consola
--            (MySQL Workbench o docker exec -it zimbra_mysql mysql -uroot
--            crm_zimbra), ejecutarlo y comparar con "ESPERADO".
--            Los bloques de error (E1 a E10) DEBEN fallar.
--            Para repetir desde cero: docker compose down -v && docker
--            compose up -d db
-- Datos    : los de 02_insertar_datos.sql sin modificar.
-- =====================================================================
-- Lee este archivo como UTF-8 (sin esto, las tildes y la ñ se guardan dañadas)
SET NAMES utf8mb4;

USE crm_zimbra;

-- =====================================================================
-- PARTE A. Transacciones manuales: BEGIN / COMMIT / ROLLBACK / SAVEPOINT
-- =====================================================================

-- A1. ROLLBACK: el cambio se ve dentro de la transacción y luego desaparece
SELECT presupuesto FROM campana WHERE campana_id = 1;      -- 46000000.00
START TRANSACTION;                                          -- = BEGIN TRANSACTION
    UPDATE campana SET presupuesto = 99999 WHERE campana_id = 1;
    SELECT presupuesto FROM campana WHERE campana_id = 1;  -- 99999.00
ROLLBACK;
SELECT presupuesto FROM campana WHERE campana_id = 1;      -- ESPERADO: 46000000.00

-- A2. COMMIT: el cambio queda permanente (durabilidad)
START TRANSACTION;
    UPDATE campana SET presupuesto = presupuesto + 500 WHERE campana_id = 1;
COMMIT;
SELECT presupuesto FROM campana WHERE campana_id = 1;      -- ESPERADO: 46000500.00

-- A3. Error a mitad de una transacción SIN manejador:
--     MySQL solo deshace la instrucción que falló; la anterior sigue
--     pendiente. Por eso los procedimientos usan EXIT HANDLER + ROLLBACK.
START TRANSACTION;
    UPDATE campana SET presupuesto = presupuesto + 1 WHERE campana_id = 2;  -- funciona
    INSERT INTO venta (propuesta_id, monto_final, forma_pago)
    VALUES (1, 100, 'Tarjeta');                             -- falla: TR-06/UNIQUE
    SELECT presupuesto FROM campana WHERE campana_id = 2;   -- 71000001.00 (sigue el cambio)
ROLLBACK;                                                   -- decisión: deshacer todo
SELECT presupuesto FROM campana WHERE campana_id = 2;      -- ESPERADO: 71000000.00

-- A4. SAVEPOINT: deshacer solo una parte y confirmar el resto
SELECT COUNT(*) FROM visita_web WHERE prospecto_id = 45;   -- anote el valor (n)
SELECT COUNT(*) FROM alerta     WHERE prospecto_id = 45;   -- anote el valor (m)
START TRANSACTION;
    INSERT INTO visita_web (prospecto_id, pagina_visitada, duracion_segundos)
    VALUES (45, '/documentacion', 120);
    SAVEPOINT sp_visita;
    INSERT INTO alerta (prospecto_id, empleado_id, motivo)
    VALUES (45, 22, 'Visita al sitio');
    ROLLBACK TO SAVEPOINT sp_visita;                        -- quita solo la alerta
COMMIT;
SELECT COUNT(*) FROM visita_web WHERE prospecto_id = 45;   -- ESPERADO: n + 1
SELECT COUNT(*) FROM alerta     WHERE prospecto_id = 45;   -- ESPERADO: m

-- A5. Varios savepoints en la misma transacción
START TRANSACTION;
    UPDATE producto SET precio_unitario = 26 WHERE producto_id = 9;
    SAVEPOINT sp_uno;
    UPDATE producto SET precio_unitario = 27 WHERE producto_id = 9;
    SAVEPOINT sp_dos;
    UPDATE producto SET precio_unitario = 28 WHERE producto_id = 9;
    ROLLBACK TO SAVEPOINT sp_uno;                           -- vuelve a 26
    RELEASE SAVEPOINT sp_uno;                               -- libera la marca
COMMIT;
SELECT precio_unitario FROM producto WHERE producto_id = 9; -- ESPERADO: 26.00
UPDATE producto SET precio_unitario = 25 WHERE producto_id = 9;  -- deja el dato original

-- =====================================================================
-- PARTE B. Procedimientos con datos válidos (transacciones T1 a T5)
-- =====================================================================

-- B1. T1 - Descarga de prueba. Prospecto 18: Nuevo, 5 puntos.
SELECT estado, puntaje_calificacion FROM prospecto WHERE prospecto_id = 18;
CALL sp_registrar_descarga(18, 3, @descarga);
SELECT @descarga AS descarga_id;
SELECT descarga_id, fecha_inicio, fecha_fin, estado, activa_flag,
       DATEDIFF(fecha_fin, CURRENT_DATE) AS dias_restantes
  FROM descarga_prueba WHERE descarga_id = @descarga;      -- fecha_fin = hoy + 60
SELECT estado, puntaje_calificacion FROM prospecto WHERE prospecto_id = 18;
-- ESPERADO: En prueba, 25

-- B2. T2 - Visita con alerta. Prospecto 19: Calificado, 70 puntos, vendedor 22.
CALL sp_registrar_visita(19, '/precios', 240, @visita, @alerta);
SELECT @visita AS visita_id, @alerta AS alerta_generada;   -- ESPERADO: alerta_generada = 1
SELECT puntaje_calificacion FROM prospecto WHERE prospecto_id = 19;  -- ESPERADO: 85
SELECT alerta_id, empleado_id, motivo, atendida
  FROM alerta WHERE prospecto_id = 19 ORDER BY alerta_id DESC LIMIT 1;

-- B3. T2 - Una segunda visita en la misma hora NO genera otra alerta (HU-23)
CALL sp_registrar_visita(19, '/blog', 60, @visita, @alerta);
SELECT @alerta AS alerta_generada;                          -- ESPERADO: 0

-- B4. T2 - Paso a Calificado. Prospecto 20: En prueba, 40 puntos.
CALL sp_registrar_visita(20, '/precios', 300, @visita, @alerta);
SELECT estado, puntaje_calificacion FROM prospecto WHERE prospecto_id = 20;
-- ESPERADO: Calificado, 55 (y @alerta = 1, porque ya es Calificado)

-- B5. T3 - Interacción positiva. Prospecto 12: En prueba, 30, vendedor 16.
CALL sp_registrar_interaccion(12, 16, 'Llamada', 'Positivo',
                              'Pide cotizacion para 20 usuarios', NULL, @inter);
SELECT puntaje_calificacion FROM prospecto WHERE prospecto_id = 12;  -- ESPERADO: 40

-- B6. Trigger TR-02 - Crear propuesta: el valor lo calcula el trigger
--     (se envía valor_total = 1 y estado Aceptada a propósito).
INSERT INTO propuesta (prospecto_id, empleado_id, producto_id, num_licencias, valor_total, estado)
VALUES (20, 23, 10, 20, 1, 'Aceptada');
SET @prop = LAST_INSERT_ID();
SELECT propuesta_id, num_licencias, valor_total, estado
  FROM propuesta WHERE propuesta_id = @prop;
-- ESPERADO: valor_total = 3600000.00 (20 x 180000) y estado = Enviada

-- B7. Trigger TR-03 - Actualizar estado de la propuesta (Enviada -> Aceptada)
CALL sp_actualizar_propuesta(@prop, 'Aceptada', 23);
SELECT estado FROM propuesta WHERE propuesta_id = @prop;   -- ESPERADO: Aceptada
SELECT * FROM historial_estado
 WHERE entidad = 'Propuesta' AND registro_id = @prop;       -- Enviada -> Aceptada

-- B8. T4 - Registrar la venta (transacción crítica)
CALL sp_registrar_venta(@prop, 'Transferencia', NULL, @venta);
SELECT venta_id, monto_final, estado FROM venta WHERE venta_id = @venta;  -- 3600000.00, Pendiente
SELECT estado FROM prospecto WHERE prospecto_id = 20;       -- ESPERADO: Cliente
SELECT estado FROM descarga_prueba WHERE prospecto_id = 20; -- ESPERADO: Convertida

-- B9. Trigger TR-07 - Pago de la venta
UPDATE venta SET estado = 'Pagada' WHERE venta_id = @venta;
SELECT estado, fecha_pago FROM venta WHERE venta_id = @venta;   -- Pagada, hoy

-- B10. T5 - Reasignar prospecto 19 (tiene la alerta pendiente de B2)
CALL sp_reasignar_prospecto(19, 6, @movidas);
SELECT @movidas AS alertas_movidas;                         -- ESPERADO: 1 o más
SELECT empleado_id, fecha_asignacion FROM prospecto WHERE prospecto_id = 19;  -- 6, ahora

-- B11. Trigger TR-05 - Descartar prospecto 6 (tiene la propuesta 31 Enviada)
UPDATE prospecto SET estado = 'Descartado' WHERE prospecto_id = 6;
SELECT propuesta_id, estado FROM propuesta WHERE prospecto_id = 6;  -- ESPERADO: 31 Rechazada

-- B12. Proceso por lotes con SAVEPOINT: vencer pruebas y avisar
SELECT COUNT(*) AS activas_vencidas FROM descarga_prueba
 WHERE estado = 'Activa' AND fecha_fin < CURRENT_DATE;
CALL sp_vencer_pruebas(@vencidas, @avisos);
SELECT @vencidas AS pruebas_vencidas, @avisos AS alertas_por_vencer;

-- B13. Historial generado por los triggers durante la parte B
SELECT * FROM historial_estado
 WHERE usuario_bd <> 'carga_inicial'
 ORDER BY historial_id;

-- =====================================================================
-- PARTE C. Simulación de errores y recuperación (TODOS deben fallar y
--          dejar los datos como estaban)
-- =====================================================================

-- E1. T4 sobre una propuesta Enviada (33)
CALL sp_registrar_venta(33, 'Tarjeta', NULL, @v);
-- ESPERADO: ERROR 1644 T4: solo una propuesta Aceptada puede convertirse en venta.
SELECT COUNT(*) FROM venta WHERE propuesta_id = 33;         -- ESPERADO: 0

-- E2. T4 dos veces sobre la misma propuesta (la 1 ya tiene venta)
CALL sp_registrar_venta(1, 'Tarjeta', NULL, @v);
-- ESPERADO: ERROR 1644 T4: la propuesta ya tiene una venta registrada.

-- E3. T1 con un producto Comercial: el trigger TR-01 aborta y el
--     manejador deshace todo (el puntaje no cambia)
SELECT puntaje_calificacion FROM prospecto WHERE prospecto_id = 21;  -- 25
CALL sp_registrar_descarga(21, 10, @d);
-- ESPERADO: ERROR 1644 TR-01: solo se registran pruebas de productos de version Gratuita.
SELECT puntaje_calificacion FROM prospecto WHERE prospecto_id = 21;  -- ESPERADO: 25

-- E4. T1 repetida: segunda prueba Activa del mismo producto (RN-03)
CALL sp_registrar_descarga(18, 3, @d);
-- ESPERADO: ERROR 1644 T1: el prospecto ya tiene una prueba Activa de este producto (RN-03).
--     Sin la validación del procedimiento, el UNIQUE uq_prueba_activa
--     respondería: ERROR 1062 Duplicate entry ... for key 'uq_prueba_activa'.

-- E5. Propuesta con producto Gratuito (RN-07)
INSERT INTO propuesta (prospecto_id, empleado_id, producto_id, num_licencias)
VALUES (39, 18, 2, 10);
-- ESPERADO: ERROR 1644 TR-02: solo se crean propuestas con productos de version Comercial (RN-07).

-- E6. Reabrir una propuesta Aceptada
UPDATE propuesta SET estado = 'Enviada' WHERE propuesta_id = 1;
-- ESPERADO: ERROR 1644 TR-03: una propuesta Aceptada o Rechazada no se puede modificar.

-- E7. T5 hacia un vendedor inactivo (29)
CALL sp_reasignar_prospecto(39, 29, @m);
-- ESPERADO: ERROR 1644 T5: solo se puede asignar a un Vendedor activo.

-- E8. Venta Pagada que intenta volver a Pendiente
UPDATE venta SET estado = 'Pendiente' WHERE venta_id = 1;
-- ESPERADO: ERROR 1644 TR-07: una venta Pagada no puede volver a Pendiente.

-- E9. Propuesta con 0 licencias: la frena el CHECK de la tabla
INSERT INTO propuesta (prospecto_id, empleado_id, producto_id, num_licencias)
VALUES (39, 18, 10, 0);
-- ESPERADO: ERROR 3819 Check constraint 'ck_propuesta_licencias' is violated.

-- E10. T3 con un resultado no permitido: el CHECK falla DESPUÉS de
--      validar prospecto y empleado; el manejador hace ROLLBACK.
SELECT COUNT(*) FROM interaccion WHERE prospecto_id = 39;   -- anote el valor
CALL sp_registrar_interaccion(39, 18, 'Llamada', 'Excelente', 'prueba', NULL, @i);
-- ESPERADO: ERROR 3819 Check constraint 'ck_interaccion_resultado' is violated.
SELECT COUNT(*) FROM interaccion WHERE prospecto_id = 39;   -- ESPERADO: el mismo valor

-- E11. Intentar escribir la columna generada fecha_fin
INSERT INTO descarga_prueba (prospecto_id, producto_id, fecha_inicio, fecha_fin)
VALUES (39, 4, '2026-11-18', '2026-12-01');
-- ESPERADO: ERROR 3105 The value specified for generated column 'fecha_fin' ... is not allowed.

-- =====================================================================
-- PARTE D. Concurrencia con SELECT ... FOR UPDATE (dos terminales)
-- =====================================================================
-- Terminal 1:
--   START TRANSACTION;
--   SELECT * FROM propuesta WHERE propuesta_id = 34 FOR UPDATE;
--   (no haga COMMIT todavía)
-- Terminal 2:
--   CALL sp_actualizar_propuesta(34, 'Aceptada', 18);
--   -> queda esperando: la fila está bloqueada por la terminal 1.
-- Terminal 1:
--   COMMIT;
--   -> la terminal 2 continúa y termina. Si espera más de 50 s aparece
--      ERROR 1205 Lock wait timeout (innodb_lock_wait_timeout).

-- =====================================================================
-- PARTE E. Reportes
-- =====================================================================
CALL sp_reporte_ventas_mensual(2026, 6);
CALL sp_reporte_resumen_anual(2026);
CALL sp_reporte_conversion('2026-01-01', '2026-12-31');
CALL sp_reporte_campanas('2026-01-01', '2026-12-31');
CALL sp_reporte_embudo(NULL);
CALL sp_reporte_embudo(22);
CALL sp_reporte_tasa_cierre('2026-01-01', '2026-12-31');

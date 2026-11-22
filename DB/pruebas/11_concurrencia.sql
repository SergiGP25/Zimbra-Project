-- =====================================================================
-- Simulacion de concurrencia y bloqueos (Sesion 4)
-- Cada escenario usa DOS terminales (A y B):
--   docker exec -it zimbra_mysql mysql -uroot crm_zimbra
-- Ejecutar los pasos en el orden indicado, alternando terminales.
-- Al terminar cada escenario, ejecutar ROLLBACK en ambas.
-- =====================================================================

-- =====================================================================
-- ESCENARIO 1. Actualizacion perdida (lost update) SIN bloqueo
-- El puntaje del prospecto 11 se lee, se suma en la aplicacion y se
-- escribe: si dos usuarios lo hacen a la vez, uno pisa al otro.
-- =====================================================================
-- [A] SELECT puntaje_calificacion FROM prospecto WHERE prospecto_id = 11;   -- ej. 45
-- [B] SELECT puntaje_calificacion FROM prospecto WHERE prospecto_id = 11;   -- 45
-- [A] START TRANSACTION; UPDATE prospecto SET puntaje_calificacion = 45 + 5 WHERE prospecto_id = 11; COMMIT;
-- [B] START TRANSACTION; UPDATE prospecto SET puntaje_calificacion = 45 + 5 WHERE prospecto_id = 11; COMMIT;
-- RESULTADO: queda 50, debia quedar 55. Se perdio la suma de A.

-- =====================================================================
-- ESCENARIO 2. El mismo caso CON SELECT ... FOR UPDATE (lo que hace
-- sp_sumar_puntos). B espera a que A termine y lee el valor ya actualizado.
-- =====================================================================
-- [A] START TRANSACTION;
-- [A] SELECT puntaje_calificacion FROM prospecto WHERE prospecto_id = 11 FOR UPDATE;   -- 45, fila bloqueada
-- [B] START TRANSACTION;
-- [B] SELECT puntaje_calificacion FROM prospecto WHERE prospecto_id = 11 FOR UPDATE;   -- QUEDA ESPERANDO
-- [A] UPDATE prospecto SET puntaje_calificacion = 50 WHERE prospecto_id = 11;  COMMIT;
-- [B] (se libera y devuelve 50) UPDATE ... = 55;  COMMIT;
-- RESULTADO: 55. No se perdio nada.

-- Ver quien espera a quien (en una tercera terminal, mientras B espera):
SELECT * FROM sys.innodb_lock_waits\G
SELECT thread_id, event_name, object_name, lock_type, lock_mode, lock_status
  FROM performance_schema.data_locks WHERE object_name = 'prospecto';

-- =====================================================================
-- ESCENARIO 3. Dos ventas de la misma propuesta (T4)
-- Usar una propuesta Aceptada sin venta (ver con la consulta siguiente).
-- =====================================================================
SELECT p.propuesta_id FROM propuesta p LEFT JOIN venta v ON v.propuesta_id = p.propuesta_id
 WHERE p.estado = 'Aceptada' AND v.venta_id IS NULL;
-- Si no hay ninguna, crear una: INSERT de propuesta (trigger TR-02) y
-- CALL sp_actualizar_propuesta(<id>, 'Aceptada', <vendedor>);
-- [A] CALL sp_registrar_venta(<id>, 'Transferencia', NULL, @v);   -- ver nota abajo
-- Para ver la espera, A debe quedar con la transaccion ABIERTA. Como el
-- procedimiento hace COMMIT solo, se reproduce a mano:
-- [A] START TRANSACTION; SELECT estado FROM propuesta WHERE propuesta_id = <id> FOR UPDATE;
-- [B] CALL sp_registrar_venta(<id>, 'Efectivo', NULL, @v);        -- QUEDA ESPERANDO
-- [A] INSERT INTO venta (propuesta_id, fecha_venta, monto_final, forma_pago) SELECT propuesta_id, CURRENT_DATE, valor_total, 'Tarjeta' FROM propuesta WHERE propuesta_id = <id>; COMMIT;
-- [B] termina con: ERROR 1644 "T4: la propuesta ya tiene una venta registrada."
-- Gracias a FOR UPDATE + UNIQUE(propuesta_id) nunca hay dos ventas (RNF-12).

-- =====================================================================
-- ESCENARIO 4. Interbloqueo (deadlock) y como lo resuelve InnoDB
-- Dos transacciones bloquean las mismas filas en orden contrario.
-- =====================================================================
-- [A] START TRANSACTION; UPDATE prospecto SET telefono = telefono WHERE prospecto_id = 1;
-- [B] START TRANSACTION; UPDATE prospecto SET telefono = telefono WHERE prospecto_id = 2;
-- [A] UPDATE prospecto SET telefono = telefono WHERE prospecto_id = 2;    -- espera a B
-- [B] UPDATE prospecto SET telefono = telefono WHERE prospecto_id = 1;    -- DEADLOCK
-- RESULTADO: B recibe ERROR 1213 (40001) "Deadlock found ... try restarting transaction"
--   y MySQL deshace B. A continua y puede hacer COMMIT.
-- Prevencion: bloquear siempre en el mismo orden (por ejemplo, por id ascendente).
-- Ultimo deadlock registrado:
-- SHOW ENGINE INNODB STATUS\G   (seccion LATEST DETECTED DEADLOCK)

-- =====================================================================
-- ESCENARIO 5. Niveles de aislamiento: lectura no repetible
-- =====================================================================
-- [A] SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED; START TRANSACTION;
-- [A] SELECT estado FROM propuesta WHERE propuesta_id = 33;               -- Enviada
-- [B] UPDATE propuesta SET estado = 'Rechazada' WHERE propuesta_id = 33;  -- autocommit
-- [A] SELECT estado FROM propuesta WHERE propuesta_id = 33;               -- Rechazada (cambio visible)
-- [A] ROLLBACK;
-- Repetir con REPEATABLE READ (valor por defecto de InnoDB): A sigue viendo 'Enviada'
-- hasta terminar su transaccion. Restaurar luego el dato:
--   UPDATE propuesta ... no es posible (TR-03). Usar otra propuesta en estado Enviada para esta prueba.
-- SELECT @@transaction_isolation;

-- =====================================================================
-- ESCENARIO 6. Tiempo de espera de bloqueo (lock wait timeout)
-- =====================================================================
-- SELECT @@innodb_lock_wait_timeout;                    -- 50 segundos por defecto
-- [A] START TRANSACTION; SELECT * FROM prospecto WHERE prospecto_id = 3 FOR UPDATE;
-- [B] SET SESSION innodb_lock_wait_timeout = 5;
-- [B] UPDATE prospecto SET telefono = telefono WHERE prospecto_id = 3;
-- RESULTADO: tras 5 s, ERROR 1205 "Lock wait timeout exceeded; try restarting transaction".
-- [A] ROLLBACK;
-- El backend traduce 1205/1213 como error recuperable: el usuario puede reintentar.

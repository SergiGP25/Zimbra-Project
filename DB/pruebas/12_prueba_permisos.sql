-- =====================================================================
-- Prueba de roles y permisos en la BD (Sesion 4)
-- Conectarse con cada usuario (contrasenas de 10_roles_permisos.sql):
--   docker exec -it zimbra_mysql mysql -ucrm_vendedor -pVend#2026 crm_zimbra
-- Cada linea indica el resultado esperado.
-- =====================================================================

-- ---- Como crm_vendedor ----------------------------------------------
SELECT CURRENT_ROLE();                                    -- `rol_vendedor`@`%`
SELECT * FROM v_ventas_detalle LIMIT 3;                   -- OK
SELECT empleado_id, nombre, rol FROM empleado LIMIT 3;    -- OK (columnas permitidas)
SELECT password_hash FROM empleado LIMIT 1;               -- ERROR 1143: SELECT command denied (columna)
SELECT * FROM empleado LIMIT 1;                           -- ERROR 1142/1143: incluye password_hash
SELECT * FROM historial_estado LIMIT 1;                   -- ERROR 1142: sin permiso
DELETE FROM venta WHERE venta_id = 1;                     -- ERROR 1142: DELETE denied
UPDATE producto SET precio_unitario = 1 WHERE producto_id = 10;  -- ERROR 1142: UPDATE denied
DROP TABLE alerta;                                        -- ERROR 1142: DROP denied
CALL sp_reporte_campanas('2026-01-01', '2026-12-31');     -- ERROR 1370: EXECUTE denied (es de gerencia)

-- ---- Como crm_marketing ---------------------------------------------
-- SELECT * FROM v_rendimiento_campana;                   -- OK
-- CALL sp_reporte_campanas('2026-01-01', '2026-12-31');  -- OK
-- SELECT * FROM v_ventas_detalle;                        -- ERROR 1142: no ve ventas individuales
-- CALL sp_registrar_venta(1, 'Efectivo', NULL, @v);      -- ERROR 1370

-- ---- Como crm_auditor -----------------------------------------------
-- SELECT * FROM historial_estado LIMIT 5;                -- OK
-- UPDATE prospecto SET estado = 'Nuevo' WHERE prospecto_id = 1;  -- ERROR 1142

-- ---- Como root: revisar los permisos concedidos ---------------------
-- SHOW GRANTS FOR 'crm_vendedor'@'%' USING rol_vendedor;
-- SELECT * FROM information_schema.role_table_grants WHERE grantee LIKE '%rol_%';
-- SELECT * FROM mysql.role_edges;

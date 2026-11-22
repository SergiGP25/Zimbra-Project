-- =====================================================================
-- RNF-03: rendimiento con 10 000 prospectos (listados < 3 segundos)
-- NO se ejecuta solo (esta en DB/pruebas). Ejecutar manualmente:
--   docker exec -i zimbra_mysql mysql -uroot crm_zimbra < DB/pruebas/09_carga_10000_prospectos.sql
-- Inserta 10 000 prospectos sinteticos (correo loadtest_N@carga.test) y
-- mide las consultas del listado. Al final esta la instruccion de limpieza.
-- =====================================================================
SET SESSION cte_max_recursion_depth = 20000;

INSERT INTO prospecto (nombre, empresa, email, telefono, estado, puntaje_calificacion,
                       fecha_registro, empleado_id, campana_id)
WITH RECURSIVE n (i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 10000)
SELECT CONCAT('Carga ', i),
       CONCAT('Empresa ', i MOD 500),
       CONCAT('loadtest_', i, '@carga.test'),
       CONCAT('+57 300 ', LPAD(i, 7, '0')),
       ELT(1 + i MOD 4, 'Nuevo', 'En prueba', 'Calificado', 'Descartado'),
       (i MOD 10) * 10,
       DATE_SUB(CURRENT_DATE, INTERVAL i MOD 300 DAY),
       6 + (i MOD 23),          -- vendedores 6 a 28 (activos)
       1 + (i MOD 30)
FROM n;

SELECT COUNT(*) AS total_prospectos FROM prospecto;

-- Consultas equivalentes al listado paginado (20 por pagina)
SET @t = NOW(6);
SELECT prospecto_id, nombre, estado, puntaje_calificacion FROM prospecto
 ORDER BY puntaje_calificacion DESC, prospecto_id LIMIT 20 OFFSET 0;
SELECT ROUND(TIMESTAMPDIFF(MICROSECOND, @t, NOW(6)) / 1000, 1) AS ms_listado_por_puntaje;

SET @t = NOW(6);
SELECT prospecto_id, nombre FROM prospecto
 WHERE nombre LIKE '%Carga 99%' OR email LIKE '%loadtest_99%' LIMIT 20;
SELECT ROUND(TIMESTAMPDIFF(MICROSECOND, @t, NOW(6)) / 1000, 1) AS ms_busqueda;

SET @t = NOW(6);
CALL sp_reporte_embudo(NULL);
SELECT ROUND(TIMESTAMPDIFF(MICROSECOND, @t, NOW(6)) / 1000, 1) AS ms_reporte_embudo;

-- Criterio RNF-03: cada ms_* debe ser menor a 3000.

-- LIMPIEZA (quitar los comentarios para borrar los datos de carga):
-- DELETE FROM prospecto WHERE email LIKE 'loadtest\_%@carga.test';

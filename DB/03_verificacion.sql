-- =====================================================================
-- Script   : 03_verificacion.sql  (comprobaciones despues de cargar datos)
-- Uso      : ejecutar despues de 01 y 02. No modifica datos.
-- =====================================================================
USE crm_zimbra;

-- 1. Cantidad de registros por tabla (todas deben ser 30 o mas)
SELECT 'empleado' AS tabla, COUNT(*) AS registros FROM empleado
UNION ALL SELECT 'campana', COUNT(*) FROM campana
UNION ALL SELECT 'producto', COUNT(*) FROM producto
UNION ALL SELECT 'prospecto', COUNT(*) FROM prospecto
UNION ALL SELECT 'visita_web', COUNT(*) FROM visita_web
UNION ALL SELECT 'descarga_prueba', COUNT(*) FROM descarga_prueba
UNION ALL SELECT 'interaccion', COUNT(*) FROM interaccion
UNION ALL SELECT 'alerta', COUNT(*) FROM alerta
UNION ALL SELECT 'propuesta', COUNT(*) FROM propuesta
UNION ALL SELECT 'venta', COUNT(*) FROM venta;

-- 2. Prospectos por estado (embudo)
SELECT estado, COUNT(*) AS total FROM prospecto GROUP BY estado ORDER BY total DESC;

-- 3. Ventas aceptadas: toda venta debe venir de una propuesta Aceptada (debe dar 0)
SELECT COUNT(*) AS ventas_sin_propuesta_aceptada
FROM venta v JOIN propuesta p ON p.propuesta_id = v.propuesta_id
WHERE p.estado <> 'Aceptada';

-- 4. Clientes sin venta (debe dar 0)
SELECT COUNT(*) AS clientes_sin_venta
FROM prospecto pr
WHERE pr.estado = 'Cliente'
  AND NOT EXISTS (SELECT 1 FROM propuesta p JOIN venta v ON v.propuesta_id = p.propuesta_id
                  WHERE p.prospecto_id = pr.prospecto_id);

-- 5. Propuestas solo con productos Comercial (debe dar 0)
SELECT COUNT(*) AS propuestas_con_producto_gratuito
FROM propuesta p JOIN producto pr ON pr.producto_id = p.producto_id
WHERE pr.version <> 'Comercial';

-- 6. Pruebas solo con productos Gratuita (debe dar 0)
SELECT COUNT(*) AS pruebas_con_producto_comercial
FROM descarga_prueba d JOIN producto pr ON pr.producto_id = d.producto_id
WHERE pr.version <> 'Gratuita';

-- 7. valor_total = licencias x precio (debe dar 0)
SELECT COUNT(*) AS valores_incorrectos
FROM propuesta p JOIN producto pr ON pr.producto_id = p.producto_id
WHERE p.valor_total <> p.num_licencias * pr.precio_unitario;

-- 8. Ventas por vendedor (reporte de ejemplo, RF-41)
SELECT e.empleado_id, e.nombre, COUNT(v.venta_id) AS ventas, SUM(v.monto_final) AS monto_total
FROM venta v
JOIN propuesta p ON p.propuesta_id = v.propuesta_id
JOIN empleado e ON e.empleado_id = p.empleado_id
GROUP BY e.empleado_id, e.nombre
ORDER BY monto_total DESC
LIMIT 10;

-- 9. Bandeja de alertas pendientes de un vendedor (ejemplo, RF-27)
SELECT a.alerta_id, pr.nombre AS prospecto, a.motivo, a.fecha_hora
FROM alerta a JOIN prospecto pr ON pr.prospecto_id = a.prospecto_id
WHERE a.atendida = FALSE
ORDER BY a.fecha_hora DESC
LIMIT 10;

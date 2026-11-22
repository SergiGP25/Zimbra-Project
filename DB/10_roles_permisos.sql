-- =====================================================================
-- Script   : 10_roles_permisos.sql  (Sesion 4: roles y permisos en la BD)
-- Requisito: 01 a 09 ejecutados.
-- Principio de minimo privilegio: cada rol recibe solo lo que necesita.
-- La seguridad del backend (JWT y roles de la API) sigue funcionando; esto
-- agrega una segunda barrera DENTRO de MySQL, por si alguien se conecta
-- directo a la base.
--
--  Rol            Usuario        Puede
--  -------------- -------------- ----------------------------------------
--  rol_admin      crm_admin      Todo sobre crm_zimbra (sin GRANT a otros)
--  rol_app        crm_app        Lo que usa la API: SELECT/INSERT/UPDATE
--                                y EXECUTE. Sin DELETE ni DDL.
--  rol_marketing  crm_marketing  Leer vistas y catalogos; campanas,
--                                prospectos, visitas y reportes
--  rol_vendedor   crm_vendedor   Leer vistas; ejecutar T1, T3, T4 y
--                                actualizar propuestas. Nunca ve
--                                empleado.password_hash
--  rol_auditor    crm_auditor    Solo SELECT (incluye historial_estado)
--
-- Las contrasenas son DE DEMOSTRACION. En un entorno real se cambian.
-- =====================================================================
SET NAMES utf8mb4;
USE crm_zimbra;

CREATE ROLE IF NOT EXISTS rol_admin, rol_app, rol_marketing, rol_vendedor, rol_auditor;

-- ---- rol_admin ------------------------------------------------------
GRANT ALL PRIVILEGES ON crm_zimbra.* TO rol_admin;

-- ---- rol_app (la API) -----------------------------------------------
GRANT SELECT, INSERT, UPDATE, EXECUTE ON crm_zimbra.* TO rol_app;

-- ---- rol_auditor (solo lectura) -------------------------------------
GRANT SELECT ON crm_zimbra.campana          TO rol_auditor;
GRANT SELECT ON crm_zimbra.producto         TO rol_auditor;
GRANT SELECT ON crm_zimbra.prospecto        TO rol_auditor;
GRANT SELECT ON crm_zimbra.visita_web       TO rol_auditor;
GRANT SELECT ON crm_zimbra.descarga_prueba  TO rol_auditor;
GRANT SELECT ON crm_zimbra.interaccion      TO rol_auditor;
GRANT SELECT ON crm_zimbra.alerta           TO rol_auditor;
GRANT SELECT ON crm_zimbra.propuesta        TO rol_auditor;
GRANT SELECT ON crm_zimbra.venta            TO rol_auditor;
GRANT SELECT ON crm_zimbra.historial_estado TO rol_auditor;
GRANT SELECT (empleado_id, nombre, email, rol, activo, fecha_creacion) ON crm_zimbra.empleado TO rol_auditor;

-- ---- rol_marketing --------------------------------------------------
GRANT SELECT ON crm_zimbra.v_prospecto_resumen   TO rol_marketing;
GRANT SELECT ON crm_zimbra.v_embudo              TO rol_marketing;
GRANT SELECT ON crm_zimbra.v_ventas_por_mes      TO rol_marketing;
GRANT SELECT ON crm_zimbra.v_rendimiento_campana TO rol_marketing;
GRANT SELECT ON crm_zimbra.v_pruebas_activas     TO rol_marketing;
GRANT SELECT ON crm_zimbra.producto              TO rol_marketing;
GRANT SELECT, INSERT, UPDATE ON crm_zimbra.campana  TO rol_marketing;
GRANT SELECT, INSERT, UPDATE ON crm_zimbra.prospecto TO rol_marketing;
GRANT SELECT, INSERT ON crm_zimbra.visita_web      TO rol_marketing;
GRANT SELECT ON crm_zimbra.descarga_prueba         TO rol_marketing;
GRANT SELECT (empleado_id, nombre, rol, activo) ON crm_zimbra.empleado TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_registrar_descarga      TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_registrar_visita        TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_sumar_puntos            TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_reasignar_prospecto     TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_reporte_conversion      TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_reporte_campanas        TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_reporte_embudo          TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_reporte_tasa_cierre     TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_reporte_resumen_anual   TO rol_marketing;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_reporte_ventas_mensual  TO rol_marketing;

-- ---- rol_vendedor ---------------------------------------------------
GRANT SELECT ON crm_zimbra.v_prospecto_resumen  TO rol_vendedor;
GRANT SELECT ON crm_zimbra.v_ventas_detalle     TO rol_vendedor;
GRANT SELECT ON crm_zimbra.v_alertas_pendientes TO rol_vendedor;
GRANT SELECT ON crm_zimbra.v_pruebas_activas    TO rol_vendedor;
GRANT SELECT ON crm_zimbra.producto             TO rol_vendedor;
GRANT SELECT ON crm_zimbra.prospecto            TO rol_vendedor;
GRANT SELECT, INSERT ON crm_zimbra.propuesta    TO rol_vendedor;
GRANT SELECT ON crm_zimbra.interaccion          TO rol_vendedor;
GRANT SELECT ON crm_zimbra.venta                TO rol_vendedor;
GRANT UPDATE (atendida) ON crm_zimbra.alerta    TO rol_vendedor;
GRANT SELECT ON crm_zimbra.alerta               TO rol_vendedor;
-- columnas del empleado SIN password_hash
GRANT SELECT (empleado_id, nombre, rol, activo) ON crm_zimbra.empleado TO rol_vendedor;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_registrar_descarga    TO rol_vendedor;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_registrar_interaccion TO rol_vendedor;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_registrar_venta       TO rol_vendedor;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_actualizar_propuesta  TO rol_vendedor;
GRANT EXECUTE ON PROCEDURE crm_zimbra.sp_sumar_puntos          TO rol_vendedor;

-- ---- Usuarios de demostracion y su rol por defecto ------------------
CREATE USER IF NOT EXISTS 'crm_admin'@'%'     IDENTIFIED BY 'Admin#2026';
CREATE USER IF NOT EXISTS 'crm_app'@'%'       IDENTIFIED BY 'App#2026';
CREATE USER IF NOT EXISTS 'crm_marketing'@'%' IDENTIFIED BY 'Mkt#2026';
CREATE USER IF NOT EXISTS 'crm_vendedor'@'%'  IDENTIFIED BY 'Vend#2026';
CREATE USER IF NOT EXISTS 'crm_auditor'@'%'   IDENTIFIED BY 'Aud#2026';

GRANT rol_admin     TO 'crm_admin'@'%';
GRANT rol_app       TO 'crm_app'@'%';
GRANT rol_marketing TO 'crm_marketing'@'%';
GRANT rol_vendedor  TO 'crm_vendedor'@'%';
GRANT rol_auditor   TO 'crm_auditor'@'%';

SET DEFAULT ROLE rol_admin     TO 'crm_admin'@'%';
SET DEFAULT ROLE rol_app       TO 'crm_app'@'%';
SET DEFAULT ROLE rol_marketing TO 'crm_marketing'@'%';
SET DEFAULT ROLE rol_vendedor  TO 'crm_vendedor'@'%';
SET DEFAULT ROLE rol_auditor   TO 'crm_auditor'@'%';

FLUSH PRIVILEGES;

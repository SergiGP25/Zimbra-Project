-- =====================================================================
-- Script   : 13_usuarios_equipo.sql
-- Requisito: 01 ejecutado (tabla empleado).
--
-- Usuarios del equipo para la presentacion, ademas de los 30 empleados
-- de ejemplo de 02_insertar_datos.sql (clave Zimbra2026*).
--
--   Correo                 Clave      Rol
--   admin@zimbra.com       Admin123   Admin
--   marketing@zimbra.com   Mark123    Marketing
--   ventas@zimbra.com      Vent123    Vendedor
--   andres@zimbra.com      admin123   Admin
--   sergio@zimbra.com      admin123   Admin
--   juan@zimbra.com        admin123   Admin
--
-- Las claves NO se guardan en texto plano (RNF-05): cada una va como hash
-- bcrypt, el mismo formato que genera el backend (app/core/security.py).
-- El correo se guarda en minusculas; al iniciar sesion el backend tambien
-- lo pasa a minusculas, asi que Admin@zimbra.com funciona igual.
--
-- Ojo: son claves cortas y faciles, pensadas para la demo en local. En un
-- despliegue publico se deben cambiar desde "Cambiar contrasena".
--
-- Se puede ejecutar varias veces: si el correo ya existe, actualiza la
-- clave, el rol y lo deja activo (ON DUPLICATE KEY UPDATE).
-- =====================================================================
SET NAMES utf8mb4;
USE crm_zimbra;

INSERT INTO empleado (nombre, email, password_hash, rol, activo) VALUES
    ('Administrador Zimbra', 'admin@zimbra.com',     '$2b$10$xH9iIJmGmlcCEP6BXepWQecjHIFpL2brnZP8kTjHHJeQUDI.W6TIu', 'Admin',     TRUE),
    ('Marketing Zimbra',     'marketing@zimbra.com', '$2b$10$h.JujVMx9HdsHGK8BGyxyuqbFeC1ULEtbW1MQRXNCWIFN7cEA4aAK', 'Marketing', TRUE),
    ('Ventas Zimbra',        'ventas@zimbra.com',    '$2b$10$wsP.miMKEmRACwyABDGJUuTAgIlex6G7Rw4pH0oBEEZ3ErIgzGYaq', 'Vendedor',  TRUE),
    ('Andrés',               'andres@zimbra.com',    '$2b$10$YOIGrjnFTiRWdJ.w8b5l1esdSi49LSoxnedRFR6lVyLxLAfwhaW4m', 'Admin',     TRUE),
    ('Sergio',               'sergio@zimbra.com',    '$2b$10$Qti/L325i5sX58sSdJHAgeKB.ikGUQeGXXhDG5mgNotGuhKxt0XQK', 'Admin',     TRUE),
    ('Juan',                 'juan@zimbra.com',      '$2b$10$zw3yRD0ie5MckLBK/sbtROVMzriW4Rp0g.dZcOIVaDewv.6vI2tGm', 'Admin',     TRUE)
AS nuevo
ON DUPLICATE KEY UPDATE
    password_hash = nuevo.password_hash,
    rol           = nuevo.rol,
    activo        = TRUE;

SELECT empleado_id, nombre, email, rol, activo
  FROM empleado
 WHERE email LIKE '%@zimbra.com'
 ORDER BY empleado_id;

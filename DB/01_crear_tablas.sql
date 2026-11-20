-- =====================================================================
-- Proyecto : Sistema transaccional de prospectos, marketing y ventas
--            (Caso Zimbra) - Sistemas Transaccionales, UNIMINUTO
-- Script   : 01_crear_tablas.sql  (modelo físico, Sesión 2)
-- Motor    : MySQL 8.0.16 o superior (CHECK y columnas generadas)
-- Base     : crm_zimbra
-- Orden    : 01 tablas -> 02 datos -> 03 verificación -> 04 usuario admin
--            -> 05 triggers -> 06 transacciones y savepoints -> 07 reportes
-- =====================================================================

-- Lee este archivo como UTF-8 (sin esto, las tildes y la ñ se guardan dañadas)
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS crm_zimbra;
CREATE DATABASE crm_zimbra
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
USE crm_zimbra;

-- ---------------------------------------------------------------------
-- 1. EMPLEADO: usuarios del sistema y su rol (HU-01, HU-03, RN-13)
-- ---------------------------------------------------------------------
CREATE TABLE empleado (
    empleado_id     INT          NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100) NOT NULL,
    email           VARCHAR(120) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    rol             VARCHAR(20)  NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_empleado       PRIMARY KEY (empleado_id),
    CONSTRAINT uq_empleado_email UNIQUE (email),
    CONSTRAINT ck_empleado_rol   CHECK (rol IN ('Admin', 'Marketing', 'Vendedor'))
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 2. CAMPANA: campañas de marketing que originan prospectos (RN-11)
-- ---------------------------------------------------------------------
CREATE TABLE campana (
    campana_id      INT           NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)  NOT NULL,
    canal           VARCHAR(20)   NOT NULL,
    fecha_inicio    DATE          NOT NULL,
    fecha_fin       DATE          NULL,
    presupuesto     DECIMAL(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT pk_campana             PRIMARY KEY (campana_id),
    CONSTRAINT ck_campana_canal       CHECK (canal IN ('Email', 'Web', 'Referido')),
    CONSTRAINT ck_campana_presupuesto CHECK (presupuesto >= 0),
    CONSTRAINT ck_campana_fechas      CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 3. PRODUCTO: catálogo de versiones Gratuita y Comercial
-- ---------------------------------------------------------------------
CREATE TABLE producto (
    producto_id      INT           NOT NULL AUTO_INCREMENT,
    nombre           VARCHAR(100)  NOT NULL,
    version          VARCHAR(20)   NOT NULL,
    precio_unitario  DECIMAL(12,2) NOT NULL DEFAULT 0,
    activo           BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_producto         PRIMARY KEY (producto_id),
    CONSTRAINT ck_producto_version CHECK (version IN ('Gratuita', 'Comercial')),
    CONSTRAINT ck_producto_precio  CHECK (precio_unitario >= 0)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 4. PROSPECTO: persona o empresa interesada en comprar
-- ---------------------------------------------------------------------
CREATE TABLE prospecto (
    prospecto_id         INT          NOT NULL AUTO_INCREMENT,
    nombre               VARCHAR(100) NOT NULL,
    empresa              VARCHAR(120) NULL,
    email                VARCHAR(120) NOT NULL,
    telefono             VARCHAR(20)  NULL,
    estado               VARCHAR(20)  NOT NULL DEFAULT 'Nuevo',
    puntaje_calificacion INT          NOT NULL DEFAULT 0,
    fecha_registro       DATE         NOT NULL DEFAULT (CURRENT_DATE),
    empleado_id          INT          NULL,      -- vendedor asignado (puede no tener)
    fecha_asignacion     DATETIME     NULL,      -- la actualiza T5
    campana_id           INT          NOT NULL,
    CONSTRAINT pk_prospecto          PRIMARY KEY (prospecto_id),
    CONSTRAINT uq_prospecto_email    UNIQUE (email),
    CONSTRAINT ck_prospecto_estado   CHECK (estado IN ('Nuevo', 'En prueba', 'Calificado', 'Cliente', 'Descartado')),
    CONSTRAINT ck_prospecto_puntaje  CHECK (puntaje_calificacion >= 0),
    CONSTRAINT fk_prospecto_campana  FOREIGN KEY (campana_id)
        REFERENCES campana (campana_id) ON DELETE RESTRICT,
    CONSTRAINT fk_prospecto_empleado FOREIGN KEY (empleado_id)
        REFERENCES empleado (empleado_id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 5. VISITA_WEB: visitas del prospecto al sitio (simulador del rastreo)
-- ---------------------------------------------------------------------
CREATE TABLE visita_web (
    visita_id         INT          NOT NULL AUTO_INCREMENT,
    prospecto_id      INT          NOT NULL,
    fecha_hora        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pagina_visitada   VARCHAR(200) NOT NULL,
    duracion_segundos INT          NOT NULL DEFAULT 0,
    CONSTRAINT pk_visita_web       PRIMARY KEY (visita_id),
    CONSTRAINT ck_visita_duracion  CHECK (duracion_segundos >= 0),
    CONSTRAINT fk_visita_prospecto FOREIGN KEY (prospecto_id)
        REFERENCES prospecto (prospecto_id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 6. DESCARGA_PRUEBA: prueba gratuita de 60 días (RN-02, RN-03)
--    fecha_fin   -> columna GENERADA: siempre fecha_inicio + 60 días;
--                   nadie puede escribirla a mano.
--    activa_flag -> columna GENERADA: 1 si la prueba está Activa, NULL
--                   si no. El UNIQUE (prospecto, producto, activa_flag)
--                   impide dos pruebas Activas del mismo producto y
--                   admite varias Vencidas o Convertidas (UNIQUE acepta
--                   varios NULL).
--    Los días restantes NO se guardan: cambian cada día y se calculan
--    al consultar con DATEDIFF(fecha_fin, CURRENT_DATE).
-- ---------------------------------------------------------------------
CREATE TABLE descarga_prueba (
    descarga_id   INT         NOT NULL AUTO_INCREMENT,
    prospecto_id  INT         NOT NULL,
    producto_id   INT         NOT NULL,
    fecha_inicio  DATE        NOT NULL DEFAULT (CURRENT_DATE),
    fecha_fin     DATE        GENERATED ALWAYS AS (fecha_inicio + INTERVAL 60 DAY) STORED,
    estado        VARCHAR(20) NOT NULL DEFAULT 'Activa',
    activa_flag   TINYINT     GENERATED ALWAYS AS (IF(estado = 'Activa', 1, NULL)) STORED,
    CONSTRAINT pk_descarga_prueba PRIMARY KEY (descarga_id),
    CONSTRAINT ck_prueba_estado   CHECK (estado IN ('Activa', 'Vencida', 'Convertida')),
    CONSTRAINT uq_prueba_activa   UNIQUE (prospecto_id, producto_id, activa_flag),
    CONSTRAINT fk_prueba_prospecto FOREIGN KEY (prospecto_id)
        REFERENCES prospecto (prospecto_id) ON DELETE RESTRICT,
    CONSTRAINT fk_prueba_producto  FOREIGN KEY (producto_id)
        REFERENCES producto (producto_id) ON DELETE RESTRICT
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 7. INTERACCION: llamadas y correos del vendedor (T3)
-- ---------------------------------------------------------------------
CREATE TABLE interaccion (
    interaccion_id INT          NOT NULL AUTO_INCREMENT,
    prospecto_id   INT          NOT NULL,
    empleado_id    INT          NOT NULL,
    campana_id     INT          NULL,
    tipo           VARCHAR(20)  NOT NULL,
    fecha_hora     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resultado      VARCHAR(20)  NOT NULL,
    notas          TEXT         NULL,
    CONSTRAINT pk_interaccion           PRIMARY KEY (interaccion_id),
    CONSTRAINT ck_interaccion_tipo      CHECK (tipo IN ('Llamada', 'Correo')),
    CONSTRAINT ck_interaccion_resultado CHECK (resultado IN ('Positivo', 'Neutro', 'Negativo', 'Sin respuesta')),
    CONSTRAINT fk_interaccion_prospecto FOREIGN KEY (prospecto_id)
        REFERENCES prospecto (prospecto_id) ON DELETE RESTRICT,
    CONSTRAINT fk_interaccion_empleado  FOREIGN KEY (empleado_id)
        REFERENCES empleado (empleado_id) ON DELETE RESTRICT,
    CONSTRAINT fk_interaccion_campana   FOREIGN KEY (campana_id)
        REFERENCES campana (campana_id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 8. ALERTA: avisos al vendedor (RN-06, RF-25 a RF-28)
-- ---------------------------------------------------------------------
CREATE TABLE alerta (
    alerta_id     INT          NOT NULL AUTO_INCREMENT,
    prospecto_id  INT          NOT NULL,
    empleado_id   INT          NOT NULL,
    fecha_hora    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo        VARCHAR(30)  NOT NULL,
    atendida      BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_alerta           PRIMARY KEY (alerta_id),
    CONSTRAINT ck_alerta_motivo    CHECK (motivo IN ('Visita al sitio', 'Prueba por vencer')),
    CONSTRAINT fk_alerta_prospecto FOREIGN KEY (prospecto_id)
        REFERENCES prospecto (prospecto_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alerta_empleado  FOREIGN KEY (empleado_id)
        REFERENCES empleado (empleado_id) ON DELETE RESTRICT
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 9. PROPUESTA: oferta comercial (RN-07, RN-08)
-- ---------------------------------------------------------------------
CREATE TABLE propuesta (
    propuesta_id   INT           NOT NULL AUTO_INCREMENT,
    prospecto_id   INT           NOT NULL,
    empleado_id    INT           NOT NULL,
    producto_id    INT           NOT NULL,
    num_licencias  INT           NOT NULL,
    valor_total    DECIMAL(14,2) NOT NULL DEFAULT 0,   -- lo calcula el trigger
    fecha_emision  DATE          NOT NULL DEFAULT (CURRENT_DATE),
    estado         VARCHAR(20)   NOT NULL DEFAULT 'Enviada',
    CONSTRAINT pk_propuesta           PRIMARY KEY (propuesta_id),
    CONSTRAINT ck_propuesta_licencias CHECK (num_licencias > 0),
    CONSTRAINT ck_propuesta_valor     CHECK (valor_total >= 0),
    CONSTRAINT ck_propuesta_estado    CHECK (estado IN ('Enviada', 'Aceptada', 'Rechazada')),
    CONSTRAINT fk_propuesta_prospecto FOREIGN KEY (prospecto_id)
        REFERENCES prospecto (prospecto_id) ON DELETE RESTRICT,
    CONSTRAINT fk_propuesta_empleado  FOREIGN KEY (empleado_id)
        REFERENCES empleado (empleado_id) ON DELETE RESTRICT,
    CONSTRAINT fk_propuesta_producto  FOREIGN KEY (producto_id)
        REFERENCES producto (producto_id) ON DELETE RESTRICT
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 10. VENTA: cierre de una propuesta Aceptada (RN-09, T4)
--     UNIQUE (propuesta_id): una propuesta tiene como máximo una venta.
-- ---------------------------------------------------------------------
CREATE TABLE venta (
    venta_id      INT           NOT NULL AUTO_INCREMENT,
    propuesta_id  INT           NOT NULL,
    fecha_venta   DATE          NOT NULL DEFAULT (CURRENT_DATE),
    monto_final   DECIMAL(14,2) NOT NULL,
    forma_pago    VARCHAR(20)   NOT NULL,
    estado        VARCHAR(20)   NOT NULL DEFAULT 'Pendiente',
    fecha_pago    DATE          NULL,                   -- la llena el trigger
    CONSTRAINT pk_venta           PRIMARY KEY (venta_id),
    CONSTRAINT uq_venta_propuesta UNIQUE (propuesta_id),
    CONSTRAINT ck_venta_monto     CHECK (monto_final >= 0),
    CONSTRAINT ck_venta_pago      CHECK (forma_pago IN ('Tarjeta', 'Transferencia', 'Factura', 'Efectivo')),
    CONSTRAINT ck_venta_estado    CHECK (estado IN ('Pendiente', 'Pagada')),
    CONSTRAINT fk_venta_propuesta FOREIGN KEY (propuesta_id)
        REFERENCES propuesta (propuesta_id) ON DELETE RESTRICT
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 11. HISTORIAL_ESTADO: bitácora técnica de cambios de estado (RNF-17).
--     No es una entidad del negocio: la llenan los triggers del script 05.
-- ---------------------------------------------------------------------
CREATE TABLE historial_estado (
    historial_id    INT          NOT NULL AUTO_INCREMENT,
    entidad         VARCHAR(20)  NOT NULL,
    registro_id     INT          NOT NULL,
    estado_anterior VARCHAR(20)  NULL,
    estado_nuevo    VARCHAR(20)  NOT NULL,
    fecha_cambio    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_bd      VARCHAR(100) NOT NULL,
    CONSTRAINT pk_historial_estado PRIMARY KEY (historial_id),
    CONSTRAINT ck_historial_entidad CHECK (entidad IN ('Prospecto', 'Propuesta', 'Venta'))
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Índices de apoyo a consultas frecuentes y reportes (RNF-03)
-- ---------------------------------------------------------------------
CREATE INDEX ix_prospecto_estado  ON prospecto (estado);
CREATE INDEX ix_prospecto_puntaje ON prospecto (puntaje_calificacion DESC);
CREATE INDEX ix_visita_fecha      ON visita_web (prospecto_id, fecha_hora DESC);
CREATE INDEX ix_prueba_fin        ON descarga_prueba (estado, fecha_fin);
CREATE INDEX ix_alerta_bandeja    ON alerta (empleado_id, atendida, fecha_hora DESC);
CREATE INDEX ix_propuesta_estado  ON propuesta (estado);
CREATE INDEX ix_venta_fecha       ON venta (fecha_venta);
CREATE INDEX ix_historial_reg     ON historial_estado (entidad, registro_id);

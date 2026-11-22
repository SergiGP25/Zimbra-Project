from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


class PublicoRepository:
    """
    SQL que usa el formulario público de prueba gratis.
    Igual que los demás repositorios: solo consultas, sin reglas de negocio
    y SIN commit. El servicio decide cuándo confirmar.
    Todas las consultas usan parámetros con nombre (:email), así el valor
    viaja separado del SQL y no hay inyección SQL posible.
    """

    def listar_productos_gratuitos(self, db: Session) -> List[Dict[str, Any]]:
        sql = text("""
            SELECT producto_id, nombre, version
              FROM producto
             WHERE version = 'Gratuita' AND activo = TRUE
             ORDER BY nombre
        """)
        return [dict(r) for r in db.execute(sql).mappings().all()]

    def listar_planes(self, db: Session) -> List[Dict[str, Any]]:
        """Productos comerciales activos con su precio por licencia."""
        sql = text("""
            SELECT producto_id, nombre, precio_unitario
              FROM producto
             WHERE version = 'Comercial' AND activo = TRUE
             ORDER BY precio_unitario, nombre
        """)
        return [dict(r) for r in db.execute(sql).mappings().all()]

    def obtener_producto(self, db: Session, producto_id: int) -> Optional[Dict[str, Any]]:
        sql = text("""
            SELECT producto_id, nombre, version, activo
              FROM producto
             WHERE producto_id = :id
        """)
        fila = db.execute(sql, {"id": producto_id}).mappings().first()
        return dict(fila) if fila else None

    def buscar_prospecto_por_email(self, db: Session, email: str) -> Optional[Dict[str, Any]]:
        sql = text("""
            SELECT prospecto_id, estado
              FROM prospecto
             WHERE LOWER(email) = :email
        """)
        fila = db.execute(sql, {"email": email}).mappings().first()
        return dict(fila) if fila else None

    def campana_web_vigente(self, db: Session) -> Optional[int]:
        """
        Campaña a la que se asocian los registros del sitio (RF-13).
        Prefiere una campaña Web vigente; si no hay, la Web más reciente.
        """
        sql = text("""
            SELECT campana_id
              FROM campana
             WHERE canal = 'Web'
             ORDER BY (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE) DESC,
                      fecha_inicio DESC
             LIMIT 1
        """)
        return db.execute(sql).scalar()

    def crear_prospecto(
        self,
        db: Session,
        nombre: str,
        empresa: Optional[str],
        email: str,
        telefono: Optional[str],
        campana_id: int,
    ) -> int:
        # Sin vendedor: Marketing lo asigna después (T5)
        sql = text("""
            INSERT INTO prospecto
                (nombre, empresa, email, telefono, estado, puntaje_calificacion,
                 fecha_registro, campana_id)
            VALUES
                (:nombre, :empresa, :email, :telefono, 'Nuevo', 0,
                 CURRENT_DATE, :campana_id)
        """)
        resultado = db.execute(sql, {
            "nombre": nombre,
            "empresa": empresa,
            "email": email,
            "telefono": telefono,
            "campana_id": campana_id,
        })
        return resultado.lastrowid

    def registrar_descarga(self, db: Session, prospecto_id: int, producto_id: int) -> int:
        """
        Llama la transacción T1 de la base (06_transacciones.sql).
        El procedimiento hace su propio START TRANSACTION, COMMIT o ROLLBACK.
        @descarga es una variable de la conexión de MySQL: CALL y SELECT
        deben ir en la misma transacción para usar la misma conexión.
        """
        db.execute(
            text("CALL sp_registrar_descarga(:prospecto, :producto, @descarga)"),
            {"prospecto": prospecto_id, "producto": producto_id},
        )
        return db.execute(text("SELECT @descarga")).scalar()

    def obtener_descarga(self, db: Session, descarga_id: int) -> Optional[Dict[str, Any]]:
        sql = text("""
            SELECT descarga_id, fecha_inicio, fecha_fin
              FROM descarga_prueba
             WHERE descarga_id = :id
        """)
        fila = db.execute(sql, {"id": descarga_id}).mappings().first()
        return dict(fila) if fila else None


publico_repository = PublicoRepository()

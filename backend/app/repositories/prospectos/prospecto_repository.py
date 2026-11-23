from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import text
from sqlalchemy.orm import Session

_EDITABLES = {"nombre", "empresa", "email", "telefono", "campana_id"}

# Orden permitido: el usuario elige una clave, nunca escribe SQL
_ORDENES = {
    "puntaje": "p.puntaje_calificacion DESC, p.prospecto_id",
    "fecha": "p.fecha_registro DESC, p.prospecto_id DESC",
    "nombre": "p.nombre ASC",
    "empresa": "p.empresa ASC, p.nombre ASC",
}

_COLUMNAS = """
    p.prospecto_id, p.nombre, p.empresa, p.email, p.telefono, p.estado,
    p.puntaje_calificacion AS puntaje, p.fecha_registro, p.campana_id,
    c.nombre AS campana_nombre, p.empleado_id, e.nombre AS vendedor_nombre, p.fecha_asignacion
"""
_FROM = """
      FROM prospecto p
      JOIN campana c       ON c.campana_id = p.campana_id
      LEFT JOIN empleado e ON e.empleado_id = p.empleado_id
"""


def _filas(db: Session, sql: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [dict(f) for f in db.execute(text(sql), params).mappings().all()]


class ProspectoRepository:
    """Solo SQL. No hace commit: el servicio decide cuándo confirmar."""

    def listar(self, db: Session, filtros: Dict[str, Any], orden: str, limite: int, desplazamiento: int) -> Tuple[List[Dict[str, Any]], int]:
        condiciones = ["1 = 1"]
        params: Dict[str, Any] = {}
        if filtros.get("q"):
            condiciones.append("(p.nombre LIKE :q OR p.empresa LIKE :q OR p.email LIKE :q)")
            params["q"] = f"%{filtros['q']}%"
        if filtros.get("estado"):
            condiciones.append("p.estado = :estado")
            params["estado"] = filtros["estado"]
        if filtros.get("campana_id"):
            condiciones.append("p.campana_id = :campana_id")
            params["campana_id"] = filtros["campana_id"]
        if filtros.get("vendedor_id"):
            condiciones.append("p.empleado_id = :vendedor_id")
            params["vendedor_id"] = filtros["vendedor_id"]
        if filtros.get("sin_vendedor"):
            condiciones.append("p.empleado_id IS NULL")
        where = " WHERE " + " AND ".join(condiciones)

        total = db.execute(text("SELECT COUNT(*) " + _FROM + where), params).scalar() or 0
        sql = f"SELECT {_COLUMNAS} {_FROM} {where} ORDER BY {_ORDENES.get(orden, _ORDENES['fecha'])} LIMIT :lim OFFSET :off"
        return _filas(db, sql, {**params, "lim": limite, "off": desplazamiento}), total

    def opciones(self, db: Session, solo_vendedor: Optional[int]) -> List[Dict[str, Any]]:
        sql = """SELECT prospecto_id, nombre, empresa, estado, empleado_id FROM prospecto
                 WHERE (:v IS NULL OR empleado_id = :v) ORDER BY nombre"""
        return _filas(db, sql, {"v": solo_vendedor})

    def obtener(self, db: Session, prospecto_id: int, bloquear: bool = False) -> Optional[Dict[str, Any]]:
        # FOR UPDATE bloquea la fila hasta el commit: dos usuarios no la cambian a la vez
        sql = f"SELECT {_COLUMNAS} {_FROM} WHERE p.prospecto_id = :id" + (" FOR UPDATE" if bloquear else "")
        fila = db.execute(text(sql), {"id": prospecto_id}).mappings().first()
        return dict(fila) if fila else None

    def email_en_uso(self, db: Session, email: str, excepto_id: Optional[int] = None) -> bool:
        sql = "SELECT COUNT(*) FROM prospecto WHERE LOWER(email) = :e AND (:id IS NULL OR prospecto_id <> :id)"
        return (db.execute(text(sql), {"e": email, "id": excepto_id}).scalar() or 0) > 0

    def campana_existe(self, db: Session, campana_id: int) -> bool:
        return db.execute(text("SELECT COUNT(*) FROM campana WHERE campana_id = :id"), {"id": campana_id}).scalar() > 0

    def vendedor_activo(self, db: Session, empleado_id: int) -> bool:
        sql = "SELECT COUNT(*) FROM empleado WHERE empleado_id = :id AND rol = 'Vendedor' AND activo = TRUE"
        return db.execute(text(sql), {"id": empleado_id}).scalar() > 0

    def crear(self, db: Session, d: Dict[str, Any]) -> int:
        res = db.execute(text("""
            INSERT INTO prospecto (nombre, empresa, email, telefono, estado, puntaje_calificacion,
                                   fecha_registro, empleado_id, fecha_asignacion, campana_id)
            VALUES (:nombre, :empresa, :email, :telefono, 'Nuevo', 0, CURRENT_DATE,
                    :empleado_id, IF(:empleado_id IS NULL, NULL, NOW()), :campana_id)
        """), d)
        return res.lastrowid

    def actualizar(self, db: Session, prospecto_id: int, cambios: Dict[str, Any]) -> None:
        cambios = {k: v for k, v in cambios.items() if k in _EDITABLES}
        if cambios:
            asignaciones = ", ".join(f"{c} = :{c}" for c in cambios)
            db.execute(text(f"UPDATE prospecto SET {asignaciones} WHERE prospecto_id = :id"), {**cambios, "id": prospecto_id})

    def cambiar_estado(self, db: Session, prospecto_id: int, estado: str) -> None:
        # El trigger TR-05 registra el cambio en historial_estado
        db.execute(text("UPDATE prospecto SET estado = :e WHERE prospecto_id = :id"), {"e": estado, "id": prospecto_id})

    def catalogos(self, db: Session) -> Dict[str, Any]:
        return {
            "campanas": _filas(db, "SELECT campana_id, nombre, canal FROM campana ORDER BY fecha_inicio DESC", {}),
            "vendedores": _filas(db, "SELECT empleado_id, nombre FROM empleado WHERE rol = 'Vendedor' AND activo = TRUE ORDER BY nombre", {}),
        }

    # ---------- Ficha (RF-10) ----------
    def historial(self, db: Session, prospecto_id: int) -> Dict[str, List[Dict[str, Any]]]:
        p = {"id": prospecto_id}
        return {
            "pruebas": _filas(db, """
                SELECT d.descarga_id, pr.nombre AS producto, d.fecha_inicio, d.fecha_fin, d.estado,
                       DATEDIFF(d.fecha_fin, CURRENT_DATE) AS dias_restantes
                  FROM descarga_prueba d JOIN producto pr ON pr.producto_id = d.producto_id
                 WHERE d.prospecto_id = :id ORDER BY d.fecha_inicio DESC""", p),
            "visitas": _filas(db, """
                SELECT visita_id, fecha_hora, pagina_visitada, duracion_segundos
                  FROM visita_web WHERE prospecto_id = :id ORDER BY fecha_hora DESC LIMIT 30""", p),
            "alertas": _filas(db, """
                SELECT a.alerta_id, a.fecha_hora, a.motivo, a.atendida, e.nombre AS vendedor
                  FROM alerta a JOIN empleado e ON e.empleado_id = a.empleado_id
                 WHERE a.prospecto_id = :id ORDER BY a.fecha_hora DESC""", p),
            "interacciones": _filas(db, """
                SELECT i.interaccion_id, i.fecha_hora, i.tipo, i.resultado, i.notas, e.nombre AS empleado
                  FROM interaccion i JOIN empleado e ON e.empleado_id = i.empleado_id
                 WHERE i.prospecto_id = :id ORDER BY i.fecha_hora DESC""", p),
            "propuestas": _filas(db, """
                SELECT pp.propuesta_id, pr.nombre AS producto, pp.num_licencias, pp.valor_total, pp.fecha_emision, pp.estado
                  FROM propuesta pp JOIN producto pr ON pr.producto_id = pp.producto_id
                 WHERE pp.prospecto_id = :id ORDER BY pp.fecha_emision DESC""", p),
            "ventas": _filas(db, """
                SELECT v.venta_id, v.propuesta_id, v.fecha_venta, v.monto_final, v.forma_pago, v.estado
                  FROM venta v JOIN propuesta pp ON pp.propuesta_id = v.propuesta_id
                 WHERE pp.prospecto_id = :id ORDER BY v.fecha_venta DESC""", p),
        }

    def desglose_puntaje(self, db: Session, prospecto_id: int) -> Dict[str, int]:
        """Puntaje calculado desde el historial con las reglas RN-04."""
        fila = db.execute(text("""
            SELECT
              (SELECT COUNT(*) * 20 FROM descarga_prueba WHERE prospecto_id = :id) AS pruebas,
              (SELECT COALESCE(SUM(IF(pagina_visitada LIKE '/precios%', 15, 5)), 0) FROM visita_web WHERE prospecto_id = :id) AS visitas,
              (SELECT COUNT(*) * 10 FROM interaccion WHERE prospecto_id = :id AND resultado = 'Positivo') AS interacciones
        """), {"id": prospecto_id}).mappings().first()
        d = {k: int(v or 0) for k, v in dict(fila).items()}
        d["total_calculado"] = sum(d.values())
        return d


prospecto_repository = ProspectoRepository()

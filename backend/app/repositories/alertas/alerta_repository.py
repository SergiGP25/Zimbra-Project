from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


class AlertaRepository:
    def listar(self, db: Session, empleado_id: Optional[int], solo_pendientes: bool) -> List[Dict[str, Any]]:
        sql = """
            SELECT a.alerta_id, a.prospecto_id, p.nombre AS prospecto, p.empresa, p.estado AS estado_prospecto,
                   p.puntaje_calificacion AS puntaje, a.empleado_id, e.nombre AS vendedor,
                   a.fecha_hora, a.motivo, a.atendida
              FROM alerta a
              JOIN prospecto p ON p.prospecto_id = a.prospecto_id
              JOIN empleado e ON e.empleado_id = a.empleado_id
             WHERE (:empleado IS NULL OR a.empleado_id = :empleado)
               AND (:pendientes = 0 OR a.atendida = FALSE)
             ORDER BY a.fecha_hora DESC, a.alerta_id DESC
        """
        params = {"empleado": empleado_id, "pendientes": int(solo_pendientes)}
        return [dict(f) for f in db.execute(text(sql), params).mappings().all()]

    def contar_pendientes(self, db: Session, empleado_id: Optional[int]) -> int:
        sql = "SELECT COUNT(*) FROM alerta WHERE atendida = FALSE AND (:e IS NULL OR empleado_id = :e)"
        return int(db.execute(text(sql), {"e": empleado_id}).scalar() or 0)

    def obtener(self, db: Session, alerta_id: int) -> Optional[Dict[str, Any]]:
        fila = db.execute(text("SELECT alerta_id, empleado_id, atendida FROM alerta WHERE alerta_id = :id"),
                          {"id": alerta_id}).mappings().first()
        return dict(fila) if fila else None

    def atender(self, db: Session, alerta_id: int) -> None:
        db.execute(text("UPDATE alerta SET atendida = TRUE WHERE alerta_id = :id"), {"id": alerta_id})


alerta_repository = AlertaRepository()

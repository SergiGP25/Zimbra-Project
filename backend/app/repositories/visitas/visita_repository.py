from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


class VisitaRepository:
    def listar(self, db: Session, prospecto_id: Optional[int], solo_vendedor: Optional[int], limite: int) -> List[Dict[str, Any]]:
        sql = """
            SELECT v.visita_id, v.prospecto_id, p.nombre AS prospecto, v.fecha_hora, v.pagina_visitada,
                   v.duracion_segundos, IF(v.pagina_visitada LIKE '/precios%', 15, 5) AS puntos
              FROM visita_web v JOIN prospecto p ON p.prospecto_id = v.prospecto_id
             WHERE (:prospecto IS NULL OR v.prospecto_id = :prospecto)
               AND (:vendedor IS NULL OR p.empleado_id = :vendedor)
             ORDER BY v.fecha_hora DESC
             LIMIT :limite
        """
        params = {"prospecto": prospecto_id, "vendedor": solo_vendedor, "limite": limite}
        return [dict(f) for f in db.execute(text(sql), params).mappings().all()]

    def estado_prospecto(self, db: Session, prospecto_id: int) -> Dict[str, Any]:
        fila = db.execute(text("SELECT estado, puntaje_calificacion AS puntaje FROM prospecto WHERE prospecto_id = :id"),
                          {"id": prospecto_id}).mappings().first()
        return dict(fila) if fila else {}


visita_repository = VisitaRepository()

from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


class InteraccionRepository:
    def listar(self, db: Session, prospecto_id: Optional[int], tipo: Optional[str],
               resultado: Optional[str], solo_vendedor: Optional[int]) -> List[Dict[str, Any]]:
        sql = """
            SELECT i.interaccion_id, i.prospecto_id, p.nombre AS prospecto, p.empresa, i.empleado_id,
                   e.nombre AS empleado, i.tipo, i.fecha_hora, i.resultado, i.notas, c.nombre AS campana
              FROM interaccion i
              JOIN prospecto p ON p.prospecto_id = i.prospecto_id
              JOIN empleado e  ON e.empleado_id = i.empleado_id
              LEFT JOIN campana c ON c.campana_id = i.campana_id
             WHERE (:prospecto IS NULL OR i.prospecto_id = :prospecto)
               AND (:tipo IS NULL OR i.tipo = :tipo)
               AND (:resultado IS NULL OR i.resultado = :resultado)
               AND (:vendedor IS NULL OR p.empleado_id = :vendedor)
             ORDER BY i.fecha_hora DESC, i.interaccion_id DESC
             LIMIT 300
        """
        params = {"prospecto": prospecto_id, "tipo": tipo, "resultado": resultado, "vendedor": solo_vendedor}
        return [dict(f) for f in db.execute(text(sql), params).mappings().all()]


interaccion_repository = InteraccionRepository()

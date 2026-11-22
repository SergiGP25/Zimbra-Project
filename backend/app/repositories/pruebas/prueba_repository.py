from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

# dias_restantes NO se guarda: cambia cada día, se calcula al consultar
_SELECT = """
    SELECT d.descarga_id, d.prospecto_id, p.nombre AS prospecto, p.empresa, d.producto_id,
           pr.nombre AS producto, d.fecha_inicio, d.fecha_fin, d.estado,
           DATEDIFF(d.fecha_fin, CURRENT_DATE) AS dias_restantes,
           p.empleado_id, e.nombre AS vendedor
      FROM descarga_prueba d
      JOIN prospecto p ON p.prospecto_id = d.prospecto_id
      JOIN producto pr ON pr.producto_id = d.producto_id
      LEFT JOIN empleado e ON e.empleado_id = p.empleado_id
"""


class PruebaRepository:
    def listar(self, db: Session, estado: Optional[str], prospecto_id: Optional[int],
               por_vencer: bool, solo_vendedor: Optional[int]) -> List[Dict[str, Any]]:
        sql = _SELECT + """
             WHERE (:estado IS NULL OR d.estado = :estado)
               AND (:prospecto IS NULL OR d.prospecto_id = :prospecto)
               AND (:vendedor IS NULL OR p.empleado_id = :vendedor)
               AND (:por_vencer = 0 OR (d.estado = 'Activa' AND DATEDIFF(d.fecha_fin, CURRENT_DATE) BETWEEN 0 AND 7))
             ORDER BY d.estado = 'Activa' DESC, d.fecha_fin
        """
        params = {"estado": estado, "prospecto": prospecto_id, "vendedor": solo_vendedor, "por_vencer": int(por_vencer)}
        return [dict(f) for f in db.execute(text(sql), params).mappings().all()]

    def obtener(self, db: Session, descarga_id: int) -> Optional[Dict[str, Any]]:
        fila = db.execute(text(_SELECT + " WHERE d.descarga_id = :id"), {"id": descarga_id}).mappings().first()
        return dict(fila) if fila else None


prueba_repository = PruebaRepository()

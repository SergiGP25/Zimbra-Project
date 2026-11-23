from datetime import date
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

_SELECT = """
    SELECT pp.propuesta_id, pp.prospecto_id, p.nombre AS prospecto, p.empresa, pp.empleado_id,
           e.nombre AS vendedor, pp.producto_id, pr.nombre AS producto, pr.precio_unitario,
           pp.num_licencias, pp.valor_total, pp.fecha_emision, pp.estado,
           v.venta_id
      FROM propuesta pp
      JOIN prospecto p ON p.prospecto_id = pp.prospecto_id
      JOIN empleado e  ON e.empleado_id = pp.empleado_id
      JOIN producto pr ON pr.producto_id = pp.producto_id
      LEFT JOIN venta v ON v.propuesta_id = pp.propuesta_id
"""


class PropuestaRepository:
    def listar(self, db: Session, estado: Optional[str], prospecto_id: Optional[int],
               vendedor_id: Optional[int], sin_venta: bool,
               desde: Optional[date] = None, hasta: Optional[date] = None) -> List[Dict[str, Any]]:
        sql = _SELECT + """
             WHERE (:estado IS NULL OR pp.estado = :estado)
               AND (:prospecto IS NULL OR pp.prospecto_id = :prospecto)
               AND (:vendedor IS NULL OR pp.empleado_id = :vendedor)
               AND (:sin_venta = 0 OR v.venta_id IS NULL)
               AND (:desde IS NULL OR pp.fecha_emision >= :desde)
               AND (:hasta IS NULL OR pp.fecha_emision <= :hasta)
             ORDER BY pp.fecha_emision DESC, pp.propuesta_id DESC
        """
        params = {"estado": estado, "prospecto": prospecto_id, "vendedor": vendedor_id, "sin_venta": int(sin_venta),
                  "desde": desde, "hasta": hasta}
        return [dict(f) for f in db.execute(text(sql), params).mappings().all()]

    def obtener(self, db: Session, propuesta_id: int) -> Optional[Dict[str, Any]]:
        fila = db.execute(text(_SELECT + " WHERE pp.propuesta_id = :id"), {"id": propuesta_id}).mappings().first()
        return dict(fila) if fila else None

    def crear(self, db: Session, prospecto_id: int, empleado_id: int, producto_id: int, licencias: int) -> int:
        # TR-02 valida que el producto sea Comercial y activo, calcula valor_total y fija estado Enviada
        res = db.execute(text("""
            INSERT INTO propuesta (prospecto_id, empleado_id, producto_id, num_licencias)
            VALUES (:p, :e, :pr, :n)
        """), {"p": prospecto_id, "e": empleado_id, "pr": producto_id, "n": licencias})
        return res.lastrowid


propuesta_repository = PropuestaRepository()

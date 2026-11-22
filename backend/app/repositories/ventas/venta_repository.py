from datetime import date
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

_SELECT = """
    SELECT v.venta_id, v.propuesta_id, pp.prospecto_id, p.nombre AS prospecto, p.empresa,
           pp.empleado_id, e.nombre AS vendedor, pr.nombre AS producto, pp.num_licencias,
           pp.valor_total, v.monto_final, v.fecha_venta, v.forma_pago, v.estado, v.fecha_pago
      FROM venta v
      JOIN propuesta pp ON pp.propuesta_id = v.propuesta_id
      JOIN prospecto p  ON p.prospecto_id = pp.prospecto_id
      JOIN empleado e   ON e.empleado_id = pp.empleado_id
      JOIN producto pr  ON pr.producto_id = pp.producto_id
"""


class VentaRepository:
    def listar(self, db: Session, desde: Optional[date], hasta: Optional[date],
               vendedor_id: Optional[int], estado: Optional[str]) -> List[Dict[str, Any]]:
        sql = _SELECT + """
             WHERE (:desde IS NULL OR v.fecha_venta >= :desde)
               AND (:hasta IS NULL OR v.fecha_venta <= :hasta)
               AND (:vendedor IS NULL OR pp.empleado_id = :vendedor)
               AND (:estado IS NULL OR v.estado = :estado)
             ORDER BY v.fecha_venta DESC, v.venta_id DESC
        """
        params = {"desde": desde, "hasta": hasta, "vendedor": vendedor_id, "estado": estado}
        return [dict(f) for f in db.execute(text(sql), params).mappings().all()]

    def obtener(self, db: Session, venta_id: int) -> Optional[Dict[str, Any]]:
        fila = db.execute(text(_SELECT + " WHERE v.venta_id = :id"), {"id": venta_id}).mappings().first()
        return dict(fila) if fila else None

    def responsable_propuesta(self, db: Session, propuesta_id: int) -> Optional[int]:
        return db.execute(text("SELECT empleado_id FROM propuesta WHERE propuesta_id = :id"), {"id": propuesta_id}).scalar()

    def marcar_pagada(self, db: Session, venta_id: int) -> None:
        # TR-07 guarda fecha_pago e impide volver a Pendiente; TR-08 lo registra en el historial
        db.execute(text("UPDATE venta SET estado = 'Pagada' WHERE venta_id = :id"), {"id": venta_id})


venta_repository = VentaRepository()

from datetime import date
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

_EDITABLES = {"nombre", "canal", "fecha_inicio", "fecha_fin", "presupuesto"}

# Cada métrica en una subconsulta para no multiplicar filas con los JOIN
_SELECT = """
    SELECT c.campana_id, c.nombre, c.canal, c.fecha_inicio, c.fecha_fin, c.presupuesto,
           (c.fecha_inicio <= CURRENT_DATE AND (c.fecha_fin IS NULL OR c.fecha_fin >= CURRENT_DATE)) AS vigente,
           (SELECT COUNT(*) FROM prospecto p WHERE p.campana_id = c.campana_id) AS prospectos,
           (SELECT COUNT(*) FROM descarga_prueba d JOIN prospecto p ON p.prospecto_id = d.prospecto_id
             WHERE p.campana_id = c.campana_id) AS pruebas,
           (SELECT COUNT(*) FROM venta v JOIN propuesta pp ON pp.propuesta_id = v.propuesta_id
              JOIN prospecto p ON p.prospecto_id = pp.prospecto_id WHERE p.campana_id = c.campana_id) AS ventas,
           (SELECT COALESCE(SUM(v.monto_final), 0) FROM venta v JOIN propuesta pp ON pp.propuesta_id = v.propuesta_id
              JOIN prospecto p ON p.prospecto_id = pp.prospecto_id WHERE p.campana_id = c.campana_id) AS monto_vendido
      FROM campana c
"""


class CampanaRepository:
    def listar(self, db: Session, canal: Optional[str], solo_vigentes: bool,
               desde: Optional[date] = None, hasta: Optional[date] = None) -> List[Dict[str, Any]]:
        # desde/hasta (HU-13): campañas que estuvieron activas en algún día del rango,
        # es decir, que empezaron antes de que el rango termine y terminaron después de que empezó
        sql = _SELECT + """
             WHERE (:canal IS NULL OR c.canal = :canal)
               AND (:vigentes = 0 OR (c.fecha_inicio <= CURRENT_DATE AND (c.fecha_fin IS NULL OR c.fecha_fin >= CURRENT_DATE)))
               AND (:hasta IS NULL OR c.fecha_inicio <= :hasta)
               AND (:desde IS NULL OR c.fecha_fin IS NULL OR c.fecha_fin >= :desde)
             ORDER BY c.fecha_inicio DESC, c.campana_id DESC
        """
        params = {"canal": canal, "vigentes": int(solo_vigentes), "desde": desde, "hasta": hasta}
        return [dict(f) for f in db.execute(text(sql), params).mappings().all()]

    def obtener(self, db: Session, campana_id: int) -> Optional[Dict[str, Any]]:
        fila = db.execute(text(_SELECT + " WHERE c.campana_id = :id"), {"id": campana_id}).mappings().first()
        return dict(fila) if fila else None

    def crear(self, db: Session, datos: Dict[str, Any]) -> int:
        res = db.execute(text("""
            INSERT INTO campana (nombre, canal, fecha_inicio, fecha_fin, presupuesto)
            VALUES (:nombre, :canal, :fecha_inicio, :fecha_fin, :presupuesto)
        """), datos)
        return res.lastrowid

    def actualizar(self, db: Session, campana_id: int, cambios: Dict[str, Any]) -> None:
        cambios = {k: v for k, v in cambios.items() if k in _EDITABLES}
        if cambios:
            asignaciones = ", ".join(f"{c} = :{c}" for c in cambios)
            db.execute(text(f"UPDATE campana SET {asignaciones} WHERE campana_id = :id"), {**cambios, "id": campana_id})


campana_repository = CampanaRepository()

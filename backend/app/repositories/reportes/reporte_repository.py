from typing import Any, Dict, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


class ReporteRepository:
    """Indicadores del panel (RF-46). Los demás reportes usan los procedimientos R-01 a R-06."""

    def indicadores(self, db: Session, vendedor: Optional[int]) -> Dict[str, Any]:
        p = {"v": vendedor}
        uno = lambda sql: db.execute(text(sql), p).scalar() or 0  # noqa: E731
        por_estado = db.execute(text("""
            SELECT estado, COUNT(*) AS n FROM prospecto
             WHERE (:v IS NULL OR empleado_id = :v) GROUP BY estado
        """), p).mappings().all()
        return {
            "prospectos_por_estado": {f["estado"]: f["n"] for f in por_estado},
            "alertas_pendientes": uno("SELECT COUNT(*) FROM alerta WHERE atendida = FALSE AND (:v IS NULL OR empleado_id = :v)"),
            "pruebas_por_vencer": uno("""
                SELECT COUNT(*) FROM descarga_prueba d JOIN prospecto p ON p.prospecto_id = d.prospecto_id
                 WHERE d.estado = 'Activa' AND DATEDIFF(d.fecha_fin, CURRENT_DATE) BETWEEN 0 AND 7
                   AND (:v IS NULL OR p.empleado_id = :v)"""),
            "propuestas_enviadas": uno("SELECT COUNT(*) FROM propuesta WHERE estado = 'Enviada' AND (:v IS NULL OR empleado_id = :v)"),
            "ventas_mes": uno("""
                SELECT COUNT(*) FROM venta v JOIN propuesta pp ON pp.propuesta_id = v.propuesta_id
                 WHERE v.fecha_venta >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') AND (:v IS NULL OR pp.empleado_id = :v)"""),
            "monto_mes": float(uno("""
                SELECT COALESCE(SUM(v.monto_final), 0) FROM venta v JOIN propuesta pp ON pp.propuesta_id = v.propuesta_id
                 WHERE v.fecha_venta >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') AND (:v IS NULL OR pp.empleado_id = :v)""")),
            "ventas_pendientes_pago": uno("""
                SELECT COUNT(*) FROM venta v JOIN propuesta pp ON pp.propuesta_id = v.propuesta_id
                 WHERE v.estado = 'Pendiente' AND (:v IS NULL OR pp.empleado_id = :v)"""),
        }


reporte_repository = ReporteRepository()

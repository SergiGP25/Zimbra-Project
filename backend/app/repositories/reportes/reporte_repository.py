from datetime import date
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
            **self.series_panel(db, vendedor),
        }

    def series_panel(self, db: Session, vendedor: Optional[int]) -> Dict[str, Any]:
        """
        Datos para las gráficas del panel: los últimos 12 meses (incluido el
        actual) y los productos más vendidos. Con :v el vendedor solo ve lo
        suyo (RN-12). Los meses sin movimiento se rellenan con 0 en Python
        para que la gráfica siempre tenga 12 puntos.
        """
        p = {"v": vendedor}
        hoy = date.today()
        meses = []
        anio, mes = hoy.year, hoy.month
        for _ in range(12):
            meses.append(f"{anio:04d}-{mes:02d}")
            mes -= 1
            if mes == 0:
                anio, mes = anio - 1, 12
        meses.reverse()
        desde = meses[0] + "-01"
        p_desde = {**p, "desde": desde}

        def por_mes(sql: str) -> Dict[str, Dict[str, Any]]:
            return {f["mes"]: dict(f) for f in db.execute(text(sql), p_desde).mappings().all()}

        ventas = por_mes("""
            SELECT DATE_FORMAT(v.fecha_venta, '%Y-%m') AS mes, COUNT(*) AS ventas, SUM(v.monto_final) AS monto
              FROM venta v JOIN propuesta pp ON pp.propuesta_id = v.propuesta_id
             WHERE v.fecha_venta >= :desde AND (:v IS NULL OR pp.empleado_id = :v)
             GROUP BY mes""")
        prospectos = por_mes("""
            SELECT DATE_FORMAT(fecha_registro, '%Y-%m') AS mes, COUNT(*) AS n
              FROM prospecto
             WHERE fecha_registro >= :desde AND (:v IS NULL OR empleado_id = :v)
             GROUP BY mes""")
        pruebas = por_mes("""
            SELECT DATE_FORMAT(d.fecha_inicio, '%Y-%m') AS mes, COUNT(*) AS n
              FROM descarga_prueba d JOIN prospecto p ON p.prospecto_id = d.prospecto_id
             WHERE d.fecha_inicio >= :desde AND (:v IS NULL OR p.empleado_id = :v)
             GROUP BY mes""")
        top = db.execute(text("""
            SELECT pr.producto_id, pr.nombre, COUNT(*) AS ventas,
                   SUM(pp.num_licencias) AS licencias, SUM(v.monto_final) AS monto
              FROM venta v
              JOIN propuesta pp ON pp.propuesta_id = v.propuesta_id
              JOIN producto  pr ON pr.producto_id  = pp.producto_id
             WHERE (:v IS NULL OR pp.empleado_id = :v)
             GROUP BY pr.producto_id, pr.nombre
             ORDER BY monto DESC
             LIMIT 5"""), p).mappings().all()

        return {
            "serie_meses": [{
                "mes": m,
                "ventas": int(ventas.get(m, {}).get("ventas") or 0),
                "monto": float(ventas.get(m, {}).get("monto") or 0),
                "prospectos": int(prospectos.get(m, {}).get("n") or 0),
                "pruebas": int(pruebas.get(m, {}).get("n") or 0),
            } for m in meses],
            "productos_top": [{**dict(f), "monto": float(f["monto"] or 0), "licencias": int(f["licencias"] or 0)} for f in top],
        }


reporte_repository = ReporteRepository()

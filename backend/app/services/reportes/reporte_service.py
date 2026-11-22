from datetime import date
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db_utils import es_vendedor, exigir_db, llamar_reporte
from app.repositories.reportes.reporte_repository import reporte_repository


def _rango(desde: Optional[date], hasta: Optional[date]):
    hoy = date.today()
    desde = desde or date(hoy.year, 1, 1)
    hasta = hasta or hoy
    if hasta < desde:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La fecha final es anterior a la inicial")
    return desde, hasta


# Vistas de 08_vistas.sql que se pueden consultar desde la API (lista blanca:
# el nombre nunca se concatena a partir de lo que escribe el usuario).
VISTAS = {
    "v_embudo": "Prospectos por estado",
    "v_ventas_por_mes": "Ventas por mes",
    "v_ranking_vendedores": "Ranking de vendedores",
    "v_rendimiento_campana": "Rendimiento por campaña",
    "v_ventas_detalle": "Detalle de ventas",
    "v_prospecto_resumen": "Resumen de prospectos",
    "v_pruebas_activas": "Pruebas activas",
    "v_alertas_pendientes": "Alertas pendientes",
}


class ReporteService:
    """Reportes (RF-40 a RF-46). Cada uno llama un procedimiento almacenado de 07_reportes.sql."""

    def ventas_mensual(self, db: Optional[Session], anio: int, mes: int) -> Dict[str, Any]:
        detalle, total = llamar_reporte(exigir_db(db), "sp_reporte_ventas_mensual", [anio, mes])
        return {"detalle": detalle, "total": total[0] if total else {}}

    def resumen_anual(self, db: Optional[Session], anio: int):
        return llamar_reporte(exigir_db(db), "sp_reporte_resumen_anual", [anio])[0]

    def conversion(self, db: Optional[Session], desde, hasta):
        desde, hasta = _rango(desde, hasta)
        return llamar_reporte(exigir_db(db), "sp_reporte_conversion", [desde, hasta])[0][0]

    def campanas(self, db: Optional[Session], desde, hasta):
        desde, hasta = _rango(desde, hasta)
        return llamar_reporte(exigir_db(db), "sp_reporte_campanas", [desde, hasta])[0]

    def embudo(self, db: Optional[Session], usuario: Dict[str, Any], vendedor_id: Optional[int]):
        if es_vendedor(usuario):
            vendedor_id = usuario["id"]        # el vendedor solo ve su embudo
        return llamar_reporte(exigir_db(db), "sp_reporte_embudo", [vendedor_id])[0]

    def tasa_cierre(self, db: Optional[Session], desde, hasta):
        desde, hasta = _rango(desde, hasta)
        return llamar_reporte(exigir_db(db), "sp_reporte_tasa_cierre", [desde, hasta])[0][0]

    def vistas(self) -> Dict[str, str]:
        return VISTAS

    def vista(self, db: Optional[Session], nombre: str, limite: int):
        if nombre not in VISTAS:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Vista no encontrada")
        filas = exigir_db(db).execute(text(f"SELECT * FROM {nombre} LIMIT :n"), {"n": limite}).mappings().all()
        # Decimal y fechas se convierten a tipos que FastAPI pueda serializar
        return [{k: (float(v) if hasattr(v, "as_tuple") else v) for k, v in f.items()} for f in filas]

    def panel(self, db: Optional[Session], usuario: Dict[str, Any]) -> Dict[str, Any]:
        vendedor = usuario["id"] if es_vendedor(usuario) else None
        return {"rol": usuario["rol"], **reporte_repository.indicadores(exigir_db(db), vendedor)}


reporte_service = ReporteService()

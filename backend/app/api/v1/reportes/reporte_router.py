from datetime import date
from typing import Dict, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.services.reportes.reporte_service import reporte_service

router = APIRouter()
gerencia = Depends(require_roles(["Admin", "Marketing"]))


@router.get("/panel", summary="Indicadores del panel según el rol (RF-46)")
def panel(usuario: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return reporte_service.panel(db, usuario)


@router.get("/ventas-mensual", summary="R-01: ventas del mes por vendedor (RF-41)")
def ventas_mensual(anio: int = Query(..., ge=2000, le=2100), mes: int = Query(..., ge=1, le=12),
                   _u=gerencia, db: Optional[Session] = Depends(get_db)):
    return reporte_service.ventas_mensual(db, anio, mes)


@router.get("/resumen-anual", summary="R-02: indicadores mes a mes")
def resumen_anual(anio: int = Query(..., ge=2000, le=2100), _u=gerencia, db: Optional[Session] = Depends(get_db)):
    return reporte_service.resumen_anual(db, anio)


@router.get("/conversion", summary="R-03: conversión de pruebas a ventas (RF-40)")
def conversion(desde: Optional[date] = None, hasta: Optional[date] = None, _u=gerencia, db: Optional[Session] = Depends(get_db)):
    return reporte_service.conversion(db, desde, hasta)


@router.get("/campanas", summary="R-04: rendimiento por campaña (RF-42)")
def campanas(desde: Optional[date] = None, hasta: Optional[date] = None, _u=gerencia, db: Optional[Session] = Depends(get_db)):
    return reporte_service.campanas(db, desde, hasta)


@router.get("/embudo", summary="R-05: prospectos por estado (RF-43)")
def embudo(vendedor_id: Optional[int] = None, usuario: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return reporte_service.embudo(db, usuario, vendedor_id)


@router.get("/tasa-cierre", summary="R-06: tasa de cierre frente a la meta del caso (RF-44)")
def tasa_cierre(desde: Optional[date] = None, hasta: Optional[date] = None, _u=gerencia, db: Optional[Session] = Depends(get_db)):
    return reporte_service.tasa_cierre(db, desde, hasta)


@router.get("/vistas", summary="Vistas SQL disponibles para reportes simplificados (Sesión 4)")
def vistas(_u=gerencia):
    return reporte_service.vistas()


@router.get("/vistas/{nombre}", summary="Consulta una vista de 08_vistas.sql")
def vista(nombre: str, limite: int = Query(200, ge=1, le=1000), _u=gerencia, db: Optional[Session] = Depends(get_db)):
    return reporte_service.vista(db, nombre, limite)

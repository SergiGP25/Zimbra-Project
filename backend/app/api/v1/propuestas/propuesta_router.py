from datetime import date
from typing import Dict, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.propuestas.propuesta_schema import CambioEstadoPropuesta, PropuestaCreate
from app.services.propuestas.propuesta_service import propuesta_service

router = APIRouter()
vendedores = Depends(require_roles(["Admin", "Vendedor"]))


@router.get("/", summary="Listar propuestas (RF-35)")
def listar(
    estado: Optional[str] = Query(None, pattern="^(Enviada|Aceptada|Rechazada)$"),
    prospecto_id: Optional[int] = None,
    vendedor_id: Optional[int] = None,
    sin_venta: bool = Query(False, description="Solo las que todavía no tienen venta"),
    desde: Optional[date] = Query(None, description="Emitidas desde esta fecha (HU-32)"),
    hasta: Optional[date] = Query(None, description="Emitidas hasta esta fecha"),
    usuario: Dict = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    return propuesta_service.listar(db, usuario, estado, prospecto_id, vendedor_id, sin_venta, desde, hasta)


@router.post("/", status_code=201, summary="Crear propuesta (RF-32, RF-33; el trigger calcula el valor)")
def crear(datos: PropuestaCreate, usuario: Dict = vendedores, db: Optional[Session] = Depends(get_db)):
    return propuesta_service.crear(datos, usuario, db)


@router.patch("/{propuesta_id}/estado", summary="Aceptar o rechazar (RF-34)")
def cambiar_estado(propuesta_id: int, datos: CambioEstadoPropuesta, usuario: Dict = vendedores,
                   db: Optional[Session] = Depends(get_db)):
    return propuesta_service.cambiar_estado(propuesta_id, datos.estado, usuario, db)

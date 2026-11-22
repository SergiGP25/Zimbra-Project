from datetime import date
from typing import Dict, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.ventas.venta_schema import VentaCreate
from app.services.ventas.venta_service import venta_service

router = APIRouter()


@router.get("/", summary="Consultar ventas por fecha, vendedor y estado de pago (RF-38)")
def listar(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    vendedor_id: Optional[int] = None,
    estado: Optional[str] = Query(None, pattern="^(Pendiente|Pagada)$"),
    usuario: Dict = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    return venta_service.listar(db, usuario, desde, hasta, vendedor_id, estado)


@router.post("/", status_code=201, summary="Registrar venta (RF-36, RF-37, transacción T4)")
def registrar(datos: VentaCreate, usuario: Dict = Depends(require_roles(["Admin", "Vendedor"])),
              db: Optional[Session] = Depends(get_db)):
    return venta_service.registrar(datos, usuario, db)


@router.patch("/{venta_id}/pagar", summary="Marcar venta como Pagada (RF-39)")
def pagar(venta_id: int, _u: Dict = Depends(require_roles(["Admin"])), db: Optional[Session] = Depends(get_db)):
    return venta_service.marcar_pagada(venta_id, db)

from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.ventas.venta_schema import (
    VentaCreate,
    VentaResponse,
    VentaListResponse,
    PropuestaAceptadaResponse,
)
from app.services.ventas.venta_service import venta_service

router = APIRouter()


def _database_error(exc: Exception) -> HTTPException:
    detail = str(getattr(exc, "orig", exc))
    if " - " in detail:
        detail = detail.rsplit(" - ", 1)[-1].strip()
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail or "Error de base de datos.")


@router.get("/propuestas-aceptadas", response_model=List[PropuestaAceptadaResponse])
def list_accepted_proposals(
    current_user: Dict[str, object] = Depends(require_roles(["Vendedor", "Admin"])),
    db: Optional[Session] = Depends(get_db),
):
    return venta_service.accepted_proposals(db=db)


@router.post(
    "/",
    response_model=VentaResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_venta(
    payload: VentaCreate,
    current_user: Dict[str, object] = Depends(require_roles(["Vendedor", "Admin"])),
    db: Optional[Session] = Depends(get_db),
):
    try:
        return venta_service.create(payload=payload, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except SQLAlchemyError as exc:
        raise _database_error(exc)


@router.get("/", response_model=VentaListResponse)
def list_ventas(
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    current_user: Dict[str, object] = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    return venta_service.list(
        user_id=int(current_user["id"]),
        user_role=str(current_user["rol"]),
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        db=db,
    )

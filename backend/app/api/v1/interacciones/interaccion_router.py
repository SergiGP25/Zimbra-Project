from typing import Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.interacciones.interaccion_schema import (
    InteraccionCreate,
    InteraccionResponse,
    InteraccionListResponse,
)
from app.services.interacciones.interaccion_service import interaccion_service

router = APIRouter()


def _database_error(exc: Exception) -> HTTPException:
    detail = str(getattr(exc, "orig", exc))
    if "(" in detail and ")" in detail:
        detail = detail.split(")", 1)[-1].strip()
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail or "Error de base de datos.")


@router.post(
    "/",
    response_model=InteraccionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_interaccion(
    payload: InteraccionCreate,
    current_user: Dict[str, object] = Depends(require_roles(["Vendedor"])),
    db: Optional[Session] = Depends(get_db),
):
    try:
        return interaccion_service.create(
            payload=payload,
            user_id=int(current_user["id"]),
            user_role=str(current_user["rol"]),
            db=db,
        )
    except (ValueError, PermissionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except SQLAlchemyError as exc:
        raise _database_error(exc)


@router.get("/", response_model=InteraccionListResponse)
def list_interacciones(
    prospecto_id: Optional[int] = Query(None),
    current_user: Dict[str, object] = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    return interaccion_service.list(
        user_id=int(current_user["id"]),
        user_role=str(current_user["rol"]),
        prospecto_id=prospecto_id,
        db=db,
    )

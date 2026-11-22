from typing import Dict, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.visitas.visita_schema import VisitaCreate
from app.services.visitas.visita_service import visita_service

router = APIRouter()


@router.get("/", summary="Historial de visitas (RF-23)")
def listar(prospecto_id: Optional[int] = None, limite: int = Query(50, ge=1, le=500),
           usuario: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return visita_service.listar(db, usuario, prospecto_id, limite)


@router.post("/", status_code=201, summary="Simular una visita web (RF-22, transacción T2)")
def registrar(datos: VisitaCreate, _u: Dict = Depends(require_roles(["Admin", "Marketing"])),
              db: Optional[Session] = Depends(get_db)):
    return visita_service.registrar(datos, db)

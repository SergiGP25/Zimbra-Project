from typing import Dict, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.services.alertas.alerta_service import alerta_service

router = APIRouter()


@router.get("/", summary="Bandeja de alertas (RF-27)")
def listar(solo_pendientes: bool = True, usuario: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return alerta_service.listar(db, usuario, solo_pendientes)


@router.get("/pendientes", summary="Cantidad de alertas sin atender (para el menú)")
def pendientes(usuario: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return alerta_service.pendientes(db, usuario)


@router.patch("/{alerta_id}/atender", summary="Marcar alerta como atendida (RF-28)")
def atender(alerta_id: int, usuario: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return alerta_service.atender(alerta_id, usuario, db)

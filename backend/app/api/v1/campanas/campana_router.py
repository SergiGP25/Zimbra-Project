from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.campanas.campana_schema import CampanaCreate, CampanaListResponse, CampanaResponse, CampanaUpdate
from app.services.campanas.campana_service import campana_service

router = APIRouter()
gestores = Depends(require_roles(["Admin", "Marketing"]))


@router.get("/", response_model=CampanaListResponse, summary="Listar campañas con sus resultados")
def listar_campanas(
    canal: Optional[str] = Query(None, pattern="^(Email|Web|Referido)$"),
    solo_vigentes: bool = False,
    desde: Optional[date] = Query(None, description="Campañas activas desde esta fecha (HU-13)"),
    hasta: Optional[date] = Query(None, description="Campañas activas hasta esta fecha"),
    _usuario=Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    return campana_service.listar(db, canal, solo_vigentes, desde, hasta)


@router.post("/", response_model=CampanaResponse, status_code=201, summary="Crear campaña (RF-12)")
def crear_campana(datos: CampanaCreate, _u=gestores, db: Optional[Session] = Depends(get_db)):
    return campana_service.crear(datos, db)


@router.put("/{campana_id}", response_model=CampanaResponse, summary="Editar campaña (RF-12)")
def editar_campana(campana_id: int, datos: CampanaUpdate, _u=gestores, db: Optional[Session] = Depends(get_db)):
    return campana_service.editar(campana_id, datos, db)

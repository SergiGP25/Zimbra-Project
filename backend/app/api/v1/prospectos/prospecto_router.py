from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.prospectos.prospecto_schema import (
    Asignacion, AsignacionResponse, CambioEstado, FichaResponse, ProspectoCreate,
    ProspectoListResponse, ProspectoOpcion, ProspectoResponse, ProspectoUpdate,
)
from app.services.prospectos.prospecto_service import prospecto_service

router = APIRouter()


@router.get("/", response_model=ProspectoListResponse, summary="Buscar, filtrar y paginar prospectos (RF-06)")
def listar_prospectos(
    q: Optional[str] = Query(None, max_length=100, description="Busca en nombre, empresa o correo"),
    estado: Optional[str] = None,
    campana_id: Optional[int] = None,
    vendedor_id: Optional[int] = None,
    sin_vendedor: bool = False,
    orden: str = Query("puntaje", pattern="^(puntaje|fecha|nombre|empresa)$"),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    usuario: Dict = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    filtros = {"q": q, "estado": estado, "campana_id": campana_id, "vendedor_id": vendedor_id, "sin_vendedor": sin_vendedor}
    return prospecto_service.listar(db, usuario, filtros, orden, pagina, por_pagina)


@router.get("/opciones", response_model=List[ProspectoOpcion], summary="Lista corta para selectores")
def opciones(usuario: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return prospecto_service.opciones(db, usuario)


@router.get("/catalogos", summary="Campañas, vendedores activos y estados para los formularios")
def catalogos(_u: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return prospecto_service.catalogos(db)


@router.post("/", response_model=ProspectoResponse, status_code=201, summary="Registrar prospecto (RF-05)")
def registrar(datos: ProspectoCreate, usuario: Dict = Depends(require_roles(["Admin", "Marketing", "Vendedor"])),
              db: Optional[Session] = Depends(get_db)):
    return prospecto_service.registrar(datos, usuario, db)


@router.get("/{prospecto_id}", response_model=ProspectoResponse, summary="Obtener un prospecto")
def obtener(prospecto_id: int, usuario: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return prospecto_service.obtener(db, usuario, prospecto_id)


@router.get("/{prospecto_id}/ficha", response_model=FichaResponse, summary="Ficha con todo el historial (RF-10)")
def ficha(prospecto_id: int, usuario: Dict = Depends(get_current_user), db: Optional[Session] = Depends(get_db)):
    return prospecto_service.ficha(prospecto_id, usuario, db)


@router.put("/{prospecto_id}", response_model=ProspectoResponse, summary="Editar datos (RF-07)")
def editar(prospecto_id: int, datos: ProspectoUpdate, usuario: Dict = Depends(get_current_user),
           db: Optional[Session] = Depends(get_db)):
    return prospecto_service.editar(prospecto_id, datos, usuario, db)


@router.patch("/{prospecto_id}/estado", response_model=ProspectoResponse, summary="Cambiar estado (RF-08, RN-10)")
def cambiar_estado(prospecto_id: int, datos: CambioEstado, usuario: Dict = Depends(get_current_user),
                   db: Optional[Session] = Depends(get_db)):
    return prospecto_service.cambiar_estado(prospecto_id, datos.estado, usuario, db)


@router.patch("/{prospecto_id}/asignar", response_model=AsignacionResponse, summary="Asignar vendedor (RF-09, T5)")
def asignar(prospecto_id: int, datos: Asignacion, _u: Dict = Depends(require_roles(["Admin", "Marketing"])),
            db: Optional[Session] = Depends(get_db)):
    return prospecto_service.asignar(prospecto_id, datos.empleado_id, db)

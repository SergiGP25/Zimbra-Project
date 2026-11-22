from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.productos.producto_schema import (
    ProductoCreate, ProductoListResponse, ProductoResponse, ProductoUpdate,
)
from app.services.productos.producto_service import producto_service

router = APIRouter()
solo_admin = Depends(require_roles(["Admin"]))


@router.get("/", response_model=ProductoListResponse, summary="Listar productos (RF-16)")
def listar_productos(
    version: Optional[str] = Query(None, pattern="^(Gratuita|Comercial)$"),
    activo: Optional[bool] = None,
    _usuario=Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    return producto_service.listar(db, version, activo)


@router.post("/", response_model=ProductoResponse, status_code=201, summary="Crear producto (RF-14)")
def crear_producto(datos: ProductoCreate, _admin=solo_admin, db: Optional[Session] = Depends(get_db)):
    return producto_service.crear(datos, db)


@router.put("/{producto_id}", response_model=ProductoResponse, summary="Editar producto (RF-15)")
def editar_producto(producto_id: int, datos: ProductoUpdate, _admin=solo_admin, db: Optional[Session] = Depends(get_db)):
    return producto_service.editar(producto_id, datos, db)


@router.patch("/{producto_id}/activo", response_model=ProductoResponse, summary="Activar o desactivar (RN-13)")
def cambiar_activo(producto_id: int, activo: bool, _admin=solo_admin, db: Optional[Session] = Depends(get_db)):
    return producto_service.cambiar_activo(producto_id, activo, db)

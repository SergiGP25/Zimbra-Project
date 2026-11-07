from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import require_roles
from app.core.database import get_db
from app.schemas.empleados.empleado_schema import (
    EmpleadoCreate,
    EmpleadoUpdate,
    EmpleadoResponse,
    EmpleadoListResponse,
)
from app.services.empleados.empleado_service import empleado_service

# Toda la gestión de empleados requiere rol Administrador (HU-03)
router = APIRouter(dependencies=[Depends(require_roles(["Admin"]))])


@router.get(
    "/",
    response_model=EmpleadoListResponse,
    summary="Listar empleados con filtros opcionales (HU-03)",
)
def list_empleados(
    rol: Optional[str] = Query(None, description="Filtrar por rol: Admin, Marketing, Vendedor"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    search: Optional[str] = Query(None, description="Buscar por nombre o correo"),
    db: Optional[Session] = Depends(get_db),
):
    return empleado_service.list_empleados(rol=rol, activo=activo, search=search, db=db)


@router.post(
    "/",
    response_model=EmpleadoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo empleado (HU-03)",
    description="Crea un empleado con contraseña hasheada y correo único. Solo Administradores.",
)
def create_empleado(payload: EmpleadoCreate, db: Optional[Session] = Depends(get_db)):
    return empleado_service.create_empleado(payload=payload, db=db)


@router.get(
    "/{empleado_id}",
    response_model=EmpleadoResponse,
    summary="Obtener detalle de un empleado por ID (HU-03)",
)
def get_empleado(empleado_id: int, db: Optional[Session] = Depends(get_db)):
    return empleado_service.get_empleado(empleado_id=empleado_id, db=db)


@router.put(
    "/{empleado_id}",
    response_model=EmpleadoResponse,
    summary="Editar datos de un empleado (HU-03)",
    description="Actualiza datos. Si se intenta desactivar o cambiar el rol del último Admin activo, se rechaza la operación.",
)
def update_empleado(
    empleado_id: int,
    payload: EmpleadoUpdate,
    db: Optional[Session] = Depends(get_db),
):
    return empleado_service.update_empleado(empleado_id=empleado_id, payload=payload, db=db)


@router.patch(
    "/{empleado_id}/desactivar",
    response_model=EmpleadoResponse,
    summary="Desactivar empleado - Soft Delete (HU-03)",
    description="Cambia el estado activo = FALSE sin borrar el registro. Impide desactivar al último Administrador.",
)
def deactivate_empleado(empleado_id: int, db: Optional[Session] = Depends(get_db)):
    return empleado_service.deactivate_empleado(empleado_id=empleado_id, db=db)


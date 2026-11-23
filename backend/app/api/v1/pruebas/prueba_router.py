from typing import Dict, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.pruebas.prueba_schema import PruebaCreate
from app.services.notificaciones import notificacion_service
from app.services.pruebas.prueba_service import prueba_service

router = APIRouter()


@router.get("/", summary="Listar pruebas con días restantes (RF-20)")
def listar(
    estado: Optional[str] = Query(None, pattern="^(Activa|Vencida|Convertida)$"),
    prospecto_id: Optional[int] = None,
    por_vencer: bool = Query(False, description="Solo activas a 7 días o menos de terminar"),
    usuario: Dict = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    return prueba_service.listar(db, usuario, estado, prospecto_id, por_vencer)


@router.post("/", status_code=201, summary="Registrar descarga de prueba (RF-17, transacción T1)")
def registrar(datos: PruebaCreate, tareas: BackgroundTasks,
              usuario: Dict = Depends(require_roles(["Admin", "Marketing", "Vendedor"])),
              db: Optional[Session] = Depends(get_db)):
    prueba = prueba_service.registrar(datos.prospecto_id, datos.producto_id, usuario, db)
    # El correo sale DESPUÉS de responder: si falla, la prueba ya quedó guardada
    if prueba and prueba.get("prospecto_email"):
        tareas.add_task(notificacion_service.prueba_activada, prueba["prospecto_email"], prueba["prospecto"],
                        prueba["producto"], prueba["fecha_inicio"], prueba["fecha_fin"])
    return prueba


@router.post("/vencer", summary="Vencer pruebas y avisar las que vencen pronto (RF-19, RF-26)")
def vencer(_u: Dict = Depends(require_roles(["Admin", "Marketing"])), db: Optional[Session] = Depends(get_db)):
    return prueba_service.vencer(db)

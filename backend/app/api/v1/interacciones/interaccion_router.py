from typing import Dict, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.interacciones.interaccion_schema import InteraccionCreate
from app.services.interacciones.interaccion_service import interaccion_service

router = APIRouter()


@router.get("/", summary="Historial de interacciones (RF-30)")
def listar(
    prospecto_id: Optional[int] = None,
    tipo: Optional[str] = Query(None, pattern="^(Llamada|Correo)$"),
    resultado: Optional[str] = Query(None, pattern="^(Positivo|Neutro|Negativo|Sin respuesta)$"),
    usuario: Dict = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    return interaccion_service.listar(db, usuario, prospecto_id, tipo, resultado)


@router.post("/", status_code=201, summary="Registrar llamada o correo (RF-29, transacción T3)")
def registrar(datos: InteraccionCreate, usuario: Dict = Depends(require_roles(["Admin", "Vendedor"])),
              db: Optional[Session] = Depends(get_db)):
    return interaccion_service.registrar(datos, usuario, db)

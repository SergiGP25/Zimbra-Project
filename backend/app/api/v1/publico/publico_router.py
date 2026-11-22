from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.publico.publico_schema import ProductoGratuito, PruebaRegistrada, SolicitudPrueba
from app.services.publico.publico_service import publico_service

# Rutas PÚBLICAS: no usan get_current_user, cualquier visitante las puede llamar.
# Por eso solo exponen lo mínimo: productos gratuitos y el registro de prueba.
router = APIRouter()


@router.get(
    "/productos-gratuitos",
    response_model=List[ProductoGratuito],
    summary="Productos que se pueden probar gratis 60 días",
)
def listar_productos_gratuitos(db: Optional[Session] = Depends(get_db)):
    return publico_service.listar_productos(db)


@router.get("/planes", summary="Productos comerciales y su precio por licencia")
def listar_planes(db: Optional[Session] = Depends(get_db)):
    return publico_service.listar_planes(db)


@router.post(
    "/prueba-gratis",
    response_model=PruebaRegistrada,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un visitante y su prueba gratis (T1)",
    description=(
        "Crea el prospecto (o reutiliza el existente por correo) y llama "
        "sp_registrar_descarga: prueba Activa de 60 días, estado En prueba y +20 puntos."
    ),
)
def registrar_prueba_gratis(datos: SolicitudPrueba, db: Optional[Session] = Depends(get_db)):
    return publico_service.registrar_prueba(datos, db)

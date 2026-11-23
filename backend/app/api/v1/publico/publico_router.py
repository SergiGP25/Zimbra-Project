from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.publico.publico_schema import (
    PortalPrueba,
    ProductoGratuito,
    PruebaRegistrada,
    SolicitudPrueba,
    VisitaPortal,
    VisitaPortalRegistrada,
)
from app.services.notificaciones import notificacion_service
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
def registrar_prueba_gratis(datos: SolicitudPrueba, tareas: BackgroundTasks, db: Optional[Session] = Depends(get_db)):
    resultado = publico_service.registrar_prueba(datos, db)
    # Correos en segundo plano: primero la bienvenida (solo si es un registro
    # nuevo) y luego los datos de la prueba activada.
    if resultado.prospecto_nuevo:
        tareas.add_task(notificacion_service.registro_recibido, datos.email, datos.nombre)
    tareas.add_task(notificacion_service.prueba_activada, datos.email, datos.nombre,
                    resultado.producto, resultado.fecha_inicio, resultado.fecha_fin, resultado.prospecto_id)
    return resultado


@router.get(
    "/mi-prueba",
    response_model=PortalPrueba,
    summary="Portal del visitante: estado de su prueba (enlace del correo)",
    description="Se entra con el enlace personal del correo, sin contraseña. Abrirlo cuenta como visita web (T2), una vez al día.",
)
def ver_mi_prueba(token: str, db: Optional[Session] = Depends(get_db)):
    return publico_service.ver_portal(token, db)


@router.post(
    "/mi-prueba/visita",
    response_model=VisitaPortalRegistrada,
    summary="El visitante abre precios, características o soporte: visita web (T2)",
)
def visitar_seccion(datos: VisitaPortal, db: Optional[Session] = Depends(get_db)):
    return publico_service.visitar_seccion(datos.token, datos.pagina, db)

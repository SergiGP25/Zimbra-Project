import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.repositories.prospectos.prospecto_repository import prospecto_repository, ProspectoRepository
from app.schemas.prospectos.prospecto_schema import (
    ProspectoResponse,
    ProspectoListResponse,
)

logger = logging.getLogger(__name__)


class ProspectoService:
    """
    Servicio de Prospectos con control de acceso por rol (HU-04, RN-12).
    - Vendedor: Solo ve sus prospectos asignados.
    - Marketing y Admin: Ven la totalidad de prospectos.
    """

    def __init__(self, prosp_repo: Optional[ProspectoRepository] = None):
        self.prosp_repo = prosp_repo or prospecto_repository

    def list_prospectos_for_user(
        self,
        user_rol: str,
        user_id: int,
        db: Optional[Session] = None,
    ) -> ProspectoListResponse:
        prospectos_raw = self.prosp_repo.list_prospectos(user_rol=user_rol, user_id=user_id, db=db)
        
        prospectos_dto = [
            ProspectoResponse(
                id=p["id"],
                nombre=p["nombre"],
                empresa=p.get("empresa"),
                email=p["email"],
                telefono=p.get("telefono"),
                estado=p["estado"],
                puntaje=p["puntaje"],
                id_campana=p["id_campana"],
                id_vendedor=p.get("id_vendedor"),
                vendedor_nombre=p.get("vendedor_nombre"),
                fecha_registro=p.get("fecha_registro"),
            )
            for p in prospectos_raw
        ]

        if user_rol.lower() == "vendedor":
            mensaje = f"Mostrando solo los {len(prospectos_dto)} prospectos asignados a tu usuario (RN-12)."
        else:
            mensaje = f"Acceso global ({user_rol}): Mostrando todos los {len(prospectos_dto)} prospectos de la compañía."

        return ProspectoListResponse(
            total=len(prospectos_dto),
            rol_consultante=user_rol,
            mensaje_filtro=mensaje,
            prospectos=prospectos_dto,
        )


prospecto_service = ProspectoService()


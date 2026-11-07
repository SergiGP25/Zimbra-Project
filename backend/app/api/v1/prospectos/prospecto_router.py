from typing import Dict, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.schemas.prospectos.prospecto_schema import ProspectoListResponse
from app.services.prospectos.prospecto_service import prospecto_service

router = APIRouter()


@router.get(
    "/",
    response_model=ProspectoListResponse,
    summary="Listar prospectos según rol del usuario (HU-04, RN-12)",
    description="Vendedor: solo ve sus prospectos asignados. Marketing y Admin: ven todos los prospectos.",
)
def list_prospectos(
    current_user: Dict[str, any] = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    return prospecto_service.list_prospectos_for_user(
        user_rol=current_user["rol"],
        user_id=current_user["id"],
        db=db,
    )


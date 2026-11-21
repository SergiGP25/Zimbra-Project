from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.interacciones.interaccion_repository import interaccion_repository
from app.schemas.interacciones.interaccion_schema import (
    InteraccionCreate,
    InteraccionResponse,
    InteraccionListResponse,
)


class InteraccionService:
    def create(
        self,
        payload: InteraccionCreate,
        user_id: int,
        user_role: str,
        db: Session,
    ) -> InteraccionResponse:
        if payload.tipo not in ("Llamada", "Correo"):
            raise ValueError("El tipo debe ser Llamada o Correo.")
        if payload.resultado not in ("Positivo", "Neutro", "Negativo", "Sin respuesta"):
            raise ValueError("Resultado de interacción inválido.")
        empleado_id = user_id
        if user_role.lower() != "vendedor":
            raise PermissionError("Solo un Vendedor puede registrar interacciones.")
        row = interaccion_repository.create(
            prospecto_id=payload.prospecto_id,
            empleado_id=empleado_id,
            tipo=payload.tipo,
            resultado=payload.resultado,
            notas=payload.notas,
            campana_id=payload.campana_id,
            db=db,
        )
        return InteraccionResponse(**row)

    def list(
        self,
        user_id: int,
        user_role: str,
        prospecto_id: Optional[int],
        db: Session,
    ) -> InteraccionListResponse:
        rows = interaccion_repository.list_for_user(
            prospecto_id=prospecto_id,
            user_id=user_id,
            user_role=user_role,
            db=db,
        )
        return InteraccionListResponse(
            total=len(rows),
            interacciones=[InteraccionResponse(**row) for row in rows],
        )


interaccion_service = InteraccionService()

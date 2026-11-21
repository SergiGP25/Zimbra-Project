from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.ventas.venta_repository import venta_repository
from app.schemas.ventas.venta_schema import (
    VentaCreate,
    VentaResponse,
    VentaListResponse,
    PropuestaAceptadaResponse,
)


class VentaService:
    def create(self, payload: VentaCreate, db: Session) -> VentaResponse:
        if payload.forma_pago not in ("Tarjeta", "Transferencia", "Factura", "Efectivo"):
            raise ValueError("Forma de pago inválida.")
        row = venta_repository.create(
            propuesta_id=payload.propuesta_id,
            forma_pago=payload.forma_pago,
            monto=payload.monto,
            db=db,
        )
        return VentaResponse(**row)

    def list(
        self,
        user_id: int,
        user_role: str,
        fecha_desde: Optional[str],
        fecha_hasta: Optional[str],
        db: Session,
    ) -> VentaListResponse:
        rows = venta_repository.list_for_user(
            user_id=user_id,
            user_role=user_role,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            db=db,
        )
        return VentaListResponse(
            total=len(rows),
            ventas=[VentaResponse(**row) for row in rows],
        )

    def accepted_proposals(self, db: Session) -> List[PropuestaAceptadaResponse]:
        rows = venta_repository.list_accepted_proposals(db)
        return [PropuestaAceptadaResponse(**row) for row in rows]


venta_service = VentaService()

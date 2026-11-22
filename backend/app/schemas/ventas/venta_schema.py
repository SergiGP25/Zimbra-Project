from typing import Literal, Optional
from pydantic import BaseModel, Field


class VentaCreate(BaseModel):
    propuesta_id: int = Field(..., gt=0)
    forma_pago: Literal["Tarjeta", "Transferencia", "Factura", "Efectivo"]
    monto_final: Optional[float] = Field(None, gt=0, description="Vacío = valor total de la propuesta")

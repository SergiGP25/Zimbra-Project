from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


class VentaCreate(BaseModel):
    propuesta_id: int = Field(gt=0)
    forma_pago: str
    monto: Optional[float] = Field(default=None, ge=0)


class VentaResponse(BaseModel):
    id: int
    propuesta_id: int
    prospecto_id: int
    prospecto_nombre: str
    vendedor_id: int
    vendedor_nombre: str
    fecha_venta: date
    monto_final: float
    forma_pago: str
    estado: str
    fecha_pago: Optional[date] = None


class VentaListResponse(BaseModel):
    total: int
    ventas: List[VentaResponse]


class PropuestaAceptadaResponse(BaseModel):
    id: int
    prospecto_id: int
    prospecto_nombre: str
    vendedor_id: int
    vendedor_nombre: str
    producto_id: int
    producto_nombre: str
    num_licencias: int
    valor_total: float

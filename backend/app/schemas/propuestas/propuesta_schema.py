from typing import Literal
from pydantic import BaseModel, Field


class PropuestaCreate(BaseModel):
    prospecto_id: int = Field(..., gt=0)
    producto_id: int = Field(..., gt=0)
    num_licencias: int = Field(..., gt=0, le=100000)
    # valor_total y estado NO se reciben: los fija el trigger TR-02


class CambioEstadoPropuesta(BaseModel):
    estado: Literal["Aceptada", "Rechazada"]

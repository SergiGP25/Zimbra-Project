from typing import Literal, Optional
from pydantic import BaseModel, Field


class InteraccionCreate(BaseModel):
    prospecto_id: int = Field(..., gt=0)
    tipo: Literal["Llamada", "Correo"]
    resultado: Literal["Positivo", "Neutro", "Negativo", "Sin respuesta"]
    notas: Optional[str] = Field(None, max_length=2000)
    campana_id: Optional[int] = Field(None, gt=0)

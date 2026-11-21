from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class InteraccionCreate(BaseModel):
    prospecto_id: int = Field(gt=0)
    tipo: str
    resultado: str
    notas: Optional[str] = None
    campana_id: Optional[int] = None


class InteraccionResponse(BaseModel):
    id: int
    prospecto_id: int
    prospecto_nombre: str
    empleado_id: int
    empleado_nombre: str
    campana_id: Optional[int] = None
    tipo: str
    fecha_hora: datetime
    resultado: str
    notas: Optional[str] = None


class InteraccionListResponse(BaseModel):
    total: int
    interacciones: List[InteraccionResponse]

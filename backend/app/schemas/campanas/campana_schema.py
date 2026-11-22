from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, model_validator

Canal = Literal["Email", "Web", "Referido"]


class CampanaCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    canal: Canal
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    presupuesto: float = Field(0, ge=0)

    @model_validator(mode="after")
    def fechas_validas(self):
        # RN-11: el fin no puede ser anterior al inicio
        if self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio")
        return self


class CampanaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=100)
    canal: Optional[Canal] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    presupuesto: Optional[float] = Field(None, ge=0)


class CampanaResponse(BaseModel):
    campana_id: int
    nombre: str
    canal: str
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    presupuesto: float
    vigente: bool
    # Resultados de la campaña (RF-42)
    prospectos: int = 0
    pruebas: int = 0
    ventas: int = 0
    monto_vendido: float = 0


class CampanaListResponse(BaseModel):
    total: int
    campanas: List[CampanaResponse]

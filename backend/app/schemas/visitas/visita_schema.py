from pydantic import BaseModel, Field


class VisitaCreate(BaseModel):
    """Datos del simulador de visitas web (RF-22)."""
    prospecto_id: int = Field(..., gt=0)
    pagina_visitada: str = Field(..., min_length=1, max_length=200, pattern=r"^/")
    duracion_segundos: int = Field(..., ge=0, le=86400)

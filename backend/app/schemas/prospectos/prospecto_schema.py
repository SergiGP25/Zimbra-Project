from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ProspectoResponse(BaseModel):
    id: int
    nombre: str
    empresa: Optional[str] = None
    email: str
    telefono: Optional[str] = None
    estado: str
    puntaje: int
    id_campana: int
    id_vendedor: Optional[int] = None
    vendedor_nombre: Optional[str] = None
    fecha_registro: Optional[datetime] = None


class ProspectoListResponse(BaseModel):
    total: int
    rol_consultante: str
    mensaje_filtro: str
    prospectos: List[ProspectoResponse]


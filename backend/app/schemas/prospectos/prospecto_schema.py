import re
from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator

Estado = Literal["Nuevo", "En prueba", "Calificado", "Cliente", "Descartado"]
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validar_email(valor: str) -> str:
    valor = valor.strip().lower()
    if not _EMAIL.match(valor):
        raise ValueError("Correo con formato inválido, por ejemplo nombre@empresa.com")
    return valor


class ProspectoCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    empresa: Optional[str] = Field(None, max_length=120)
    email: str = Field(..., max_length=120)
    telefono: Optional[str] = Field(None, max_length=20)
    campana_id: int = Field(..., gt=0)
    empleado_id: Optional[int] = Field(None, gt=0)  # vendedor; un Vendedor queda asignado a sí mismo

    @field_validator("email")
    @classmethod
    def validar(cls, v: str) -> str:
        return _validar_email(v)


class ProspectoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    empresa: Optional[str] = Field(None, max_length=120)
    email: Optional[str] = Field(None, max_length=120)
    telefono: Optional[str] = Field(None, max_length=20)
    campana_id: Optional[int] = Field(None, gt=0)

    @field_validator("email")
    @classmethod
    def validar(cls, v: Optional[str]) -> Optional[str]:
        return _validar_email(v) if v is not None else v


class CambioEstado(BaseModel):
    estado: Estado


class Asignacion(BaseModel):
    empleado_id: int = Field(..., gt=0)


class ProspectoResponse(BaseModel):
    prospecto_id: int
    nombre: str
    empresa: Optional[str] = None
    email: str
    telefono: Optional[str] = None
    estado: str
    puntaje: int
    fecha_registro: Optional[date] = None
    campana_id: int
    campana_nombre: Optional[str] = None
    empleado_id: Optional[int] = None
    vendedor_nombre: Optional[str] = None
    fecha_asignacion: Optional[datetime] = None
    transiciones_permitidas: List[str] = []


class ProspectoListResponse(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int
    prospectos: List[ProspectoResponse]


class ProspectoOpcion(BaseModel):
    """Versión corta para los selectores de otros formularios."""
    prospecto_id: int
    nombre: str
    empresa: Optional[str] = None
    estado: str
    empleado_id: Optional[int] = None


class AsignacionResponse(BaseModel):
    prospecto: ProspectoResponse
    alertas_movidas: int


class FichaResponse(BaseModel):
    """RF-10: todo el historial del prospecto en una sola respuesta."""
    prospecto: ProspectoResponse
    desglose_puntaje: Dict[str, int]
    pruebas: List[Dict[str, Any]]
    visitas: List[Dict[str, Any]]
    alertas: List[Dict[str, Any]]
    interacciones: List[Dict[str, Any]]
    propuestas: List[Dict[str, Any]]
    ventas: List[Dict[str, Any]]

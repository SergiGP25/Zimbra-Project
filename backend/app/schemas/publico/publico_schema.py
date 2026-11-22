import re
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, field_validator

_PATRON_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ProductoGratuito(BaseModel):
    """Producto que un visitante puede probar 60 días sin pagar."""

    producto_id: int
    nombre: str
    version: str


class SolicitudPrueba(BaseModel):
    """Datos del formulario público «Prueba gratis 60 días»."""

    nombre: str = Field(..., min_length=2, max_length=100)
    empresa: Optional[str] = Field(None, max_length=120)
    email: str = Field(..., max_length=120)
    telefono: Optional[str] = Field(None, max_length=20)
    producto_id: int = Field(..., gt=0)

    @field_validator("nombre")
    @classmethod
    def limpiar_nombre(cls, valor: str) -> str:
        valor = valor.strip()
        if len(valor) < 2:
            raise ValueError("Escribe tu nombre completo")
        return valor

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor: str) -> str:
        # Se guarda en minúsculas para que "Ana@x.com" y "ana@x.com" sean el mismo prospecto
        valor = valor.strip().lower()
        if not _PATRON_EMAIL.match(valor):
            raise ValueError("Escribe un correo válido, por ejemplo nombre@empresa.com")
        return valor

    @field_validator("empresa", "telefono")
    @classmethod
    def vacio_a_none(cls, valor: Optional[str]) -> Optional[str]:
        # Un campo opcional enviado como "" se guarda como NULL
        if valor is None:
            return None
        valor = valor.strip()
        return valor or None


class PruebaRegistrada(BaseModel):
    """Respuesta cuando la prueba quedó registrada."""

    prospecto_id: int
    descarga_id: int
    producto: str
    fecha_inicio: date
    fecha_fin: date
    mensaje: str

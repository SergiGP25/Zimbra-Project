from typing import List, Literal, Optional
from pydantic import BaseModel, Field, model_validator

Version = Literal["Gratuita", "Comercial"]


class ProductoCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    version: Version
    precio_unitario: float = Field(0, ge=0)

    @model_validator(mode="after")
    def precio_segun_version(self):
        # Una versión gratuita no tiene precio; una comercial sí
        if self.version == "Gratuita" and self.precio_unitario != 0:
            raise ValueError("Un producto de versión Gratuita debe tener precio 0")
        if self.version == "Comercial" and self.precio_unitario <= 0:
            raise ValueError("Un producto Comercial debe tener un precio mayor que 0")
        return self


class ProductoUpdate(BaseModel):
    # Todos opcionales: solo se cambia lo que se envía
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    precio_unitario: Optional[float] = Field(None, ge=0)


class ProductoResponse(BaseModel):
    producto_id: int
    nombre: str
    descripcion: Optional[str] = None
    version: str
    precio_unitario: float
    activo: bool
    pruebas: int = 0       # cuántas descargas de prueba tiene
    propuestas: int = 0    # en cuántas propuestas aparece


class ProductoListResponse(BaseModel):
    total: int
    productos: List[ProductoResponse]

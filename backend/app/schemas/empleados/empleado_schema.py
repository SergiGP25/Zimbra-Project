from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class RolEnum(str, Enum):
    ADMIN = "Admin"
    MARKETING = "Marketing"
    VENDEDOR = "Vendedor"


class EmpleadoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    rol: RolEnum
    activo: bool = True


class EmpleadoCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=50)
    rol: RolEnum
    activo: bool = True


class EmpleadoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = Field(None, min_length=5, max_length=120)
    rol: Optional[RolEnum] = None
    activo: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=50)


class EmpleadoResponse(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    activo: bool
    fecha_creacion: Optional[datetime] = None


class EmpleadoListResponse(BaseModel):
    total: int
    empleados: List[EmpleadoResponse]


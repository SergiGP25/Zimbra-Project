import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class LoginRequest(BaseModel):
    email: str
    password: str


class UserAuthProfile(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    activo: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutos (HU-02)
    user: UserAuthProfile
    message: str = "Inicio de sesión exitoso"


class TokenPayload(BaseModel):
    sub: str  # id del empleado
    email: str
    rol: str
    exp: Optional[int] = None


class CambioPasswordRequest(BaseModel):
    """
    Datos para cambiar la contraseña del usuario que inició sesión.

    Pydantic valida estas reglas ANTES de que el código del servicio se ejecute.
    Si alguna falla, FastAPI responde 422 con el mensaje del ValueError.
    """

    password_actual: str = Field(..., min_length=1)
    # bcrypt solo usa los primeros 72 bytes, por eso el máximo
    password_nueva: str = Field(..., min_length=8, max_length=72)
    confirmacion: str

    @field_validator("password_nueva")
    @classmethod
    def validar_fortaleza(cls, valor: str) -> str:
        if not re.search(r"[A-Z]", valor):
            raise ValueError("La nueva contraseña debe tener al menos una letra mayúscula")
        if not re.search(r"[a-z]", valor):
            raise ValueError("La nueva contraseña debe tener al menos una letra minúscula")
        if not re.search(r"\d", valor):
            raise ValueError("La nueva contraseña debe tener al menos un número")
        return valor

    @model_validator(mode="after")
    def validar_confirmacion(self) -> "CambioPasswordRequest":
        # model_validator ve todos los campos juntos: sirve para comparar dos de ellos
        if self.password_nueva != self.confirmacion:
            raise ValueError("La confirmación no coincide con la nueva contraseña")
        return self


class MensajeResponse(BaseModel):
    message: str

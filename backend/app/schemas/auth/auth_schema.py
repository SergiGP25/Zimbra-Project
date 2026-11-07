from typing import Optional
from pydantic import BaseModel, EmailStr


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


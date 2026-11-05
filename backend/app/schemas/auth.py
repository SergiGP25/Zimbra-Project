from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthTokenResponse(BaseModel):
    auth_token: str
    lifetime: Optional[int] = None
    email: Optional[str] = None
    message: str = "Autenticación exitosa en Zimbra"


class UserProfile(BaseModel):
    id: Optional[str] = None
    email: str
    name: Optional[str] = None


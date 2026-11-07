from typing import Dict, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.schemas.auth.auth_schema import LoginRequest, TokenResponse, UserAuthProfile
from app.services.auth.auth_service import auth_service

router = APIRouter()


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión con correo y contraseña (HU-01)",
    description="Valida credenciales contra hash bcrypt y genera token JWT de 30 minutos. Rechaza empleados inactivos.",
)
def login(payload: LoginRequest, db: Optional[Session] = Depends(get_db)):
    return auth_service.authenticate_user(
        email=payload.email,
        password=payload.password,
        db=db,
    )


@router.get(
    "/me",
    response_model=UserAuthProfile,
    summary="Obtener perfil del usuario autenticado actual",
)
def get_me(current_user: Dict[str, any] = Depends(get_current_user)):
    return UserAuthProfile(
        id=current_user["id"],
        nombre=current_user["nombre"],
        email=current_user["email"],
        rol=current_user["rol"],
        activo=current_user["activo"],
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Cerrar sesión (HU-02)",
    description="Informa al cliente que la sesión se cierra para que descarte el token y limpie el almacenamiento local.",
)
def logout(current_user: Dict[str, any] = Depends(get_current_user)):
    return {
        "status": "success",
        "message": f"Sesión cerrada correctamente para {current_user['email']}",
    }


import logging
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token
from app.repositories.empleados.empleado_repository import empleado_repository, EmpleadoRepository
from app.schemas.auth.auth_schema import TokenResponse, UserAuthProfile

logger = logging.getLogger(__name__)


class AuthService:
    """
    Servicio de autenticación para Empleados (HU-01 y HU-02).
    Aplica las reglas:
    - Validación de credenciales con hash seguro bcrypt.
    - Mensajes genéricos de error para evitar enumeración de usuarios.
    - Rechazo de empleados inactivos.
    - Emisión de token JWT con expiración a 30 minutos.
    """

    def __init__(self, emp_repo: Optional[EmpleadoRepository] = None):
        self.emp_repo = emp_repo or empleado_repository

    def authenticate_user(
        self,
        email: str,
        password: str,
        db: Optional[Session] = None,
    ) -> TokenResponse:
        # 1. Buscar empleado
        empleado = self.emp_repo.get_by_email(email, db=db)
        
        # 2. Mensaje genérico si no existe o password no coincide (HU-01)
        if not empleado or not verify_password(password, empleado["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3. Validar estado activo (HU-01)
        if not empleado.get("activo", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El empleado se encuentra inactivo y no tiene permitido el acceso al sistema",
            )

        # 4. Generar Token JWT con claims mínimos y seguros
        token_data = {
            "sub": str(empleado["id"]),
            "email": empleado["email"],
            "rol": empleado["rol"],
            "nombre": empleado["nombre"],
        }
        token = create_access_token(data=token_data)

        user_profile = UserAuthProfile(
            id=empleado["id"],
            nombre=empleado["nombre"],
            email=empleado["email"],
            rol=empleado["rol"],
            activo=empleado["activo"],
        )

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=1800,  # 30 minutos
            user=user_profile,
            message="Sesión iniciada correctamente",
        )


auth_service = AuthService()


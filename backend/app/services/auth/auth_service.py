import logging
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token, hash_password
from app.repositories.empleados.empleado_repository import empleado_repository, EmpleadoRepository
from app.schemas.auth.auth_schema import (
    CambioPasswordRequest,
    MensajeResponse,
    TokenResponse,
    UserAuthProfile,
)

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

    def cambiar_password(
        self,
        usuario: Dict[str, Any],
        datos: CambioPasswordRequest,
        db: Optional[Session] = None,
    ) -> MensajeResponse:
        """
        Cambia la contraseña del usuario que inició sesión.
        Pydantic ya validó longitud, mayúscula, minúscula, número y confirmación.
        Aquí solo quedan las reglas que necesitan la base de datos.
        """
        # 1. Releer el empleado para tener el hash actual (el token no lo trae)
        empleado = self.emp_repo.get_by_id(usuario["id"], db=db)
        if not empleado:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        # 2. La contraseña actual debe coincidir.
        #    Se responde 400 y no 401: el frontend cierra la sesión ante un 401,
        #    y aquí el usuario solo escribió mal su contraseña.
        if not verify_password(datos.password_actual, empleado["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual no es correcta",
            )

        # 3. La nueva no puede ser igual a la actual
        if verify_password(datos.password_nueva, empleado["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña debe ser diferente de la actual",
            )

        # 4. Guardar SOLO el hash bcrypt, nunca la contraseña en texto plano
        self.emp_repo.update(
            usuario["id"],
            {"password_hash": hash_password(datos.password_nueva)},
            db=db,
        )
        logger.info("Contraseña actualizada para el empleado %s", usuario["id"])
        return MensajeResponse(message="Contraseña actualizada")


auth_service = AuthService()


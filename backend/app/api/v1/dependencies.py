from typing import Callable, Dict, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.repositories.empleados.empleado_repository import empleado_repository

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Optional[Session] = Depends(get_db),
) -> Dict[str, any]:
    """
    Extrae y valida el token JWT del encabezado Authorization: Bearer <token>.
    Verifica que el usuario exista y siga activo.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere token de autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado. Inicie sesión nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no contiene identificador válido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(sub)
    except ValueError:
        user_id = sub

    # Validar en repositorio que el usuario exista y esté activo
    empleado = empleado_repository.get_by_id(user_id, db=db)
    if not empleado:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado en el sistema",
        )

    if not empleado.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo y no tiene acceso",
        )

    return empleado


def require_roles(allowed_roles: List[str]) -> Callable:
    """
    Fábrica de dependencias para Control de Acceso Basado en Roles (RBAC - HU-04).
    Retorna 403 Forbidden si el rol del usuario no está en allowed_roles.
    """
    def role_checker(current_user: Dict[str, any] = Depends(get_current_user)) -> Dict[str, any]:
        user_role = current_user.get("rol")
        # Comparación insensible a mayúsculas
        allowed_normalized = [r.lower() for r in allowed_roles]
        if not user_role or user_role.lower() not in allowed_normalized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: Se requiere uno de los siguientes roles: {', '.join(allowed_roles)} (Rol actual: '{user_role}')",
            )
        return current_user

    return role_checker


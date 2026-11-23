from typing import Dict, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.schemas.auth.auth_schema import (
    CambioPasswordRequest,
    LoginRequest,
    MensajeResponse,
    RecuperarPasswordRequest,
    RestablecerPasswordRequest,
    TokenResponse,
    UserAuthProfile,
)
from app.services.auth.auth_service import auth_service
from app.services.notificaciones import notificacion_service

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


@router.put(
    "/password",
    response_model=MensajeResponse,
    summary="Cambiar la contraseña del usuario autenticado",
    description=(
        "Exige la contraseña actual. La nueva debe tener 8 o más caracteres, "
        "una mayúscula, una minúscula y un número, y ser distinta de la actual."
    ),
)
def cambiar_password(
    payload: CambioPasswordRequest,
    tareas: BackgroundTasks,
    current_user: Dict[str, any] = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    respuesta = auth_service.cambiar_password(current_user, payload, db=db)
    # Aviso de seguridad: si no fue el dueño de la cuenta, se entera
    tareas.add_task(notificacion_service.password_cambiada, current_user["email"], current_user["nombre"])
    return respuesta


@router.post(
    "/recuperar",
    response_model=MensajeResponse,
    summary="¿Olvidaste tu contraseña? Envía un enlace por correo",
    description="Responde siempre el mismo mensaje, exista o no la cuenta, para no revelar qué correos están registrados.",
)
def recuperar_password(
    payload: RecuperarPasswordRequest,
    tareas: BackgroundTasks,
    db: Optional[Session] = Depends(get_db),
):
    datos = auth_service.preparar_recuperacion(payload.email, db=db)
    if datos:
        tareas.add_task(notificacion_service.restablecer_password, datos["email"], datos["nombre"],
                        datos["enlace"], datos["minutos"])
    return MensajeResponse(message=auth_service.MENSAJE_RECUPERAR)


@router.post(
    "/restablecer",
    response_model=MensajeResponse,
    summary="Crear una contraseña nueva con el enlace del correo",
    description="El enlace vence y sirve una sola vez: al cambiar la contraseña deja de ser válido.",
)
def restablecer_password(
    payload: RestablecerPasswordRequest,
    tareas: BackgroundTasks,
    db: Optional[Session] = Depends(get_db),
):
    empleado = auth_service.restablecer(payload, db=db)
    tareas.add_task(notificacion_service.password_cambiada, empleado["email"], empleado["nombre"])
    return MensajeResponse(message="Listo. Ya puedes entrar con tu contraseña nueva.")


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


"""
Notificaciones por correo del sistema.

Los routers las programan con BackgroundTasks de FastAPI: la respuesta HTTP
sale primero y el correo se envía después. Así el usuario no espera a que el
servidor de correo conteste, y si el correo falla la operación ya quedó
guardada (ver app/core/correo.py).
"""
from datetime import date

from app.core.config import settings
from app.core.correo import enviar_correo
from app.core.security import crear_token_portal
from app.services.notificaciones import plantillas


def registro_recibido(email: str, nombre: str) -> None:
    enviar_correo(email, *plantillas.registro_recibido(nombre))


def enlace_portal(prospecto_id: int) -> str:
    """Enlace personal del visitante a "Mi prueba" (ver publico_service.ver_portal)."""
    return f"{settings.FRONTEND_URL.rstrip('/')}/mi-prueba?token={crear_token_portal(prospecto_id)}"


def prueba_activada(email: str, nombre: str, producto: str, inicio: date, fin: date, prospecto_id: int) -> None:
    enviar_correo(email, *plantillas.prueba_activada(nombre, producto, inicio, fin, enlace_portal(prospecto_id)))


def restablecer_password(email: str, nombre: str, enlace: str, minutos: int) -> None:
    enviar_correo(email, *plantillas.restablecer_password(nombre, enlace, minutos))


def password_cambiada(email: str, nombre: str) -> None:
    enviar_correo(email, *plantillas.password_cambiada(nombre))

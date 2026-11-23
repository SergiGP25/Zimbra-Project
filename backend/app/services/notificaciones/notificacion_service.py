"""
Notificaciones por correo del sistema.

Los routers las programan con BackgroundTasks de FastAPI: la respuesta HTTP
sale primero y el correo se envía después. Así el usuario no espera a que el
servidor de correo conteste, y si el correo falla la operación ya quedó
guardada (ver app/core/correo.py).
"""
from datetime import date

from app.core.correo import enviar_correo
from app.services.notificaciones import plantillas


def registro_recibido(email: str, nombre: str) -> None:
    enviar_correo(email, *plantillas.registro_recibido(nombre))


def prueba_activada(email: str, nombre: str, producto: str, inicio: date, fin: date) -> None:
    enviar_correo(email, *plantillas.prueba_activada(nombre, producto, inicio, fin))


def restablecer_password(email: str, nombre: str, enlace: str, minutos: int) -> None:
    enviar_correo(email, *plantillas.restablecer_password(nombre, enlace, minutos))


def password_cambiada(email: str, nombre: str) -> None:
    enviar_correo(email, *plantillas.password_cambiada(nombre))

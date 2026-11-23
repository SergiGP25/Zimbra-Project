"""
Envío de correos.

Una sola función, enviar_correo(), y tres formas de entregar el mensaje según
la variable CORREO_MODO:

  consola  No envía nada: escribe el correo en el log del backend. Sirve
           cuando no hay servidor de correo configurado.
  smtp     Usa el protocolo SMTP (el estándar del correo). En local, Docker
           levanta Mailpit: un buzón falso que atrapa todo lo que se envía y
           lo muestra en http://localhost:8025. Nadie recibe correos reales.
  brevo    Usa la API HTTPS de Brevo (300 correos gratis al día). Es la opción
           para Railway: sus planes Free y Hobby bloquean SMTP.

Regla importante: un correo que falla NUNCA debe tumbar la operación que lo
originó. Si la prueba ya se registró en la base, el visitante debe ver el
éxito aunque el correo no salga. Por eso esta función no lanza excepciones:
registra el error en el log y devuelve False.
"""
import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


def enviar_correo(destino: str, asunto: str, html: str, texto: str) -> bool:
    modo = settings.CORREO_MODO.lower().strip()
    try:
        if modo == "smtp":
            _por_smtp(destino, asunto, html, texto)
        elif modo == "brevo":
            _por_brevo(destino, asunto, html, texto)
        else:
            logger.info("CORREO (modo consola) para %s | %s\n%s", destino, asunto, texto)
        logger.info("Correo '%s' enviado a %s (modo %s)", asunto, destino, modo)
        return True
    except Exception as error:  # noqa: BLE001 - a propósito: el correo nunca rompe el flujo
        logger.error("No se pudo enviar el correo '%s' a %s: %s", asunto, destino, error)
        return False


def _por_smtp(destino: str, asunto: str, html: str, texto: str) -> None:
    mensaje = EmailMessage()
    mensaje["Subject"] = asunto
    mensaje["From"] = formataddr((settings.CORREO_REMITENTE_NOMBRE, settings.CORREO_REMITENTE))
    mensaje["To"] = destino
    mensaje.set_content(texto)                    # versión de texto plano
    mensaje.add_alternative(html, subtype="html")  # versión con diseño

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as servidor:
        if settings.SMTP_TLS:
            servidor.starttls()
        if settings.SMTP_USUARIO:
            servidor.login(settings.SMTP_USUARIO, settings.SMTP_CLAVE)
        servidor.send_message(mensaje)


def _por_brevo(destino: str, asunto: str, html: str, texto: str) -> None:
    if not settings.BREVO_API_KEY:
        raise RuntimeError("Falta BREVO_API_KEY")
    respuesta = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": settings.BREVO_API_KEY, "accept": "application/json"},
        json={
            "sender": {"name": settings.CORREO_REMITENTE_NOMBRE, "email": settings.CORREO_REMITENTE},
            "to": [{"email": destino}],
            "subject": asunto,
            "htmlContent": html,
            "textContent": texto,
        },
        timeout=10,
    )
    respuesta.raise_for_status()

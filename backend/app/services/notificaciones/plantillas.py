"""
Plantillas de los correos.

Cada función devuelve (asunto, html, texto). Se mandan las dos versiones:
el HTML se ve en Gmail u Outlook; el texto plano lo usan los lectores de
pantalla y los clientes de correo que no muestran HTML.

Los correos no pueden usar hojas de estilo externas ni variables CSS: los
clientes de correo las ignoran. Por eso los colores van escritos en cada
etiqueta (estilos "en línea"), con la misma paleta del sitio.
"""
from datetime import date
from html import escape
from typing import Tuple

# Paleta del sitio
NOCHE = "#1A1A1F"
INDIGO = "#2D2B55"
VIOLETA = "#6A5ACD"
CREMA = "#F0D9B5"
AMBAR = "#F4A62A"
PAPEL = "#FAF6EF"
TEXTO_SUAVE = "#55506B"

Correo = Tuple[str, str, str]


def _fecha(valor: date) -> str:
    return valor.strftime("%d/%m/%Y")


def _boton(texto: str, enlace: str) -> str:
    return (
        f'<p style="margin:28px 0;"><a href="{escape(enlace)}" '
        f'style="background:{AMBAR};color:{NOCHE};text-decoration:none;font-weight:700;'
        f'padding:12px 22px;border-radius:999px;display:inline-block;">{escape(texto)}</a></p>'
    )


def _marco(titulo: str, cuerpo: str) -> str:
    """Estructura común: franja índigo con la marca y una tarjeta blanca."""
    return f"""<!DOCTYPE html>
<html lang="es"><body style="margin:0;background:{PAPEL};font-family:Segoe UI,Arial,sans-serif;color:{NOCHE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{PAPEL};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:{INDIGO};padding:20px 28px;color:{CREMA};font-size:20px;font-weight:700;letter-spacing:.5px;">zimbra</td></tr>
<tr><td style="padding:28px;line-height:1.6;font-size:16px;">
<h1 style="margin:0 0 12px;font-size:22px;color:{INDIGO};">{escape(titulo)}</h1>
{cuerpo}
</td></tr>
<tr><td style="padding:16px 28px;background:{PAPEL};color:{TEXTO_SUAVE};font-size:13px;">
Correo automático del sistema Zimbra CRM. No respondas a este mensaje.
</td></tr>
</table>
</td></tr></table>
</body></html>"""


def registro_recibido(nombre: str) -> Correo:
    primer = escape(nombre.split(" ")[0])
    asunto = "Recibimos tu registro en Zimbra"
    html = _marco(
        f"Hola, {primer}",
        f"""<p>Gracias por registrarte. Ya tienes un asesor de Zimbra asignado para
acompañarte mientras conoces el producto.</p>
<p style="color:{TEXTO_SUAVE};">En unos minutos recibirás otro correo con los datos de tu prueba gratuita.</p>""",
    )
    texto = (
        f"Hola, {nombre.split(' ')[0]}.\n\nGracias por registrarte en Zimbra. "
        "En unos minutos recibirás otro correo con los datos de tu prueba gratuita."
    )
    return asunto, html, texto


def prueba_activada(nombre: str, producto: str, inicio: date, fin: date) -> Correo:
    primer = escape(nombre.split(" ")[0])
    asunto = f"Tu prueba de {producto} está activa"
    html = _marco(
        f"{primer}, tu prueba está activa",
        f"""<p>Puedes usar <strong>{escape(producto)}</strong> durante 60 días, sin costo.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;border-left:4px solid {VIOLETA};">
<tr><td style="padding:4px 16px;color:{TEXTO_SUAVE};font-size:14px;">Empieza</td><td style="padding:4px 16px;font-weight:700;">{_fecha(inicio)}</td></tr>
<tr><td style="padding:4px 16px;color:{TEXTO_SUAVE};font-size:14px;">Termina</td><td style="padding:4px 16px;font-weight:700;">{_fecha(fin)}</td></tr>
</table>
<p>Antes de que termine te avisaremos. Si quieres seguir, tu asesor te ayuda a elegir un plan.</p>""",
    )
    texto = (
        f"Hola, {nombre.split(' ')[0]}.\n\nTu prueba de {producto} está activa.\n"
        f"Empieza: {_fecha(inicio)}\nTermina: {_fecha(fin)}\n\n"
        "Antes de que termine te avisaremos."
    )
    return asunto, html, texto


def restablecer_password(nombre: str, enlace: str, minutos: int) -> Correo:
    primer = escape(nombre.split(" ")[0])
    asunto = "Restablece tu contraseña de Zimbra CRM"
    html = _marco(
        f"Hola, {primer}",
        f"""<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
{_boton("Crear una contraseña nueva", enlace)}
<p style="color:{TEXTO_SUAVE};font-size:14px;">El enlace sirve una sola vez y vence en {minutos} minutos.
Si no pediste el cambio, ignora este correo: tu contraseña actual sigue funcionando.</p>""",
    )
    texto = (
        f"Hola, {nombre.split(' ')[0]}.\n\nPara crear una contraseña nueva abre este enlace:\n{enlace}\n\n"
        f"Sirve una sola vez y vence en {minutos} minutos. Si no pediste el cambio, ignora este correo."
    )
    return asunto, html, texto


def password_cambiada(nombre: str) -> Correo:
    primer = escape(nombre.split(" ")[0])
    asunto = "Tu contraseña de Zimbra CRM cambió"
    html = _marco(
        f"Hola, {primer}",
        f"""<p>La contraseña de tu cuenta se cambió correctamente.</p>
<p style="color:{TEXTO_SUAVE};">Si no fuiste tú, avisa de inmediato al administrador del sistema.</p>""",
    )
    texto = (
        f"Hola, {nombre.split(' ')[0]}.\n\nLa contraseña de tu cuenta se cambió correctamente. "
        "Si no fuiste tú, avisa de inmediato al administrador del sistema."
    )
    return asunto, html, texto

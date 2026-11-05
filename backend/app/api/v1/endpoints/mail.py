from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query, status
from app.schemas.mail import MailListResponse, SendMailRequest
from app.services.zimbra_service import zimbra_service

router = APIRouter()


@router.get("/inbox", response_model=MailListResponse, summary="Obtener correos de la bandeja de entrada")
async def get_inbox(
    authorization: Optional[str] = Header(None),
    limit: int = Query(default=10, ge=1, le=50)
):
    token = authorization.replace("Bearer ", "") if authorization else "guest_token"
    messages = await zimbra_service.get_inbox_messages(auth_token=token, limit=limit)
    return {
        "total": len(messages),
        "messages": messages
    }


@router.post("/send", summary="Enviar correo a través de Zimbra")
async def send_mail(
    payload: SendMailRequest,
    authorization: Optional[str] = Header(None)
):
    token = authorization.replace("Bearer ", "") if authorization else "guest_token"
    result = await zimbra_service.send_mail(
        auth_token=token,
        to=payload.to,
        subject=payload.subject,
        content=payload.content,
        is_html=payload.is_html
    )
    return result


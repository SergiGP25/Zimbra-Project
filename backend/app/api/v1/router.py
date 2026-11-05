from fastapi import APIRouter
from app.api.v1.endpoints import auth, health, mail

api_router = APIRouter()

api_router.include_router(health.router, tags=["Salud"])
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación Zimbra"])
api_router.include_router(mail.router, prefix="/mail", tags=["Correo Zimbra"])


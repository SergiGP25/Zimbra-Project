from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import LoginRequest, AuthTokenResponse
from app.services.zimbra_service import zimbra_service

router = APIRouter()


@router.post("/login", response_model=AuthTokenResponse, summary="Iniciar sesión en Zimbra")
async def login(credentials: LoginRequest):
    try:
        auth_data = await zimbra_service.authenticate(
            username=credentials.username,
            password=credentials.password
        )
        return auth_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Error de autenticación: {str(e)}"
        )


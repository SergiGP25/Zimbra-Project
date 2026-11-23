import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import bcrypt
import jwt
from app.core.config import settings


def hash_password(password: str) -> str:
    """
    Genera un hash seguro con bcrypt para la contraseña en texto plano.
    """
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña en texto plano coincide con el hash bcrypt guardado.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT firmado con los datos del usuario y tiempo de expiración (HU-02: 30 min).
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def huella_password(password_hash: str) -> str:
    """
    Resumen corto del hash actual de la contraseña. Va dentro del token de
    restablecimiento: cuando la contraseña cambia, el hash cambia y la huella
    deja de coincidir, así el enlace del correo sirve UNA sola vez.
    Se guarda un SHA-256 del hash y no el hash mismo, que no debe salir del servidor.
    """
    return hashlib.sha256(password_hash.encode("utf-8")).hexdigest()[:16]


def crear_token_restablecer(empleado_id: int, password_hash: str, minutos: int) -> str:
    """Token firmado para restablecer la contraseña. NO sirve para iniciar sesión (ver dependencies.py)."""
    return create_access_token(
        {"sub": str(empleado_id), "tipo": "restablecer", "huella": huella_password(password_hash)},
        expires_delta=timedelta(minutes=minutos),
    )


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodifica y valida la firma y expiración del token JWT.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None


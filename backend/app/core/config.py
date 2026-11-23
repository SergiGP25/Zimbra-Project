from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Zimbra CRM - Sistemas Transaccionales"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # JWT & Seguridad (HU-01 y HU-02: 30 minutos de inactividad / sesión)
    SECRET_KEY: str = "super_secret_jwt_key_sistemas_transaccionales_zimbra_2026_d1"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Base de Datos MySQL
    DB_HOST: str = "localhost"
    DB_PORT: int = 3307
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "crm_zimbra"
    DATABASE_URL: str = ""

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Dirección pública del frontend: se usa en los enlaces de los correos
    # (por ejemplo, el enlace para restablecer la contraseña).
    FRONTEND_URL: str = "http://localhost:5174"

    # Correos (ver app/core/correo.py)
    #   consola -> no envía nada, escribe el correo en el log (por defecto)
    #   smtp    -> servidor SMTP (en local: Mailpit, http://localhost:8025)
    #   brevo   -> API HTTPS de Brevo (para Railway, que bloquea SMTP)
    CORREO_MODO: str = "consola"
    CORREO_REMITENTE: str = "no-reply@zimbra-demo.com"
    CORREO_REMITENTE_NOMBRE: str = "Zimbra CRM"
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USUARIO: str = ""
    SMTP_CLAVE: str = ""
    SMTP_TLS: bool = False
    BREVO_API_KEY: str = ""

    # Minutos de validez del enlace para restablecer la contraseña
    RESET_TOKEN_MINUTOS: int = 30

    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        pwd = f":{self.DB_PASSWORD}" if self.DB_PASSWORD else ""
        return f"mysql+pymysql://{self.DB_USER}{pwd}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

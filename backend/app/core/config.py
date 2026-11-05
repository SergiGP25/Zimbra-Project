from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Zimbra Integration API"
    API_V1_STR: str = "/api/v1"
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Zimbra Configuration
    ZIMBRA_SERVER_URL: str = "https://mail.example.com"
    ZIMBRA_SOAP_ENDPOINT: str = "https://mail.example.com/service/soap"
    ZIMBRA_ADMIN_URL: str = "https://mail.example.com:7071/service/admin/soap"
    ZIMBRA_VERIFY_SSL: bool = False

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()


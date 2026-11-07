import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Creación perezosa del engine para no bloquear la app si MySQL no está levantado localmente
engine = None
SessionLocal = None

try:
    db_url = settings.get_database_url
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Engine de base de datos MySQL inicializado correctamente.")
except Exception as e:
    logger.warning(f"No se pudo conectar a MySQL automáticamente: {e}. Se operará con fallback seguro.")


def get_db() -> Generator[Session, None, None]:
    """
    Dependencia de FastAPI para obtener una sesión de base de datos.
    Garantiza el cierre automático de la conexión al terminar la petición.
    """
    if SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


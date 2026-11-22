from typing import Optional
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

router = APIRouter()


@router.get("/health", summary="Comprueba la API y la conexión con MySQL")
def health_check(db: Optional[Session] = Depends(get_db)):
    """
    Evidencia de la conexión back-end -> base de datos:
    hace consultas reales a MySQL y cuenta objetos creados por los scripts.
    """
    respuesta = {"status": "ok", "service": settings.PROJECT_NAME, "database": settings.DB_NAME}
    if db is None:
        return JSONResponse(status_code=503, content={**respuesta, "status": "error", "database_status": "sin configurar"})
    try:
        cuenta = lambda sql: db.execute(text(sql)).scalar()  # noqa: E731
        respuesta.update({
            "database_status": "conectada",
            "mysql_version": cuenta("SELECT VERSION()"),
            "hora_servidor_bd": str(cuenta("SELECT NOW()")),
            "empleados_cargados": cuenta("SELECT COUNT(*) FROM empleado"),
            "prospectos_cargados": cuenta("SELECT COUNT(*) FROM prospecto"),
            "triggers": cuenta("SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE()"),
            "procedimientos": cuenta("SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE() AND routine_type = 'PROCEDURE'"),
        })
        return respuesta
    except Exception as error:  # la base no responde o faltan tablas
        return JSONResponse(status_code=503, content={**respuesta, "status": "error",
                                                      "database_status": "sin conexión", "detalle": type(error).__name__})

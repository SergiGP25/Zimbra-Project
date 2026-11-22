from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pymysql
from sqlalchemy.exc import DBAPIError
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db_utils import respuesta_error_mysql

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuración de CORS para permitir conexiones desde el frontend (Vite React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manejador global: cualquier error de MySQL que no se haya capturado en un
# servicio (SIGNAL de un procedimiento, CHECK, UNIQUE...) llega aquí y se
# responde con un mensaje claro en lugar de un error 500 genérico (RNF-18).
@app.exception_handler(DBAPIError)
@app.exception_handler(pymysql.err.MySQLError)
async def manejar_error_mysql(request: Request, error: Exception):
    codigo, mensaje = respuesta_error_mysql(error)
    return JSONResponse(status_code=codigo, content={"detail": mensaje})


# Inclusión de rutas v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": f"Bienvenido a la API del {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }


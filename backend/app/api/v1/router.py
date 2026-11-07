from fastapi import APIRouter
from app.api.v1.health.health_router import router as health_router
from app.api.v1.auth.auth_router import router as auth_router
from app.api.v1.empleados.empleado_router import router as empleado_router
from app.api.v1.prospectos.prospecto_router import router as prospecto_router

api_router = APIRouter()

# Healthcheck
api_router.include_router(health_router, tags=["Salud del Sistema"])

# EP-01: Autenticación y Usuarios
api_router.include_router(auth_router, prefix="/auth", tags=["Autenticación (EP-01)"])
api_router.include_router(empleado_router, prefix="/empleados", tags=["Gestión de Empleados (EP-01)"])
api_router.include_router(prospecto_router, prefix="/prospectos", tags=["Prospectos y Filtros por Rol (EP-01)"])

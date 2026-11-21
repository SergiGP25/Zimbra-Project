from fastapi import APIRouter
from app.api.v1.health.health_router import router as health_router
from app.api.v1.auth.auth_router import router as auth_router
from app.api.v1.empleados.empleado_router import router as empleado_router
from app.api.v1.prospectos.prospecto_router import router as prospecto_router
from app.api.v1.interacciones.interaccion_router import router as interaccion_router
from app.api.v1.ventas.venta_router import router as venta_router

api_router = APIRouter()

# Healthcheck
api_router.include_router(health_router, tags=["Salud del Sistema"])

# EP-01: Autenticación y Usuarios
api_router.include_router(auth_router, prefix="/auth", tags=["Autenticación (EP-01)"])
api_router.include_router(empleado_router, prefix="/empleados", tags=["Gestión de Empleados (EP-01)"])
api_router.include_router(prospecto_router, prefix="/prospectos", tags=["Prospectos y Filtros por Rol (EP-01)"])
api_router.include_router(interaccion_router, prefix="/interacciones", tags=["Interacciones (HU-27 a HU-29)"])
api_router.include_router(venta_router, prefix="/ventas", tags=["Ventas (HU-33 a HU-35)"])

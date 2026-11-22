from fastapi import APIRouter

from app.api.v1.alertas.alerta_router import router as alerta_router
from app.api.v1.auth.auth_router import router as auth_router
from app.api.v1.campanas.campana_router import router as campana_router
from app.api.v1.empleados.empleado_router import router as empleado_router
from app.api.v1.health.health_router import router as health_router
from app.api.v1.interacciones.interaccion_router import router as interaccion_router
from app.api.v1.productos.producto_router import router as producto_router
from app.api.v1.propuestas.propuesta_router import router as propuesta_router
from app.api.v1.prospectos.prospecto_router import router as prospecto_router
from app.api.v1.pruebas.prueba_router import router as prueba_router
from app.api.v1.publico.publico_router import router as publico_router
from app.api.v1.reportes.reporte_router import router as reporte_router
from app.api.v1.ventas.venta_router import router as venta_router
from app.api.v1.visitas.visita_router import router as visita_router

api_router = APIRouter()

# Cada módulo con su prefijo y su grupo en Swagger (/docs).
# El orden sigue el proceso comercial: captar -> calificar -> vender -> medir.
api_router.include_router(health_router, tags=["Estado del sistema"])
api_router.include_router(publico_router, prefix="/publico", tags=["Sitio público"])
api_router.include_router(auth_router, prefix="/auth", tags=["Autenticación (EP-01)"])
api_router.include_router(empleado_router, prefix="/empleados", tags=["Empleados (EP-01)"])
api_router.include_router(campana_router, prefix="/campanas", tags=["Campañas"])
api_router.include_router(producto_router, prefix="/productos", tags=["Productos"])
api_router.include_router(prospecto_router, prefix="/prospectos", tags=["Prospectos"])
api_router.include_router(prueba_router, prefix="/pruebas", tags=["Pruebas gratuitas (T1)"])
api_router.include_router(visita_router, prefix="/visitas", tags=["Visitas web (T2)"])
api_router.include_router(alerta_router, prefix="/alertas", tags=["Alertas"])
api_router.include_router(interaccion_router, prefix="/interacciones", tags=["Interacciones (T3)"])
api_router.include_router(propuesta_router, prefix="/propuestas", tags=["Propuestas"])
api_router.include_router(venta_router, prefix="/ventas", tags=["Ventas (T4)"])
api_router.include_router(reporte_router, prefix="/reportes", tags=["Reportes"])

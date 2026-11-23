from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.db_utils import es_vendedor, exigir_db, llamar_transaccion
from app.repositories.propuestas.propuesta_repository import propuesta_repository
from app.schemas.propuestas.propuesta_schema import PropuestaCreate
from app.services.prospectos.prospecto_service import prospecto_service


class PropuestaService:
    """Propuestas comerciales (RF-32 a RF-35)."""

    def listar(self, db: Optional[Session], usuario: Dict[str, Any], estado, prospecto_id, vendedor_id, sin_venta: bool,
               desde=None, hasta=None):
        db = exigir_db(db)
        if es_vendedor(usuario):
            vendedor_id = usuario["id"]      # RN-12
        return propuesta_repository.listar(db, estado, prospecto_id, vendedor_id, sin_venta, desde, hasta)

    def crear(self, datos: PropuestaCreate, usuario: Dict[str, Any], db: Optional[Session]) -> Dict[str, Any]:
        db = exigir_db(db)
        prospecto = prospecto_service.obtener_con_permiso(db, usuario, datos.prospecto_id)
        if prospecto["estado"] == "Descartado":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "No se crean propuestas para un prospecto Descartado")
        # Responsable: el vendedor que la crea; si la crea un Admin, el vendedor del prospecto
        empleado_id = usuario["id"] if es_vendedor(usuario) else (prospecto["empleado_id"] or usuario["id"])
        nuevo_id = propuesta_repository.crear(db, datos.prospecto_id, empleado_id, datos.producto_id, datos.num_licencias)
        db.commit()
        return propuesta_repository.obtener(db, nuevo_id)

    def cambiar_estado(self, propuesta_id: int, estado: str, usuario: Dict[str, Any], db: Optional[Session]) -> Dict[str, Any]:
        db = exigir_db(db)
        if not propuesta_repository.obtener(db, propuesta_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Propuesta no encontrada")
        db.commit()
        # El procedimiento bloquea la fila (FOR UPDATE), verifica que sea el vendedor
        # responsable o un Admin, y TR-03 valida que la propuesta siga Enviada.
        llamar_transaccion(db, "sp_actualizar_propuesta",
                           {"propuesta": propuesta_id, "estado": estado, "empleado": usuario["id"]})
        return propuesta_repository.obtener(db, propuesta_id)


propuesta_service = PropuestaService()

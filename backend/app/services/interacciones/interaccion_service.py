from typing import Any, Dict, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db_utils import es_vendedor, exigir_db, llamar_transaccion
from app.repositories.interacciones.interaccion_repository import interaccion_repository
from app.schemas.interacciones.interaccion_schema import InteraccionCreate
from app.services.prospectos.prospecto_service import prospecto_service


class InteraccionService:
    """Llamadas y correos del vendedor (RF-29 a RF-31)."""

    def listar(self, db: Optional[Session], usuario: Dict[str, Any], prospecto_id, tipo, resultado):
        db = exigir_db(db)
        solo = usuario["id"] if es_vendedor(usuario) else None
        return interaccion_repository.listar(db, prospecto_id, tipo, resultado, solo)

    def registrar(self, datos: InteraccionCreate, usuario: Dict[str, Any], db: Optional[Session]) -> Dict[str, Any]:
        db = exigir_db(db)
        prospecto_service.obtener_con_permiso(db, usuario, datos.prospecto_id)   # RN-12
        db.commit()
        # T3: valida, inserta y suma 10 puntos si el resultado es Positivo.
        # El empleado es siempre quien inició sesión: nadie registra a nombre de otro.
        salida = llamar_transaccion(db, "sp_registrar_interaccion", {
            "prospecto": datos.prospecto_id, "empleado": usuario["id"], "tipo": datos.tipo,
            "resultado": datos.resultado, "notas": datos.notas, "campana": datos.campana_id,
        }, salidas=["interaccion"])
        puntaje = db.execute(text("SELECT puntaje_calificacion, estado FROM prospecto WHERE prospecto_id = :id"),
                             {"id": datos.prospecto_id}).mappings().first()
        return {"interaccion_id": salida.get("interaccion"), "puntaje": puntaje["puntaje_calificacion"],
                "estado_prospecto": puntaje["estado"]}


interaccion_service = InteraccionService()

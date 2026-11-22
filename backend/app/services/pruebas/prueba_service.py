from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.core.db_utils import es_vendedor, exigir_db, llamar_transaccion
from app.repositories.pruebas.prueba_repository import prueba_repository
from app.services.prospectos.prospecto_service import prospecto_service


class PruebaService:
    """Pruebas gratuitas de 60 días (RF-17 a RF-21)."""

    def listar(self, db: Optional[Session], usuario: Dict[str, Any], estado, prospecto_id, por_vencer: bool):
        db = exigir_db(db)
        solo = usuario["id"] if es_vendedor(usuario) else None
        return prueba_repository.listar(db, estado, prospecto_id, por_vencer, solo)

    def registrar(self, prospecto_id: int, producto_id: int, usuario: Dict[str, Any], db: Optional[Session]):
        db = exigir_db(db)
        prospecto_service.obtener_con_permiso(db, usuario, prospecto_id)   # RN-12
        db.commit()  # libera la lectura antes de que T1 abra su propia transacción
        # T1: valida estado y RN-03, inserta la prueba (TR-01 valida el producto),
        # pasa Nuevo -> En prueba y suma 20 puntos. Todo o nada.
        salida = llamar_transaccion(db, "sp_registrar_descarga",
                                    {"prospecto": prospecto_id, "producto": producto_id}, salidas=["descarga"])
        return prueba_repository.obtener(db, salida["descarga"])

    def vencer(self, db: Optional[Session]) -> Dict[str, int]:
        # Proceso por lotes con SAVEPOINT (RF-19 y RF-26)
        db = exigir_db(db)
        salida = llamar_transaccion(db, "sp_vencer_pruebas", {}, salidas=["vencidas", "alertas"])
        return {"pruebas_vencidas": int(salida.get("vencidas") or 0), "alertas_creadas": int(salida.get("alertas") or 0)}


prueba_service = PruebaService()

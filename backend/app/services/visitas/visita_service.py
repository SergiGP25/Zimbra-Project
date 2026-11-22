from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db_utils import es_vendedor, exigir_db, llamar_transaccion
from app.repositories.visitas.visita_repository import visita_repository
from app.schemas.visitas.visita_schema import VisitaCreate


class VisitaService:
    """Visitas web registradas con el simulador (RF-22 a RF-24)."""

    def listar(self, db: Optional[Session], usuario: Dict[str, Any], prospecto_id: Optional[int], limite: int):
        db = exigir_db(db)
        solo = usuario["id"] if es_vendedor(usuario) else None
        return visita_repository.listar(db, prospecto_id, solo, limite)

    def registrar(self, datos: VisitaCreate, db: Optional[Session]) -> Dict[str, Any]:
        db = exigir_db(db)
        if not db.execute(text("SELECT COUNT(*) FROM prospecto WHERE prospecto_id = :id"), {"id": datos.prospecto_id}).scalar():
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Prospecto no encontrado")
        db.commit()
        # T2: inserta la visita, suma 5 o 15 puntos y, con SAVEPOINT, intenta la alerta
        salida = llamar_transaccion(db, "sp_registrar_visita", {
            "prospecto": datos.prospecto_id, "pagina": datos.pagina_visitada, "duracion": datos.duracion_segundos,
        }, salidas=["visita", "alerta"])
        return {
            "visita_id": salida.get("visita"),
            "alerta_generada": bool(salida.get("alerta")),
            "puntos": 15 if datos.pagina_visitada.startswith("/precios") else 5,
            **visita_repository.estado_prospecto(db, datos.prospecto_id),
        }


visita_service = VisitaService()

from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.db_utils import es_vendedor, exigir_db
from app.repositories.alertas.alerta_repository import alerta_repository


class AlertaService:
    """Bandeja de alertas (RF-27, RF-28). Las alertas las crean T2 y el vencimiento de pruebas."""

    def listar(self, db: Optional[Session], usuario: Dict[str, Any], solo_pendientes: bool):
        db = exigir_db(db)
        # El vendedor ve solo las suyas; Admin y Marketing ven todas
        empleado = usuario["id"] if es_vendedor(usuario) else None
        return alerta_repository.listar(db, empleado, solo_pendientes)

    def pendientes(self, db: Optional[Session], usuario: Dict[str, Any]) -> Dict[str, int]:
        db = exigir_db(db)
        empleado = usuario["id"] if es_vendedor(usuario) else None
        return {"pendientes": alerta_repository.contar_pendientes(db, empleado)}

    def atender(self, alerta_id: int, usuario: Dict[str, Any], db: Optional[Session]) -> Dict[str, Any]:
        db = exigir_db(db)
        alerta = alerta_repository.obtener(db, alerta_id)
        if not alerta:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Alerta no encontrada")
        if es_vendedor(usuario) and alerta["empleado_id"] != usuario["id"]:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Esta alerta es de otro vendedor")
        alerta_repository.atender(db, alerta_id)
        db.commit()
        return {"alerta_id": alerta_id, "atendida": True}


alerta_service = AlertaService()

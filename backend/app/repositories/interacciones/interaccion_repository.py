import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class InteraccionRepository:
    def create(
        self,
        *,
        prospecto_id: int,
        empleado_id: int,
        tipo: str,
        resultado: str,
        notas: Optional[str],
        campana_id: Optional[int],
        db: Session,
    ) -> Dict[str, Any]:
        try:
            db.execute(
                text("SET @interaccion_id = NULL"),
            )
            db.execute(
                text(
                    """
                    CALL sp_registrar_interaccion(
                        :prospecto_id, :empleado_id, :tipo, :resultado,
                        :notas, :campana_id, @interaccion_id
                    )
                    """
                ),
                {
                    "prospecto_id": prospecto_id,
                    "empleado_id": empleado_id,
                    "tipo": tipo,
                    "resultado": resultado,
                    "notas": notas,
                    "campana_id": campana_id,
                },
            )
            row = db.execute(text("SELECT @interaccion_id AS id")).mappings().first()
            db.commit()
            interaccion_id = int(row["id"])
            return self.get_by_id(interaccion_id, db)
        except SQLAlchemyError:
            db.rollback()
            raise

    def get_by_id(self, interaccion_id: int, db: Session) -> Dict[str, Any]:
        row = db.execute(
            text(
                """
                SELECT i.interaccion_id AS id, i.prospecto_id,
                       p.nombre AS prospecto_nombre, i.empleado_id,
                       e.nombre AS empleado_nombre, i.campana_id,
                       i.tipo, i.fecha_hora, i.resultado, i.notas
                FROM interaccion i
                JOIN prospecto p ON p.prospecto_id = i.prospecto_id
                JOIN empleado e ON e.empleado_id = i.empleado_id
                WHERE i.interaccion_id = :id
                """
            ),
            {"id": interaccion_id},
        ).mappings().first()
        if not row:
            raise KeyError("Interacción no encontrada")
        return dict(row)

    def list_for_user(
        self,
        *,
        prospecto_id: Optional[int],
        user_id: int,
        user_role: str,
        db: Session,
    ) -> List[Dict[str, Any]]:
        conditions = []
        params: Dict[str, Any] = {}
        if user_role.lower() == "vendedor":
            conditions.append("i.empleado_id = :user_id")
            params["user_id"] = user_id
        if prospecto_id is not None:
            conditions.append("i.prospecto_id = :prospecto_id")
            params["prospecto_id"] = prospecto_id
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        rows = db.execute(
            text(
                f"""
                SELECT i.interaccion_id AS id, i.prospecto_id,
                       p.nombre AS prospecto_nombre, i.empleado_id,
                       e.nombre AS empleado_nombre, i.campana_id,
                       i.tipo, i.fecha_hora, i.resultado, i.notas
                FROM interaccion i
                JOIN prospecto p ON p.prospecto_id = i.prospecto_id
                JOIN empleado e ON e.empleado_id = i.empleado_id
                {where}
                ORDER BY i.fecha_hora DESC
                """
            ),
            params,
        ).mappings().all()
        return [dict(row) for row in rows]


interaccion_repository = InteraccionRepository()

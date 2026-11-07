import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


class ProspectoRepository:
    """
    Repositorio de persistencia para Prospectos.
    Consulta de manera directa y exclusiva a la base de datos MySQL (crm_zimbra).
    Implementa la restricción RN-12 (HU-04):
    - El Vendedor solo ve sus prospectos asignados.
    - Marketing y Admin ven la totalidad de los prospectos.
    """

    def _get_session(self, db: Optional[Session] = None) -> Optional[Session]:
        if db is not None:
            return db
        if SessionLocal is not None:
            return SessionLocal()
        return None

    def list_prospectos(
        self,
        user_rol: str,
        user_id: int,
        db: Optional[Session] = None,
    ) -> List[Dict[str, Any]]:
        session = self._get_session(db)
        if session is None:
            return []

        filter_by_vendedor = (user_rol.lower() == "vendedor")
        try:
            where_clause = "WHERE p.empleado_id = :vendedor_id" if filter_by_vendedor else ""
            sql = text(f"""
                SELECT 
                    p.prospecto_id AS id,
                    p.nombre,
                    p.empresa,
                    p.email,
                    p.telefono,
                    p.estado,
                    p.puntaje_calificacion AS puntaje,
                    p.campana_id AS id_campana,
                    p.empleado_id AS id_vendedor,
                    e.nombre AS vendedor_nombre,
                    p.fecha_registro
                FROM prospecto p
                LEFT JOIN empleado e ON e.empleado_id = p.empleado_id
                {where_clause}
                ORDER BY p.prospecto_id ASC
            """)
            params = {"vendedor_id": user_id} if filter_by_vendedor else {}
            rows = session.execute(sql, params).mappings().all()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Error consultando prospectos en base de datos: {e}")
            return []


prospecto_repository = ProspectoRepository()

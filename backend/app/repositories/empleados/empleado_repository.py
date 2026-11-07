import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


class EmpleadoRepository:
    """
    Repositorio de persistencia para la entidad Empleado.
    Interactúa de manera directa y exclusiva con la base de datos MySQL (crm_zimbra).
    """

    def _get_session(self, db: Optional[Session] = None) -> Optional[Session]:
        if db is not None:
            return db
        if SessionLocal is not None:
            return SessionLocal()
        return None

    def get_by_email(self, email: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        session = self._get_session(db)
        if session is None:
            return None

        clean_email = email.strip().lower()
        try:
            sql = text("""
                SELECT 
                    empleado_id AS id,
                    nombre,
                    email,
                    password_hash,
                    rol,
                    activo,
                    fecha_creacion
                FROM empleado
                WHERE LOWER(email) = :email
                LIMIT 1
            """)
            row = session.execute(sql, {"email": clean_email}).mappings().first()
            return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error consultando empleado por email en base de datos: {e}")
            return None

    def get_by_id(self, empleado_id: int, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        session = self._get_session(db)
        if session is None:
            return None

        try:
            sql = text("""
                SELECT 
                    empleado_id AS id,
                    nombre,
                    email,
                    password_hash,
                    rol,
                    activo,
                    fecha_creacion
                FROM empleado
                WHERE empleado_id = :id
                LIMIT 1
            """)
            row = session.execute(sql, {"id": empleado_id}).mappings().first()
            return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error consultando empleado por ID en base de datos: {e}")
            return None

    def list_empleados(
        self,
        rol: Optional[str] = None,
        activo: Optional[bool] = None,
        search: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> List[Dict[str, Any]]:
        session = self._get_session(db)
        if session is None:
            return []

        try:
            conditions = []
            params: Dict[str, Any] = {}

            if rol:
                conditions.append("rol = :rol")
                params["rol"] = rol

            if activo is not None:
                conditions.append("activo = :activo")
                params["activo"] = activo

            if search:
                conditions.append("(nombre LIKE :search OR email LIKE :search)")
                params["search"] = f"%{search}%"

            where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
            sql = text(f"""
                SELECT 
                    empleado_id AS id,
                    nombre,
                    email,
                    password_hash,
                    rol,
                    activo,
                    fecha_creacion
                FROM empleado
                {where_clause}
                ORDER BY empleado_id ASC
            """)
            rows = session.execute(sql, params).mappings().all()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Error listando empleados desde base de datos: {e}")
            return []

    def count_active_admins(self, db: Optional[Session] = None) -> int:
        """
        Retorna la cantidad real de administradores activos en MySQL (HU-03).
        """
        session = self._get_session(db)
        if session is None:
            return 0

        try:
            sql = text("SELECT COUNT(*) FROM empleado WHERE rol = 'Admin' AND activo = TRUE")
            return session.execute(sql).scalar() or 0
        except Exception as e:
            logger.error(f"Error contando administradores activos: {e}")
            return 0

    def create(
        self,
        nombre: str,
        email: str,
        password_hash: str,
        rol: str,
        activo: bool = True,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        session = self._get_session(db)
        if session is None:
            raise RuntimeError("No hay conexión activa a la base de datos.")

        now = datetime.now()
        sql = text("""
            INSERT INTO empleado (nombre, email, password_hash, rol, activo, fecha_creacion)
            VALUES (:nombre, :email, :password_hash, :rol, :activo, :fecha_creacion)
        """)
        result = session.execute(sql, {
            "nombre": nombre,
            "email": email,
            "password_hash": password_hash,
            "rol": rol,
            "activo": activo,
            "fecha_creacion": now
        })
        session.commit()
        new_id = result.lastrowid
        return {
            "id": new_id,
            "nombre": nombre,
            "email": email,
            "password_hash": password_hash,
            "rol": rol,
            "activo": activo,
            "fecha_creacion": now
        }

    def update(
        self,
        empleado_id: int,
        fields_to_update: Dict[str, Any],
        db: Optional[Session] = None,
    ) -> Optional[Dict[str, Any]]:
        session = self._get_session(db)
        if session is None:
            raise RuntimeError("No hay conexión activa a la base de datos.")

        set_clauses = [f"{k} = :{k}" for k in fields_to_update.keys()]
        sql = text(f"""
            UPDATE empleado
            SET {", ".join(set_clauses)}
            WHERE empleado_id = :id
        """)
        params = dict(fields_to_update)
        params["id"] = empleado_id
        session.execute(sql, params)
        session.commit()
        return self.get_by_id(empleado_id, db=session)

    def deactivate(self, empleado_id: int, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        """
        Soft delete: cambia activo = False (HU-03).
        """
        return self.update(empleado_id, {"activo": False}, db=db)


empleado_repository = EmpleadoRepository()

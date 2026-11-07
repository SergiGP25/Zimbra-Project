import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.repositories.empleados.empleado_repository import empleado_repository, EmpleadoRepository
from app.schemas.empleados.empleado_schema import (
    EmpleadoCreate,
    EmpleadoUpdate,
    EmpleadoResponse,
    EmpleadoListResponse,
)

logger = logging.getLogger(__name__)


class EmpleadoService:
    """
    Servicio con la lógica de negocio para Empleados (HU-03).
    Aplica las reglas:
    - Correo único en el sistema.
    - Contraseña almacenada siempre con hash seguro bcrypt.
    - Soft delete (desactivar no borra el registro).
    - Regla de negocio crítica: No se puede desactivar ni modificar el rol del último Administrador activo.
    """

    def __init__(self, emp_repo: Optional[EmpleadoRepository] = None):
        self.emp_repo = emp_repo or empleado_repository

    def list_empleados(
        self,
        rol: Optional[str] = None,
        activo: Optional[bool] = None,
        search: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> EmpleadoListResponse:
        empleados_raw = self.emp_repo.list_empleados(rol=rol, activo=activo, search=search, db=db)
        empleados_dto = [
            EmpleadoResponse(
                id=e["id"],
                nombre=e["nombre"],
                email=e["email"],
                rol=e["rol"],
                activo=e["activo"],
                fecha_creacion=e.get("fecha_creacion"),
            )
            for e in empleados_raw
        ]
        return EmpleadoListResponse(total=len(empleados_dto), empleados=empleados_dto)

    def get_empleado(self, empleado_id: int, db: Optional[Session] = None) -> EmpleadoResponse:
        emp = self.emp_repo.get_by_id(empleado_id, db=db)
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Empleado con ID {empleado_id} no encontrado"
            )
        return EmpleadoResponse(
            id=emp["id"],
            nombre=emp["nombre"],
            email=emp["email"],
            rol=emp["rol"],
            activo=emp["activo"],
            fecha_creacion=emp.get("fecha_creacion"),
        )

    def create_empleado(self, payload: EmpleadoCreate, db: Optional[Session] = None) -> EmpleadoResponse:
        # 1. Validar correo único
        existente = self.emp_repo.get_by_email(payload.email, db=db)
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El correo '{payload.email}' ya se encuentra registrado por otro empleado."
            )

        # 2. Hashear contraseña
        pwd_hash = hash_password(payload.password)

        # 3. Guardar en repositorio
        nuevo = self.emp_repo.create(
            nombre=payload.nombre,
            email=payload.email,
            password_hash=pwd_hash,
            rol=payload.rol.value,
            activo=payload.activo,
            db=db,
        )

        return EmpleadoResponse(
            id=nuevo["id"],
            nombre=nuevo["nombre"],
            email=nuevo["email"],
            rol=nuevo["rol"],
            activo=nuevo["activo"],
            fecha_creacion=nuevo.get("fecha_creacion"),
        )

    def update_empleado(
        self,
        empleado_id: int,
        payload: EmpleadoUpdate,
        db: Optional[Session] = None,
    ) -> EmpleadoResponse:
        actual = self.emp_repo.get_by_id(empleado_id, db=db)
        if not actual:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Empleado con ID {empleado_id} no encontrado"
            )

        fields: Dict[str, Any] = {}

        # 1. Si actualiza correo, validar que no esté en uso por otro
        if payload.email and payload.email.lower() != actual["email"].lower():
            existente = self.emp_repo.get_by_email(payload.email, db=db)
            if existente and existente["id"] != empleado_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El correo '{payload.email}' ya pertenece a otro empleado."
                )
            fields["email"] = payload.email

        if payload.nombre:
            fields["nombre"] = payload.nombre

        # 2. Regla crítica: Protección del último Administrador activo al cambiar rol o desactivar
        is_currently_admin = (actual["rol"] == "Admin" and actual["activo"] is True)
        will_change_role_away = (payload.rol is not None and payload.rol.value != "Admin")
        will_deactivate = (payload.activo is False)

        if is_currently_admin and (will_change_role_away or will_deactivate):
            active_admins = self.emp_repo.count_active_admins(db=db)
            if active_admins <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Operación denegada: No se puede desactivar ni remover el rol del único Administrador activo del sistema."
                )

        if payload.rol is not None:
            fields["rol"] = payload.rol.value

        if payload.activo is not None:
            fields["activo"] = payload.activo

        if payload.password:
            fields["password_hash"] = hash_password(payload.password)

        if not fields:
            return self.get_empleado(empleado_id, db=db)

        updated = self.emp_repo.update(empleado_id, fields, db=db)
        return EmpleadoResponse(
            id=updated["id"],
            nombre=updated["nombre"],
            email=updated["email"],
            rol=updated["rol"],
            activo=updated["activo"],
            fecha_creacion=updated.get("fecha_creacion"),
        )

    def deactivate_empleado(self, empleado_id: int, db: Optional[Session] = None) -> EmpleadoResponse:
        """
        Desactivación lógica (Soft delete) con protección del último Administrador.
        """
        actual = self.emp_repo.get_by_id(empleado_id, db=db)
        if not actual:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Empleado con ID {empleado_id} no encontrado"
            )

        # Regla crítica: No se puede desactivar al último administrador
        if actual["rol"] == "Admin" and actual["activo"] is True:
            active_admins = self.emp_repo.count_active_admins(db=db)
            if active_admins <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Operación denegada: No se puede desactivar al único Administrador activo del sistema."
                )

        updated = self.emp_repo.deactivate(empleado_id, db=db)
        return EmpleadoResponse(
            id=updated["id"],
            nombre=updated["nombre"],
            email=updated["email"],
            rol=updated["rol"],
            activo=updated["activo"],
            fecha_creacion=updated.get("fecha_creacion"),
        )


empleado_service = EmpleadoService()


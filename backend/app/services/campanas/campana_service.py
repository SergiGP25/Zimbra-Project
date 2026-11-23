from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.db_utils import exigir_db
from app.repositories.campanas.campana_repository import campana_repository
from app.schemas.campanas.campana_schema import CampanaCreate, CampanaListResponse, CampanaResponse, CampanaUpdate


class CampanaService:
    """Campañas de marketing (RF-12, RF-13) y sus resultados (RF-42)."""

    def __init__(self, repo=None):
        self.repo = repo or campana_repository

    def listar(self, db: Optional[Session], canal: Optional[str], solo_vigentes: bool,
               desde=None, hasta=None) -> CampanaListResponse:
        db = exigir_db(db)
        filas = self.repo.listar(db, canal, solo_vigentes, desde, hasta)
        return CampanaListResponse(total=len(filas), campanas=[CampanaResponse(**f) for f in filas])

    def crear(self, datos: CampanaCreate, db: Optional[Session]) -> CampanaResponse:
        db = exigir_db(db)
        nuevo_id = self.repo.crear(db, {**datos.model_dump(), "nombre": datos.nombre.strip()})
        db.commit()
        return CampanaResponse(**self.repo.obtener(db, nuevo_id))

    def editar(self, campana_id: int, datos: CampanaUpdate, db: Optional[Session]) -> CampanaResponse:
        db = exigir_db(db)
        actual = self.repo.obtener(db, campana_id)
        if not actual:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaña no encontrada")
        cambios = datos.model_dump(exclude_unset=True)
        # RN-11 con los valores finales (los que cambian y los que se quedan)
        inicio = cambios.get("fecha_inicio", actual["fecha_inicio"])
        fin = cambios.get("fecha_fin", actual["fecha_fin"])
        if fin and fin < inicio:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "La fecha de fin no puede ser anterior a la fecha de inicio")
        self.repo.actualizar(db, campana_id, cambios)
        db.commit()
        return CampanaResponse(**self.repo.obtener(db, campana_id))


campana_service = CampanaService()

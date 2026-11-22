from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.db_utils import exigir_db
from app.repositories.productos.producto_repository import producto_repository
from app.schemas.productos.producto_schema import (
    ProductoCreate, ProductoListResponse, ProductoResponse, ProductoUpdate,
)


class ProductoService:
    """Catálogo de productos (RF-14 a RF-16). Nunca se borra: se desactiva."""

    def __init__(self, repo=None):
        self.repo = repo or producto_repository

    def listar(self, db: Optional[Session], version: Optional[str], activo: Optional[bool]) -> ProductoListResponse:
        db = exigir_db(db)
        filas = self.repo.listar(db, version, activo)
        return ProductoListResponse(total=len(filas), productos=[ProductoResponse(**f) for f in filas])

    def _obtener_o_404(self, db: Session, producto_id: int) -> dict:
        producto = self.repo.obtener(db, producto_id)
        if not producto:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado")
        return producto

    def crear(self, datos: ProductoCreate, db: Optional[Session]) -> ProductoResponse:
        db = exigir_db(db)
        nuevo_id = self.repo.crear(db, datos.nombre.strip(), datos.version, datos.precio_unitario)
        db.commit()
        return ProductoResponse(**self.repo.obtener(db, nuevo_id))

    def editar(self, producto_id: int, datos: ProductoUpdate, db: Optional[Session]) -> ProductoResponse:
        db = exigir_db(db)
        producto = self._obtener_o_404(db, producto_id)
        cambios = datos.model_dump(exclude_unset=True)
        precio = cambios.get("precio_unitario")
        if precio is not None:
            if producto["version"] == "Gratuita" and precio != 0:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Un producto Gratuito debe tener precio 0")
            if producto["version"] == "Comercial" and precio <= 0:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Un producto Comercial debe tener precio mayor que 0")
        self.repo.actualizar(db, producto_id, cambios)
        db.commit()
        return ProductoResponse(**self.repo.obtener(db, producto_id))

    def cambiar_activo(self, producto_id: int, activo: bool, db: Optional[Session]) -> ProductoResponse:
        # RN-13: no se borra; un producto inactivo no admite nuevas pruebas ni propuestas
        db = exigir_db(db)
        self._obtener_o_404(db, producto_id)
        self.repo.cambiar_activo(db, producto_id, activo)
        db.commit()
        return ProductoResponse(**self.repo.obtener(db, producto_id))


producto_service = ProductoService()

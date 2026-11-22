import logging
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from app.repositories.publico.publico_repository import PublicoRepository, publico_repository
from app.schemas.publico.publico_schema import ProductoGratuito, PruebaRegistrada, SolicitudPrueba

logger = logging.getLogger(__name__)


def _mensaje_para_visitante(error: DBAPIError) -> str:
    """
    Traduce el error de MySQL a un mensaje para el visitante.
    error.orig es la excepción de PyMySQL; sus args son (código, mensaje).
      1644 = error lanzado con SIGNAL en un procedimiento o trigger
      1062 = clave duplicada (UNIQUE)
    El detalle técnico queda en el log del servidor, no en la pantalla (RNF-18).
    """
    args = getattr(error.orig, "args", ())
    codigo = args[0] if len(args) > 0 else None
    texto = str(args[1]) if len(args) > 1 else str(error.orig)
    logger.warning("Error de MySQL al registrar prueba: %s %s", codigo, texto)

    if codigo == 1644 and "RN-03" in texto:
        return "Ya tienes una prueba activa de este producto. Elige otro producto o revisa tu correo."
    if codigo == 1644 and "Descartado" in texto:
        return "No pudimos registrar la prueba con este correo. Escríbenos para revisar tu caso."
    if codigo == 1644 and "Gratuita" in texto:
        return "Ese producto no está disponible para prueba gratuita."
    if codigo == 1062:
        return "Ya recibimos una solicitud con este correo. Intenta de nuevo en unos segundos."
    return "No se pudo registrar la prueba. Intenta de nuevo más tarde."


class PublicoService:
    """
    Reglas del registro público de prueba gratis (sitio web de Zimbra).
    Flujo:
      1. Validar que el producto sea Gratuito y activo.
      2. Si el correo ya es de un prospecto, reutilizarlo (RN-01: correo único).
         Si no existe, crearlo como Nuevo en la campaña Web vigente.
      3. Registrar la descarga con la transacción T1 de la base, que pasa el
         prospecto a En prueba y le suma 20 puntos.
    """

    def __init__(self, repo: Optional[PublicoRepository] = None):
        self.repo = repo or publico_repository

    @staticmethod
    def _exigir_db(db: Optional[Session]) -> Session:
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="El servicio no está disponible en este momento",
            )
        return db

    def listar_productos(self, db: Optional[Session]) -> List[ProductoGratuito]:
        db = self._exigir_db(db)
        return [ProductoGratuito(**p) for p in self.repo.listar_productos_gratuitos(db)]

    def listar_planes(self, db: Optional[Session]):
        db = self._exigir_db(db)
        return [{**p, "precio_unitario": float(p["precio_unitario"])} for p in self.repo.listar_planes(db)]

    def registrar_prueba(self, datos: SolicitudPrueba, db: Optional[Session]) -> PruebaRegistrada:
        db = self._exigir_db(db)

        # 1. Producto válido
        producto = self.repo.obtener_producto(db, datos.producto_id)
        if not producto or producto["version"] != "Gratuita" or not producto["activo"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ese producto no está disponible para prueba gratuita.",
            )

        # 2. ¿El correo ya existe?
        existente = self.repo.buscar_prospecto_por_email(db, datos.email)
        if existente and existente["estado"] == "Cliente":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este correo ya es de un cliente. Tu asesor puede activarte más productos.",
            )

        try:
            if existente:
                prospecto_id = existente["prospecto_id"]
            else:
                campana_id = self.repo.campana_web_vigente(db)
                if campana_id is None:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="El registro está cerrado por ahora. Intenta más tarde.",
                    )
                prospecto_id = self.repo.crear_prospecto(
                    db,
                    nombre=datos.nombre,
                    empresa=datos.empresa,
                    email=datos.email,
                    telefono=datos.telefono,
                    campana_id=campana_id,
                )
                # Se confirma el prospecto antes de llamar T1: el procedimiento
                # abre su propia transacción (START TRANSACTION), y en MySQL eso
                # confirma automáticamente lo que estuviera pendiente.
                # Si T1 falla, el prospecto queda como Nuevo: sigue siendo un
                # contacto válido para Marketing.
                db.commit()

            # 3. Transacción T1 en la base de datos
            descarga_id = self.repo.registrar_descarga(db, prospecto_id, datos.producto_id)
            db.commit()
        except DBAPIError as error:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=_mensaje_para_visitante(error),
            )

        descarga = self.repo.obtener_descarga(db, descarga_id)
        return PruebaRegistrada(
            prospecto_id=prospecto_id,
            descarga_id=descarga_id,
            producto=producto["nombre"],
            fecha_inicio=descarga["fecha_inicio"],
            fecha_fin=descarga["fecha_fin"],
            mensaje=f"Tu prueba de {producto['nombre']} está activa hasta el {descarga['fecha_fin']:%d/%m/%Y}.",
        )


publico_service = PublicoService()

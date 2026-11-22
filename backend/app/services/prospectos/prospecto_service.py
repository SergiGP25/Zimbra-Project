import math
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.db_utils import es_vendedor, exigir_db, llamar_transaccion
from app.repositories.prospectos.prospecto_repository import prospecto_repository
from app.schemas.prospectos.prospecto_schema import (
    AsignacionResponse, FichaResponse, ProspectoCreate, ProspectoListResponse,
    ProspectoOpcion, ProspectoResponse, ProspectoUpdate,
)

# RN-10: a qué estado se puede pasar a mano desde cada uno.
# "Cliente" no aparece como destino: solo lo asigna la venta (T4), así nunca
# existe un Cliente sin venta. "En prueba" normalmente lo pone T1 al descargar.
TRANSICIONES: Dict[str, list] = {
    "Nuevo": ["En prueba", "Descartado"],
    "En prueba": ["Calificado", "Descartado"],
    "Calificado": ["Descartado"],
    "Descartado": ["Nuevo"],   # reactivar
    "Cliente": [],
}


class ProspectoService:
    """Prospectos (RF-05 a RF-11) con control por rol (RN-12)."""

    def __init__(self, repo=None):
        self.repo = repo or prospecto_repository

    # ---------- Ayudantes ----------
    def _respuesta(self, fila: Dict[str, Any]) -> ProspectoResponse:
        return ProspectoResponse(**fila, transiciones_permitidas=TRANSICIONES.get(fila["estado"], []))

    def obtener_con_permiso(self, db: Session, usuario: Dict[str, Any], prospecto_id: int, bloquear: bool = False) -> Dict[str, Any]:
        """RN-12 en un solo lugar: un Vendedor solo accede a sus prospectos."""
        fila = self.repo.obtener(db, prospecto_id, bloquear=bloquear)
        if not fila:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Prospecto no encontrado")
        if es_vendedor(usuario) and fila["empleado_id"] != usuario["id"]:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Este prospecto está asignado a otro vendedor")
        return fila

    # ---------- RF-06: listar ----------
    def listar(self, db: Optional[Session], usuario: Dict[str, Any], filtros: Dict[str, Any],
               orden: str, pagina: int, por_pagina: int) -> ProspectoListResponse:
        db = exigir_db(db)
        if es_vendedor(usuario):
            filtros = {**filtros, "vendedor_id": usuario["id"], "sin_vendedor": False}
        filas, total = self.repo.listar(db, filtros, orden, por_pagina, (pagina - 1) * por_pagina)
        return ProspectoListResponse(
            total=total, pagina=pagina, por_pagina=por_pagina,
            total_paginas=max(1, math.ceil(total / por_pagina)),
            prospectos=[self._respuesta(f) for f in filas],
        )

    def opciones(self, db: Optional[Session], usuario: Dict[str, Any]):
        db = exigir_db(db)
        solo = usuario["id"] if es_vendedor(usuario) else None
        return [ProspectoOpcion(**f) for f in self.repo.opciones(db, solo)]

    def catalogos(self, db: Optional[Session]) -> Dict[str, Any]:
        db = exigir_db(db)
        return {**self.repo.catalogos(db), "estados": list(TRANSICIONES.keys())}

    def obtener(self, db: Optional[Session], usuario: Dict[str, Any], prospecto_id: int) -> ProspectoResponse:
        db = exigir_db(db)
        return self._respuesta(self.obtener_con_permiso(db, usuario, prospecto_id))

    # ---------- RF-05: registrar ----------
    def registrar(self, datos: ProspectoCreate, usuario: Dict[str, Any], db: Optional[Session]) -> ProspectoResponse:
        db = exigir_db(db)
        if self.repo.email_en_uso(db, datos.email):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ese correo ya está registrado en otro prospecto (RN-01)")
        if not self.repo.campana_existe(db, datos.campana_id):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "La campaña indicada no existe (RF-13)")

        empleado_id = datos.empleado_id
        if es_vendedor(usuario):
            empleado_id = usuario["id"]            # el vendedor que registra queda asignado
        elif empleado_id and not self.repo.vendedor_activo(db, empleado_id):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Solo se puede asignar a un Vendedor activo")

        nuevo_id = self.repo.crear(db, {
            "nombre": datos.nombre.strip(), "empresa": (datos.empresa or "").strip() or None,
            "email": datos.email, "telefono": (datos.telefono or "").strip() or None,
            "campana_id": datos.campana_id, "empleado_id": empleado_id,
        })
        db.commit()
        return self._respuesta(self.repo.obtener(db, nuevo_id))

    # ---------- RF-07: editar ----------
    def editar(self, prospecto_id: int, datos: ProspectoUpdate, usuario: Dict[str, Any], db: Optional[Session]) -> ProspectoResponse:
        db = exigir_db(db)
        self.obtener_con_permiso(db, usuario, prospecto_id, bloquear=True)
        cambios = datos.model_dump(exclude_unset=True)
        if "email" in cambios and self.repo.email_en_uso(db, cambios["email"], excepto_id=prospecto_id):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ese correo ya está registrado en otro prospecto (RN-01)")
        if "campana_id" in cambios and not self.repo.campana_existe(db, cambios["campana_id"]):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "La campaña indicada no existe")
        self.repo.actualizar(db, prospecto_id, cambios)
        db.commit()
        return self._respuesta(self.repo.obtener(db, prospecto_id))

    # ---------- RF-08: cambiar estado ----------
    def cambiar_estado(self, prospecto_id: int, nuevo: str, usuario: Dict[str, Any], db: Optional[Session]) -> ProspectoResponse:
        db = exigir_db(db)
        actual = self.obtener_con_permiso(db, usuario, prospecto_id, bloquear=True)
        permitidas = TRANSICIONES.get(actual["estado"], [])
        if nuevo not in permitidas:
            if nuevo == "Cliente":
                motivo = "El estado Cliente se asigna solo al registrar una venta."
            else:
                opciones = ", ".join(permitidas) or "ninguno"
                motivo = f"Desde {actual['estado']} solo se puede pasar a: {opciones}."
            raise HTTPException(status.HTTP_400_BAD_REQUEST, motivo)
        self.repo.cambiar_estado(db, prospecto_id, nuevo)
        db.commit()
        return self._respuesta(self.repo.obtener(db, prospecto_id))

    # ---------- RF-09: asignar (transacción T5) ----------
    def asignar(self, prospecto_id: int, empleado_id: int, db: Optional[Session]) -> AsignacionResponse:
        db = exigir_db(db)
        if not self.repo.obtener(db, prospecto_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Prospecto no encontrado")
        # sp_reasignar_prospecto valida el vendedor, cambia el prospecto y mueve las alertas
        salida = llamar_transaccion(db, "sp_reasignar_prospecto",
                                    {"prospecto": prospecto_id, "vendedor": empleado_id}, salidas=["alertas"])
        return AsignacionResponse(prospecto=self._respuesta(self.repo.obtener(db, prospecto_id)),
                                  alertas_movidas=int(salida.get("alertas") or 0))

    # ---------- RF-10: ficha ----------
    def ficha(self, prospecto_id: int, usuario: Dict[str, Any], db: Optional[Session]) -> FichaResponse:
        db = exigir_db(db)
        fila = self.obtener_con_permiso(db, usuario, prospecto_id)
        return FichaResponse(prospecto=self._respuesta(fila),
                             desglose_puntaje=self.repo.desglose_puntaje(db, prospecto_id),
                             **self.repo.historial(db, prospecto_id))


prospecto_service = ProspectoService()

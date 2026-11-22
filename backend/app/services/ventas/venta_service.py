from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.db_utils import es_vendedor, exigir_db, llamar_transaccion
from app.repositories.ventas.venta_repository import venta_repository
from app.schemas.ventas.venta_schema import VentaCreate


class VentaService:
    """Ventas (RF-36 a RF-39)."""

    def listar(self, db: Optional[Session], usuario: Dict[str, Any], desde, hasta, vendedor_id, estado):
        db = exigir_db(db)
        if es_vendedor(usuario):
            vendedor_id = usuario["id"]
        filas = venta_repository.listar(db, desde, hasta, vendedor_id, estado)
        return {"total": len(filas), "monto_total": float(sum(f["monto_final"] for f in filas)), "ventas": filas}

    def registrar(self, datos: VentaCreate, usuario: Dict[str, Any], db: Optional[Session]) -> Dict[str, Any]:
        db = exigir_db(db)
        responsable = venta_repository.responsable_propuesta(db, datos.propuesta_id)
        if responsable is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Propuesta no encontrada")
        if es_vendedor(usuario) and responsable != usuario["id"]:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo el vendedor responsable puede registrar esta venta")
        db.commit()
        # T4, la transacción crítica: bloquea la propuesta con FOR UPDATE, verifica que esté
        # Aceptada y sin venta, crea la venta, pasa el prospecto a Cliente y la prueba a Convertida.
        salida = llamar_transaccion(db, "sp_registrar_venta", {
            "propuesta": datos.propuesta_id, "forma_pago": datos.forma_pago, "monto": datos.monto_final,
        }, salidas=["venta"])
        return venta_repository.obtener(db, salida["venta"])

    def marcar_pagada(self, venta_id: int, db: Optional[Session]) -> Dict[str, Any]:
        db = exigir_db(db)
        venta = venta_repository.obtener(db, venta_id)
        if not venta:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Venta no encontrada")
        if venta["estado"] == "Pagada":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "La venta ya estaba pagada")
        venta_repository.marcar_pagada(db, venta_id)
        db.commit()
        return venta_repository.obtener(db, venta_id)


venta_service = VentaService()

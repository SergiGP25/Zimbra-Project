from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


class VentaRepository:
    def create(
        self,
        *,
        propuesta_id: int,
        forma_pago: str,
        monto: Optional[float],
        db: Session,
    ) -> Dict[str, Any]:
        try:
            db.execute(text("SET @venta_id = NULL"))
            db.execute(
                text(
                    """
                    CALL sp_registrar_venta(
                        :propuesta_id, :forma_pago, :monto, @venta_id
                    )
                    """
                ),
                {
                    "propuesta_id": propuesta_id,
                    "forma_pago": forma_pago,
                    "monto": monto,
                },
            )
            row = db.execute(text("SELECT @venta_id AS id")).mappings().first()
            db.commit()
            return self.get_by_id(int(row["id"]), db)
        except SQLAlchemyError:
            db.rollback()
            raise

    def get_by_id(self, venta_id: int, db: Session) -> Dict[str, Any]:
        row = db.execute(
            text(
                """
                SELECT v.venta_id AS id, v.propuesta_id,
                       pr.prospecto_id, pr.nombre AS prospecto_nombre,
                       p.empleado_id AS vendedor_id,
                       e.nombre AS vendedor_nombre,
                       v.fecha_venta, v.monto_final, v.forma_pago,
                       v.estado, v.fecha_pago
                FROM venta v
                JOIN propuesta p ON p.propuesta_id = v.propuesta_id
                JOIN prospecto pr ON pr.prospecto_id = p.prospecto_id
                JOIN empleado e ON e.empleado_id = p.empleado_id
                WHERE v.venta_id = :id
                """
            ),
            {"id": venta_id},
        ).mappings().first()
        if not row:
            raise KeyError("Venta no encontrada")
        return dict(row)

    def list_for_user(
        self,
        *,
        user_id: int,
        user_role: str,
        fecha_desde: Optional[str],
        fecha_hasta: Optional[str],
        db: Session,
    ) -> List[Dict[str, Any]]:
        conditions = []
        params: Dict[str, Any] = {}
        if user_role.lower() == "vendedor":
            conditions.append("p.empleado_id = :user_id")
            params["user_id"] = user_id
        if fecha_desde:
            conditions.append("v.fecha_venta >= :fecha_desde")
            params["fecha_desde"] = fecha_desde
        if fecha_hasta:
            conditions.append("v.fecha_venta <= :fecha_hasta")
            params["fecha_hasta"] = fecha_hasta
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        rows = db.execute(
            text(
                f"""
                SELECT v.venta_id AS id, v.propuesta_id,
                       pr.prospecto_id, pr.nombre AS prospecto_nombre,
                       p.empleado_id AS vendedor_id,
                       e.nombre AS vendedor_nombre,
                       v.fecha_venta, v.monto_final, v.forma_pago,
                       v.estado, v.fecha_pago
                FROM venta v
                JOIN propuesta p ON p.propuesta_id = v.propuesta_id
                JOIN prospecto pr ON pr.prospecto_id = p.prospecto_id
                JOIN empleado e ON e.empleado_id = p.empleado_id
                {where}
                ORDER BY v.fecha_venta DESC, v.venta_id DESC
                """
            ),
            params,
        ).mappings().all()
        return [dict(row) for row in rows]

    def list_accepted_proposals(self, db: Session) -> List[Dict[str, Any]]:
        rows = db.execute(
            text(
                """
                SELECT p.propuesta_id AS id, p.prospecto_id,
                       pr.nombre AS prospecto_nombre, p.empleado_id AS vendedor_id,
                       e.nombre AS vendedor_nombre, p.producto_id,
                       prd.nombre AS producto_nombre, p.num_licencias, p.valor_total
                FROM propuesta p
                JOIN prospecto pr ON pr.prospecto_id = p.prospecto_id
                JOIN empleado e ON e.empleado_id = p.empleado_id
                JOIN producto prd ON prd.producto_id = p.producto_id
                LEFT JOIN venta v ON v.propuesta_id = p.propuesta_id
                WHERE p.estado = 'Aceptada' AND v.venta_id IS NULL
                ORDER BY p.propuesta_id DESC
                """
            )
        ).mappings().all()
        return [dict(row) for row in rows]


venta_repository = VentaRepository()

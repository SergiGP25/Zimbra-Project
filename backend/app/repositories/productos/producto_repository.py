from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

# Columnas que se pueden editar (lista blanca contra inyección SQL)
_EDITABLES = {"nombre", "descripcion", "precio_unitario"}


class ProductoRepository:
    def listar(self, db: Session, version: Optional[str], activo: Optional[bool]) -> List[Dict[str, Any]]:
        sql = """
            SELECT pr.producto_id, pr.nombre, pr.descripcion, pr.version, pr.precio_unitario, pr.activo,
                   (SELECT COUNT(*) FROM descarga_prueba d WHERE d.producto_id = pr.producto_id) AS pruebas,
                   (SELECT COUNT(*) FROM propuesta p WHERE p.producto_id = pr.producto_id)       AS propuestas
              FROM producto pr
             WHERE (:version IS NULL OR pr.version = :version)
               AND (:activo IS NULL OR pr.activo = :activo)
             ORDER BY pr.version, pr.nombre
        """
        filas = db.execute(text(sql), {"version": version, "activo": activo}).mappings().all()
        return [dict(f) for f in filas]

    def obtener(self, db: Session, producto_id: int) -> Optional[Dict[str, Any]]:
        fila = db.execute(
            text("SELECT producto_id, nombre, descripcion, version, precio_unitario, activo FROM producto WHERE producto_id = :id"),
            {"id": producto_id},
        ).mappings().first()
        return dict(fila) if fila else None

    def crear(self, db: Session, nombre: str, version: str, precio: float, descripcion: Optional[str] = None) -> int:
        res = db.execute(
            text("INSERT INTO producto (nombre, descripcion, version, precio_unitario, activo) VALUES (:n, :d, :v, :p, TRUE)"),
            {"n": nombre, "d": descripcion, "v": version, "p": precio},
        )
        return res.lastrowid

    def actualizar(self, db: Session, producto_id: int, cambios: Dict[str, Any]) -> None:
        cambios = {k: v for k, v in cambios.items() if k in _EDITABLES}
        if not cambios:
            return
        asignaciones = ", ".join(f"{col} = :{col}" for col in cambios)
        db.execute(text(f"UPDATE producto SET {asignaciones} WHERE producto_id = :id"), {**cambios, "id": producto_id})

    def cambiar_activo(self, db: Session, producto_id: int, activo: bool) -> None:
        db.execute(text("UPDATE producto SET activo = :a WHERE producto_id = :id"), {"a": activo, "id": producto_id})


producto_repository = ProductoRepository()

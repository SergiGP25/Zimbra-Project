"""
Utilidades compartidas para hablar con MySQL.

- llamar_transaccion(): ejecuta un procedimiento almacenado de transacción
  (T1 a T5) y devuelve sus parámetros OUT.
- llamar_reporte(): ejecuta un procedimiento de reporte que devuelve uno o
  varios conjuntos de resultados (SELECT).
- respuesta_error_mysql(): convierte un error de MySQL en un mensaje claro
  para el usuario y un código HTTP. La usa el manejador global de main.py.
"""
import logging
import re
from typing import Any, Dict, List, Optional, Sequence, Tuple

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Prefijos que usan los mensajes de SIGNAL en los scripts SQL: "T4: ", "TR-03: ", "R-01: "
_PREFIJO_SQL = re.compile(r"^(T\d|TR-\d+|R-\d+|Puntaje|Propuesta):\s*")


def exigir_db(db: Optional[Session]) -> Session:
    """get_db() devuelve None si no hay conexión configurada: responder 503."""
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La base de datos no está disponible",
        )
    return db


def llamar_transaccion(
    db: Session,
    procedimiento: str,
    parametros: Dict[str, Any],
    salidas: Sequence[str] = (),
) -> Dict[str, Any]:
    """
    Ejecuta: CALL procedimiento(:p1, :p2, ..., @salida1, @salida2)
    y luego: SELECT @salida1, @salida2

    El procedimiento hace su propio START TRANSACTION, COMMIT o ROLLBACK.
    Las variables @ viven en la conexión de MySQL, por eso el CALL y el
    SELECT deben ejecutarse sin un commit de por medio (misma conexión).
    """
    entradas = ", ".join(f":{nombre}" for nombre in parametros)
    variables = ", ".join(f"@{s}" for s in salidas)
    argumentos = ", ".join(x for x in (entradas, variables) if x)

    db.execute(text(f"CALL {procedimiento}({argumentos})"), parametros)
    resultado: Dict[str, Any] = {}
    if salidas:
        fila = db.execute(text("SELECT " + ", ".join(f"@{s} AS {s}" for s in salidas))).mappings().first()
        resultado = dict(fila) if fila else {}
    db.commit()  # cierra la transacción de SQLAlchemy (el procedimiento ya confirmó la suya)
    return resultado


def llamar_reporte(db: Session, procedimiento: str, parametros: Sequence[Any]) -> List[List[Dict[str, Any]]]:
    """
    Los reportes pueden devolver varios SELECT (por ejemplo R-01 devuelve el
    detalle por vendedor y el total del mes). SQLAlchemy solo lee el primero,
    así que se usa directamente el cursor de PyMySQL y se recorre cada
    conjunto con nextset().
    """
    conexion = db.connection().connection  # conexión DBAPI (PyMySQL)
    cursor = conexion.cursor()
    try:
        marcadores = ", ".join(["%s"] * len(parametros))
        cursor.execute(f"CALL {procedimiento}({marcadores})", tuple(parametros))
        conjuntos: List[List[Dict[str, Any]]] = []
        while True:
            if cursor.description:
                columnas = [c[0] for c in cursor.description]
                conjuntos.append([dict(zip(columnas, fila)) for fila in cursor.fetchall()])
            if not cursor.nextset():
                break
        return conjuntos
    finally:
        cursor.close()


def respuesta_error_mysql(error: Exception) -> Tuple[int, str]:
    """
    Traduce el error de MySQL. error.orig es la excepción de PyMySQL y sus
    args son (código, mensaje).
      1644 SIGNAL de un procedimiento o trigger (regla de negocio)  -> 400
      3819 CHECK violado                                            -> 409
      1062 UNIQUE duplicado                                         -> 409
      1451/1452 llave foránea                                       -> 409
      2003/2006/2013 sin conexión                                   -> 503
    El detalle técnico se registra en el log; el usuario ve un mensaje claro.
    """
    # SQLAlchemy envuelve el error de PyMySQL en .orig; el cursor directo (reportes) no
    original = getattr(error, "orig", None) or error
    args = getattr(original, "args", ())
    codigo = args[0] if len(args) > 0 else None
    mensaje = str(args[1]) if len(args) > 1 else str(original)
    logger.warning("Error MySQL %s: %s", codigo, mensaje)

    if codigo == 1644:
        return status.HTTP_400_BAD_REQUEST, _PREFIJO_SQL.sub("", mensaje)
    if codigo == 3819:
        restriccion = re.search(r"'([^']+)'", mensaje)
        nombre = restriccion.group(1) if restriccion else "una regla de datos"
        return status.HTTP_409_CONFLICT, f"El dato no cumple la regla {nombre}."
    if codigo == 1062:
        return status.HTTP_409_CONFLICT, "Ya existe un registro con ese valor único."
    if codigo in (1451, 1452):
        return status.HTTP_409_CONFLICT, "El registro está relacionado con otros datos y no se puede modificar así."
    if codigo in (2003, 2006, 2013):
        return status.HTTP_503_SERVICE_UNAVAILABLE, "La base de datos no está disponible."
    return status.HTTP_500_INTERNAL_SERVER_ERROR, "Ocurrió un error en la base de datos."


def es_vendedor(usuario: Dict[str, Any]) -> bool:
    return str(usuario.get("rol", "")).lower() == "vendedor"


def es_admin(usuario: Dict[str, Any]) -> bool:
    return str(usuario.get("rol", "")).lower() == "admin"

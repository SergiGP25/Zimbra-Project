"""
Simulación de concurrencia contra la API (Sesión 4).

Cómo ejecutarlo (con docker compose levantado):
    docker compose exec backend python scripts/simular_concurrencia.py
    (o, local: python scripts/simular_concurrencia.py)

Escenario 1: 10 vendedores intentan registrar AL MISMO TIEMPO la venta de la
             misma propuesta Aceptada. Debe ganar exactamente una (T4 con
             SELECT ... FOR UPDATE + UNIQUE) y las otras 9 reciben el error.
Escenario 2: 20 visitas simultáneas al mismo prospecto. El puntaje final debe
             ser el inicial + la suma de las visitas aceptadas (sin
             "actualizaciones perdidas"), gracias al bloqueo de fila.

Crea datos nuevos (un prospecto y una propuesta) con correo único.
"""
import sys
import time
from concurrent.futures import ThreadPoolExecutor

import requests

API = "http://localhost:8000/api/v1"
CLAVE = "Zimbra2026*"
resultados = []


def entrar(correo):
    r = requests.post(f"{API}/auth/login", json={"email": correo, "password": CLAVE}, timeout=15)
    r.raise_for_status()
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def verificar(texto, condicion):
    print(f"  {'OK   ' if condicion else 'FALLA'} {texto}")
    resultados.append(bool(condicion))


def en_paralelo(funcion, veces):
    """Lanza 'funcion' en varios hilos a la vez (una barrera simple con tiempo de arranque común)."""
    arranque = time.time() + 0.5

    def tarea(i):
        time.sleep(max(0, arranque - time.time()))
        return funcion(i)

    with ThreadPoolExecutor(max_workers=veces) as pool:
        return list(pool.map(tarea, range(veces)))


def main():
    admin = entrar("camila.rojas1@zimbra-demo.com")
    marketing = entrar("valentina.bermudez3@zimbra-demo.com")
    vendedor = entrar("carlos.salazar6@zimbra-demo.com")

    comercial = requests.get(f"{API}/productos/?version=Comercial&activo=true", headers=admin, timeout=15).json()["productos"][0]["producto_id"]
    correo = f"concurrencia{int(time.time())}@demo.com"
    p = requests.post(f"{API}/prospectos/", headers=marketing, timeout=15, json={
        "nombre": "Prueba concurrencia", "email": correo, "campana_id": 1, "empleado_id": 6})
    p.raise_for_status()
    pid = p.json()["prospecto_id"]

    print("\nEscenario 1: 10 ventas simultáneas de la misma propuesta (T4)")
    prop = requests.post(f"{API}/propuestas/", headers=vendedor, timeout=15,
                         json={"prospecto_id": pid, "producto_id": comercial, "num_licencias": 5}).json()
    requests.patch(f"{API}/propuestas/{prop['propuesta_id']}/estado", headers=vendedor, json={"estado": "Aceptada"}, timeout=15).raise_for_status()
    respuestas = en_paralelo(lambda i: requests.post(f"{API}/ventas/", headers=vendedor, timeout=30,
                                                     json={"propuesta_id": prop["propuesta_id"], "forma_pago": "Transferencia"}), 10)
    codigos = sorted(r.status_code for r in respuestas)
    print(f"     códigos HTTP: {codigos}")
    verificar("exactamente 1 venta creada (201)", codigos.count(201) == 1)
    verificar("las otras 9 fueron rechazadas por regla de negocio (400) o bloqueo (409)", all(c in (400, 409) for c in codigos if c != 201))
    ventas = requests.get(f"{API}/ventas/", headers=admin, timeout=15).json()["ventas"]
    verificar("en la base solo existe una venta para esa propuesta",
              sum(1 for v in ventas if v.get("propuesta_id") == prop["propuesta_id"]) == 1)

    print("\nEscenario 2: 20 visitas simultáneas al mismo prospecto (puntaje)")
    antes = requests.get(f"{API}/prospectos/{pid}", headers=admin, timeout=15).json()["puntaje"]
    resp = en_paralelo(lambda i: requests.post(f"{API}/visitas/", headers=marketing, timeout=60, json={
        "prospecto_id": pid, "pagina_visitada": "/caracteristicas", "duracion_segundos": 10}), 20)
    aceptadas = sum(1 for r in resp if r.status_code == 201)
    despues = requests.get(f"{API}/prospectos/{pid}", headers=admin, timeout=15).json()["puntaje"]
    print(f"     visitas aceptadas: {aceptadas}; puntaje {antes} -> {despues} (esperado {antes + 5 * aceptadas})")
    verificar("no se perdió ninguna actualización de puntaje", despues == antes + 5 * aceptadas)
    verificar("ninguna visita terminó en error 500", all(r.status_code != 500 for r in resp))

    total, buenos = len(resultados), sum(resultados)
    print(f"\nResultado: {buenos} de {total} comprobaciones correctas.")
    sys.exit(0 if buenos == total else 1)


if __name__ == "__main__":
    main()

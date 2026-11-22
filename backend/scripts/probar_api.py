"""
Prueba de punta a punta de la API del CRM Zimbra.

Cómo ejecutarlo (con docker compose levantado):
    docker compose exec backend python scripts/probar_api.py

Recorre el proceso comercial completo: registra un prospecto, le da una
prueba (T1), simula visitas (T2), registra una llamada (T3), crea y acepta
una propuesta (trigger TR-02), registra la venta (T4), la marca pagada y
consulta los reportes. También provoca errores esperados (RN-01, RN-03,
RN-07, RN-09, RN-12) para comprobar que el sistema los rechaza.

Cada línea muestra OK o FALLA. Al final, el total.
Ojo: crea datos nuevos en la base (un prospecto con correo único por ejecución).
"""
import sys
import time

import requests

API = "http://localhost:8000/api/v1"
CLAVE = "Zimbra2026*"
resultados = []


def revisar(nombre, respuesta, esperado):
    ok = respuesta.status_code == esperado
    detalle = ""
    if not ok:
        try:
            detalle = f" -> {respuesta.status_code}: {respuesta.json().get('detail')}"
        except Exception:
            detalle = f" -> {respuesta.status_code}"
    print(f"  {'OK   ' if ok else 'FALLA'} {nombre}{detalle}")
    resultados.append(ok)
    return respuesta.json() if respuesta.content else None


def entrar(correo):
    r = requests.post(f"{API}/auth/login", json={"email": correo, "password": CLAVE})
    revisar(f"login {correo}", r, 200)
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def main():
    print("\n1. Conexión")
    salud = revisar("GET /health", requests.get(f"{API}/health"), 200)
    print(f"     base: {salud.get('database_status')}, triggers: {salud.get('triggers')}, procedimientos: {salud.get('procedimientos')}")

    admin = entrar("camila.rojas1@zimbra-demo.com")
    marketing = entrar("valentina.bermudez3@zimbra-demo.com")
    vendedor = entrar("carlos.salazar6@zimbra-demo.com")

    print("\n2. Consultas de cada módulo (Admin)")
    for ruta in ["/productos/", "/campanas/", "/prospectos/", "/prospectos/catalogos", "/pruebas/", "/visitas/",
                 "/alertas/", "/interacciones/", "/propuestas/", "/ventas/", "/reportes/panel",
                 "/reportes/resumen-anual?anio=2026", "/reportes/ventas-mensual?anio=2026&mes=6",
                 "/reportes/conversion", "/reportes/campanas", "/reportes/embudo", "/reportes/tasa-cierre"]:
        revisar(f"GET {ruta}", requests.get(API + ruta, headers=admin), 200)

    print("\n3. Permisos por rol (RN-12, HU-04)")
    revisar("Vendedor no puede ver empleados", requests.get(f"{API}/empleados/", headers=vendedor), 403)
    revisar("Vendedor no puede ver reportes de gerencia", requests.get(f"{API}/reportes/campanas", headers=vendedor), 403)
    lista = requests.get(f"{API}/prospectos/?por_pagina=100", headers=vendedor).json()["prospectos"]
    print(f"     el vendedor 6 ve {len(lista)} prospectos; todos suyos: {all(p['empleado_id'] == 6 for p in lista)}")
    resultados.append(all(p["empleado_id"] == 6 for p in lista))

    print("\n4. Proceso comercial completo")
    correo = f"prueba{int(time.time())}@demo.com"
    p = revisar("Registrar prospecto (RF-05)", requests.post(f"{API}/prospectos/", headers=marketing, json={
        "nombre": "Prospecto de prueba", "empresa": "Demo SAS", "email": correo, "campana_id": 1, "empleado_id": 6}), 201)
    pid = p["prospecto_id"]
    revisar("Correo repetido rechazado (RN-01)", requests.post(f"{API}/prospectos/", headers=marketing, json={
        "nombre": "Otro", "email": correo, "campana_id": 1}), 400)

    gratis = requests.get(f"{API}/productos/?version=Gratuita&activo=true", headers=admin).json()["productos"][0]["producto_id"]
    comercial = requests.get(f"{API}/productos/?version=Comercial&activo=true", headers=admin).json()["productos"][0]["producto_id"]

    revisar("T1 descarga de prueba", requests.post(f"{API}/pruebas/", headers=vendedor,
                                                   json={"prospecto_id": pid, "producto_id": gratis}), 201)
    revisar("T1 repetida rechazada (RN-03)", requests.post(f"{API}/pruebas/", headers=vendedor,
                                                           json={"prospecto_id": pid, "producto_id": gratis}), 400)
    for pagina in ["/precios", "/precios", "/caracteristicas"]:
        v = revisar(f"T2 visita {pagina}", requests.post(f"{API}/visitas/", headers=marketing, json={
            "prospecto_id": pid, "pagina_visitada": pagina, "duracion_segundos": 90}), 201)
    print(f"     puntaje {v.get('puntaje')} (20 + 15 + 15 + 5 = 55), estado {v.get('estado')}, alerta {v.get('alerta_generada')}")
    resultados.append(v.get("puntaje") == 55 and v.get("estado") == "Calificado")

    revisar("T3 llamada positiva", requests.post(f"{API}/interacciones/", headers=vendedor, json={
        "prospecto_id": pid, "tipo": "Llamada", "resultado": "Positivo", "notas": "Quiere 10 licencias"}), 201)

    revisar("Propuesta con producto Gratuito rechazada (RN-07)", requests.post(f"{API}/propuestas/", headers=vendedor, json={
        "prospecto_id": pid, "producto_id": gratis, "num_licencias": 10}), 400)
    prop = revisar("Crear propuesta (el trigger calcula el valor)", requests.post(f"{API}/propuestas/", headers=vendedor, json={
        "prospecto_id": pid, "producto_id": comercial, "num_licencias": 10}), 201)
    print(f"     valor_total {prop['valor_total']} = 10 x {prop['precio_unitario']}, estado {prop['estado']}")
    revisar("Venta de propuesta Enviada rechazada (RN-09)", requests.post(f"{API}/ventas/", headers=vendedor, json={
        "propuesta_id": prop["propuesta_id"], "forma_pago": "Transferencia"}), 400)
    revisar("Aceptar propuesta", requests.patch(f"{API}/propuestas/{prop['propuesta_id']}/estado", headers=vendedor,
                                                json={"estado": "Aceptada"}), 200)
    venta = revisar("T4 registrar venta", requests.post(f"{API}/ventas/", headers=vendedor, json={
        "propuesta_id": prop["propuesta_id"], "forma_pago": "Transferencia"}), 201)
    revisar("T4 segunda venta rechazada", requests.post(f"{API}/ventas/", headers=vendedor, json={
        "propuesta_id": prop["propuesta_id"], "forma_pago": "Tarjeta"}), 400)
    revisar("Marcar pagada (Admin)", requests.patch(f"{API}/ventas/{venta['venta_id']}/pagar", headers=admin), 200)

    ficha = revisar("Ficha del prospecto (RF-10)", requests.get(f"{API}/prospectos/{pid}/ficha", headers=admin), 200)
    print(f"     estado final {ficha['prospecto']['estado']}, prueba {ficha['pruebas'][0]['estado']}, "
          f"{len(ficha['visitas'])} visitas, {len(ficha['ventas'])} venta")
    resultados.append(ficha["prospecto"]["estado"] == "Cliente" and ficha["pruebas"][0]["estado"] == "Convertida")

    print("\n5. Otras reglas")
    revisar("Un Cliente no cambia de estado a mano (RN-10)", requests.patch(f"{API}/prospectos/{pid}/estado", headers=admin,
                                                                 json={"estado": "Nuevo"}), 400)
    revisar("Asignar a vendedor inactivo rechazado", requests.patch(f"{API}/prospectos/{pid}/asignar", headers=admin,
                                                                    json={"empleado_id": 29}), 400)
    revisar("Vencer pruebas (savepoint)", requests.post(f"{API}/pruebas/vencer", headers=admin), 200)

    total, buenos = len(resultados), sum(resultados)
    print(f"\nResultado: {buenos} de {total} comprobaciones correctas.")
    sys.exit(0 if buenos == total else 1)


if __name__ == "__main__":
    main()

"""
Pruebas automatizadas de la API (HU-43, HU-44, RNF-06, RNF-09, RNF-12, RNF-18).

Se ejecutan contra la API real con la base cargada (docker compose up -d):
    cd backend
    pip install -r requirements-dev.txt
    pytest -v
Variable opcional: API_URL (por defecto http://localhost:8000/api/v1).
Si la API no responde, las pruebas se omiten (skip) en lugar de fallar.
Las pruebas de este archivo no modifican datos: solo consultan y provocan
errores que deben ser rechazados (todo falla sin cambiar nada).
Para el recorrido completo que SI crea datos, usar scripts/probar_api.py.
"""
import os

import pytest
import requests

API = os.getenv("API_URL", "http://localhost:8000/api/v1")
CLAVE = "Zimbra2026*"
ADMIN = "camila.rojas1@zimbra-demo.com"
MARKETING = "valentina.bermudez3@zimbra-demo.com"
VENDEDOR = "carlos.salazar6@zimbra-demo.com"  # empleado 6


def _disponible():
    try:
        return requests.get(f"{API}/health", timeout=3).status_code == 200
    except requests.RequestException:
        return False


pytestmark = pytest.mark.skipif(not _disponible(), reason="API o base de datos no disponible")


def _entrar(correo):
    r = requests.post(f"{API}/auth/login", json={"email": correo, "password": CLAVE}, timeout=10)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def admin():
    return _entrar(ADMIN)


@pytest.fixture(scope="module")
def marketing():
    return _entrar(MARKETING)


@pytest.fixture(scope="module")
def vendedor():
    return _entrar(VENDEDOR)


def _total_ventas(h):
    return requests.get(f"{API}/ventas/", headers=h, timeout=10).json()["total"]


# --- HT-01 conexión -------------------------------------------------------
def test_health_conectada():
    d = requests.get(f"{API}/health", timeout=5).json()
    assert d["database_status"] == "conectada"
    assert d["empleados_cargados"] >= 30
    assert d["triggers"] >= 8
    assert d["procedimientos"] >= 14


# --- HU-01 / HT-02 autenticación -----------------------------------------
def test_login_incorrecto_mensaje_generico():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN, "password": "mala"}, timeout=5)
    assert r.status_code == 401
    assert "incorrectos" in r.json()["detail"]


def test_ruta_protegida_sin_token():
    assert requests.get(f"{API}/prospectos/", timeout=5).status_code in (401, 403)


# --- HU-04 / RNF-06 permisos por rol -------------------------------------
@pytest.mark.parametrize("ruta", ["/empleados/", "/reportes/campanas", "/reportes/embudo"])
def test_vendedor_no_accede_a_modulos_de_gestion(vendedor, ruta):
    assert requests.get(API + ruta, headers=vendedor, timeout=10).status_code == 403


def test_marketing_no_accede_a_empleados(marketing):
    assert requests.get(f"{API}/empleados/", headers=marketing, timeout=10).status_code == 403


def test_vendedor_solo_ve_sus_prospectos_rn12(vendedor):
    lista = requests.get(f"{API}/prospectos/?por_pagina=100", headers=vendedor, timeout=10).json()["prospectos"]
    assert lista and all(p["empleado_id"] == 6 for p in lista)


def test_admin_ve_todos_los_prospectos(admin):
    d = requests.get(f"{API}/prospectos/?por_pagina=100", headers=admin, timeout=10).json()
    assert d["total"] >= 60


# --- Reglas transaccionales: todo debe fallar sin cambiar datos ----------
def test_t4_propuesta_enviada_rechazada_e1(admin):
    antes = _total_ventas(admin)
    r = requests.post(f"{API}/ventas/", headers=admin, json={"propuesta_id": 33, "forma_pago": "Efectivo"}, timeout=10)
    assert r.status_code == 400 and "Aceptada" in r.json()["detail"]
    assert _total_ventas(admin) == antes


def test_t4_segunda_venta_rechazada_e2(admin):
    antes = _total_ventas(admin)
    r = requests.post(f"{API}/ventas/", headers=admin, json={"propuesta_id": 1, "forma_pago": "Efectivo"}, timeout=10)
    assert r.status_code == 400 and "ya tiene una venta" in r.json()["detail"]
    assert _total_ventas(admin) == antes


def test_t1_producto_comercial_rechazado_e3(admin):
    prod = requests.get(f"{API}/productos/?version=Comercial&activo=true", headers=admin, timeout=10).json()["productos"][0]
    r = requests.post(f"{API}/pruebas/", headers=admin,
                      json={"prospecto_id": 21, "producto_id": prod["producto_id"]}, timeout=10)
    assert r.status_code == 400


def test_t5_vendedor_inactivo_rechazado_e7(admin):
    r = requests.patch(f"{API}/prospectos/19/asignar", headers=admin, json={"empleado_id": 29}, timeout=10)
    assert r.status_code == 400


def test_propuesta_aceptada_no_se_reabre_e6(admin):
    r = requests.patch(f"{API}/propuestas/1/estado", headers=admin, json={"estado": "Enviada"}, timeout=10)
    assert r.status_code in (400, 422)


def test_prospecto_correo_duplicado_rn01(marketing):
    r = requests.post(f"{API}/prospectos/", headers=marketing, json={
        "nombre": "Duplicado", "email": "camila.quintero1@inversionesboyaca.com", "campana_id": 1}, timeout=10)
    assert r.status_code in (400, 409)


# --- Reportes (R-01 a R-06) ----------------------------------------------
def test_reporte_mes_invalido_r01(admin):
    r = requests.get(f"{API}/reportes/ventas-mensual?anio=2026&mes=13", headers=admin, timeout=10)
    assert r.status_code in (400, 422)


@pytest.mark.parametrize("ruta", [
    "/reportes/panel", "/reportes/resumen-anual?anio=2026", "/reportes/ventas-mensual?anio=2026&mes=6",
    "/reportes/conversion", "/reportes/campanas", "/reportes/embudo", "/reportes/tasa-cierre"])
def test_reportes_responden(admin, ruta):
    assert requests.get(API + ruta, headers=admin, timeout=15).status_code == 200


def test_reporte_sin_datos_no_falla_nullif(admin):
    r = requests.get(f"{API}/reportes/conversion?desde=1990-01-01&hasta=1990-01-31", headers=admin, timeout=15)
    assert r.status_code == 200

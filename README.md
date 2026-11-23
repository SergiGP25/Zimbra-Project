# CRM Zimbra · Sistemas Transaccionales

Sistema transaccional de prospectos, marketing y ventas basado en el caso Zimbra: un visitante se registra y activa una prueba gratuita de 60 días; sus visitas suben un puntaje; al llegar a 50 puntos queda *Calificado* y su vendedor recibe una alerta; el vendedor registra llamadas, envía una propuesta y, si la aceptan, registra la venta. Todo el proceso corre sobre transacciones ACID en MySQL.

| Capa | Tecnología |
| --- | --- |
| Base de datos | MySQL 8.0: 11 tablas, 8 triggers, 5 transacciones críticas (T1 a T5), 6 reportes, 8 vistas, índices, roles y un evento diario |
| Backend | Python 3.12, FastAPI, SQLAlchemy, JWT (sesión de 30 minutos), bcrypt |
| Frontend | React 18, Vite, TypeScript, tema claro y oscuro |
| Correos | Mailpit en local; Brevo (API HTTPS) en la nube |
| Moneda | Pesos colombianos (COP) en precios, presupuestos, propuestas y ventas |

---

## Arranque rápido (Docker)

Requisito: Docker Desktop abierto.

```bash
cp .env.example .env          # solo la primera vez
docker compose up --build
```

| Qué | Dónde |
| --- | --- |
| Sitio público y CRM | http://localhost:5174 (inicio de sesión en `/login`) |
| API y documentación Swagger | http://localhost:8000/docs |
| Estado de la API y la base | http://localhost:8000/api/v1/health |
| Bandeja de correos de prueba (Mailpit) | http://localhost:8025 |
| MySQL desde tu PC | `localhost:3307`, usuario `root`, sin contraseña |

La primera vez MySQL ejecuta solo los scripts `DB/01` a `DB/13` (tablas, datos, triggers, procedimientos, reportes, vistas, índices, roles, datos demo y evento). Para empezar de cero: `docker compose down -v` y de nuevo `docker compose up --build`, o `.\DB\herramientas\reiniciar_demo.ps1`.

### Usuarios de prueba

Usuarios del equipo (`DB/13_usuarios_equipo.sql`):

| Correo | Contraseña | Rol |
| --- | --- | --- |
| `admin@zimbra.com` | `Admin123` | Admin |
| `marketing@zimbra.com` | `Mark123` | Marketing |
| `ventas@zimbra.com` | `Vent123` | Vendedor |
| `andres@zimbra.com`, `sergio@zimbra.com`, `juan@zimbra.com` | `admin123` | Admin |

Empleados de ejemplo con datos cargados; todos usan la contraseña `Zimbra2026*`:

| Rol | Correo | Ve |
| --- | --- | --- |
| Admin | `camila.rojas1@zimbra-demo.com` | Todo, más empleados y productos |
| Marketing | `valentina.bermudez3@zimbra-demo.com` | Prospectos, campañas, visitas y reportes |
| Vendedor | `carlos.salazar6@zimbra-demo.com` | Solo sus prospectos (RN-12) |

### Diseñar sin reconstruir

`docker compose up --build` copia el código dentro de la imagen, así que cada cambio de diseño obliga a reconstruir. Para ver los cambios al guardar:

```bash
docker compose up -d db backend mailpit
cd frontend
npm install
npm run dev        # http://localhost:5173, se actualiza al guardar
```

---

## Estructura

```text
Zimbra-Project/
├── DB/
│   ├── 01_crear_tablas.sql ... 13_usuarios_equipo.sql      # Docker los ejecuta en orden
│   ├── herramientas/      # aplicar_datos_demo y reiniciar_demo (fuera de la raíz a propósito)
│   ├── pruebas/           # 08 ACID, 09 carga 10 000, 10 EXPLAIN, 11 concurrencia, 12 permisos
│   └── respaldo/          # respaldo y restauración (RNF-13)
├── backend/app/
│   ├── api/v1/            # un router por módulo: auth, empleados, prospectos, campanas, productos,
│   │                      # pruebas, visitas, alertas, interacciones, propuestas, ventas, reportes, publico
│   ├── schemas/           # validación de entrada y salida (Pydantic)
│   ├── services/          # reglas de negocio; notificaciones/ arma y envía los correos
│   ├── repositories/      # consultas SQL parametrizadas
│   └── core/              # configuración, seguridad (JWT, bcrypt), correo, utilidades de BD
├── frontend/src/
│   ├── pages/             # LandingPage, LoginPage (login, recuperar, restablecer) y pages/app/*
│   ├── components/        # layout, landing, auth, crm (formularios), ui (piezas comunes)
│   ├── services/          # llamadas a la API
│   ├── lib/               # formato (COP, fechas), roles, useCarga
│   └── index.css          # paleta y temas claro/oscuro
├── despliegue/            # Dockerfiles de producción para Railway
├── docs/                  # guía, manual, guion, despliegue, informe final
└── docker-compose.yml     # db, backend, frontend y mailpit
```

El recorrido de una petición y la explicación de cada módulo están en [docs/GUIA_PROYECTO.md](docs/GUIA_PROYECTO.md).

---

## Correos

| Cuándo | A quién |
| --- | --- |
| Un visitante se registra desde el sitio | Bienvenida al visitante |
| Se activa una prueba (sitio público o desde el CRM) | Datos de la prueba y el enlace a su página «Mi prueba» (sin contraseña) |
| "¿Olvidaste tu contraseña?" en `/login` | Enlace para crear una nueva (vence en 30 minutos y sirve una vez) |
| Se cambia o restablece una contraseña | Aviso de seguridad al dueño de la cuenta |

En local todos llegan a Mailpit (http://localhost:8025); nadie recibe correos reales. Los correos salen en segundo plano: si el envío falla, la operación ya quedó guardada en la base. Configuración en `backend/app/core/correo.py` y en las variables `CORREO_*` de `.env.example`.

---

## Pruebas

```bash
docker compose exec backend python scripts/probar_api.py             # recorrido completo
docker compose exec backend python scripts/simular_concurrencia.py   # ventas y visitas simultáneas
cd backend && pip install -r requirements-dev.txt && pytest -v      # pruebas automáticas
```

SQL en `DB/pruebas/`: `08` (ACID), `09` (carga de 10 000 prospectos), `10` (EXPLAIN), `11` (concurrencia en dos terminales), `12` (permisos). Respaldo: `.\DB\respaldo\respaldo.ps1` y `restaurar.ps1`.

---

## Despliegue

Paso a paso para publicar el sistema en Railway: [docs/DESPLIEGUE_RAILWAY.md](docs/DESPLIEGUE_RAILWAY.md).

## Documentación

- [Requerimientos](REQUIREMENTS.md) · [Backlog](BACKLOG.md)
- [Guía del proyecto](docs/GUIA_PROYECTO.md) · [Manual de usuario](docs/MANUAL_USUARIO.md) · [Datos demo](docs/DATOS_DEMO.md)
- [Guion de demostración](docs/GUION_DEMOSTRACION.md) · [Sustentación oral](docs/ORAL_PRESENTATION_13MIN.md) · [Alineación con el informe](docs/ALINEACION_ENTREGAS.md)
- [Informe final (APA)](docs/Final_Report_Zimbra_CRM.docx)

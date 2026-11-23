# Proyecto CRM Zimbra - Sistemas Transaccionales

Sistema transaccional de prospectos, marketing y ventas construido con arquitectura limpia por capas y desacoplada:
- **Base de Datos**: MySQL 8.0 orquestado mediante **Docker Compose** en el puerto `3307` con carga de esquema e integridad referencial (`DB/`).
- **Backend**: API REST desarrollada en **Python** con **FastAPI**, **SQLAlchemy** y autenticación **JWT** con expiración a 30 minutos (cumpliendo principios SOLID).
- **Frontend**: SPA desarrollada en **React 18**, **Vite** y **TypeScript** con control de acceso por rol (RBAC) y detector de inactividad.

---

## 📂 Estructura del Repositorio (Clean Architecture por Módulos)

```text
Zimbra-Project/
├── DB/                               # Scripts SQL de base de datos
│   ├── 01_crear_tablas.sql           # 11 tablas, restricciones, columnas generadas e índices
│   ├── 02_insertar_datos.sql         # Datos simulados (30+ registros por tabla)
│   ├── 03_verificacion.sql           # Consultas de auditoría e integridad
│   ├── 04_create_admin_user.sql      # Usuario MySQL del taller (eliminar en producción)
│   ├── 05_triggers.sql               # 8 triggers (TR-01 a TR-08)
│   ├── 06_transacciones.sql          # T1 a T5, SAVEPOINT, vencimiento de pruebas
│   ├── 07_reportes.sql               # Reportes R-01 a R-06
│   ├── 08_vistas.sql                 # 8 vistas para reportes simplificados
│   ├── 09_indices.sql                # 10 índices adicionales
│   ├── 10_roles_permisos.sql         # Roles y usuarios de MySQL (mínimo privilegio)
│   ├── 11_datos_demo.sql             # Datos demo relativos a la fecha de hoy (idempotente)
│   ├── herramientas/                 # aplicar_datos_demo.ps1/.sh y reiniciar_demo.ps1 (fuera de la raiz: Docker ejecuta todo lo que hay en DB/)
│   ├── pruebas/                      # 08 a 12 (ACID, carga, EXPLAIN, concurrencia, permisos); no se ejecutan solos
│   └── respaldo/                     # respaldo y restauración (RNF-13)
├── docker-compose.yml                # Contenedor MySQL 8.0 en puerto 3307
│
├── backend/                          # Backend (FastAPI + Python)
│   ├── app/
│   │   ├── api/v1/                   # Controladores y endpoints HTTP por módulo
│   │   │   ├── auth/auth_router.py   # HU-01: Login, me, logout
│   │   │   ├── empleados/            # HU-03: CRUD Empleados exclusivo para Admin
│   │   │   ├── prospectos/           # HU-04: Listado con filtro por rol (RN-12)
│   │   │   ├── health/               # Endpoint de salud del servicio
│   │   │   ├── dependencies.py       # RBAC (require_roles -> 403 Forbidden)
│   │   │   └── router.py             # Enrutador consolidado v1
│   │   ├── core/                     # Configuración (JWT, MySQL, CORS) y seguridad
│   │   ├── schemas/                  # DTOs y validaciones Pydantic por módulo
│   │   ├── services/                 # Lógica de negocio y reglas por módulo
│   │   └── repositories/             # Persistencia directa con SQLAlchemy por módulo
│   ├── requirements.txt              # Dependencias de Python
│   ├── .env.example / .env           # Variables de entorno
│   └── main.py                       # Lanzador local
│
├── frontend/                         # Frontend (React 18 + Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                 # LoginForm, ProtectedRoute (403 Forbidden)
│   │   │   ├── layout/               # Navbar (botón logout), Sidebar (menú dinámico por rol)
│   │   │   ├── empleados/            # EmpleadoList, EmpleadoModal
│   │   │   └── prospectos/           # ProspectoList con banner explicativo RN-12
│   │   ├── context/auth/             # Contexto global de autenticación y token
│   │   ├── hooks/auth/               # useAuth, useInactivityTimer (30 minutos)
│   │   ├── pages/                    # LoginPage, DashboardPage, EmpleadosPage, ProspectosPage
│   │   ├── services/                 # Clientes API tipados hacia FastAPI
│   │   └── types/                    # Interfaces de TypeScript por módulo
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```

---

## ⚡ Guía de Despliegue y Ejecución

### Variables de entorno

Crea los archivos de entorno antes del arranque:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

- `.env`: configuración usada por Docker Compose para el backend dentro de la red de contenedores.
- `backend/.env`: configuración para ejecutar el backend localmente; usa `DB_HOST=localhost` y `DB_PORT=3307`.
- `frontend/.env`: URL pública de la API.

Para Docker, el `.env` de la raíz ya configura `DB_HOST=db` y `DB_PORT=3306`. No debe apuntar a `localhost`, porque el backend se ejecuta dentro de su propio contenedor.

### 1. Levantar la Base de Datos con Docker Compose

En la raíz del proyecto:

```bash
docker compose up -d
```

- **Contenedor:** `zimbra_mysql` (MySQL 8.0).
- **Puerto expuesto en el host:** **`3307`** (para evitar colisiones con instancias locales en `3306`).
- **Base de datos:** `crm_zimbra`.
- **Usuario:** `root` | **Contraseña:** *(sin contraseña)*.
- **Frontend en Docker Compose:** [http://localhost:5174](http://localhost:5174) (el contenedor escucha en el puerto `5173`).

Verificar estado del contenedor:
```bash
docker compose ps
```

---

### 2. Iniciar el Backend (FastAPI)

En una terminal:

```bash
cd backend

# 1. Crear y activar el entorno virtual
python3 -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Iniciar el servidor
uvicorn app.main:app --reload --port 8000
```

- **Documentación Swagger interactiva:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Healthcheck:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 3. Iniciar el Frontend (React + Vite + TypeScript)

En otra terminal:

```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```

- **Aplicación web:** [http://localhost:5173](http://localhost:5173)

---

## 🔐 Credenciales del Administrador de Prueba

El usuario administrador se encuentra creado directamente en la base de datos MySQL:

| Campo | Valor |
| :--- | :--- |
| **Correo Electrónico** | `camila.rojas1@zimbra-demo.com` |
| **Contraseña** | `Zimbra2026*` |
| **Rol** | `Admin` |

---

## 🎯 Cobertura de la Épica EP-01 · Autenticación y Usuarios

- **HU-01 — Iniciar sesión (RF-01):** Hashing seguro con `bcrypt`, generación de JWT y mensajes genéricos de error. Rechazo de empleados inactivos.
- **HU-02 — Cerrar sesión y expiración (RF-02):** Botón visible en el `Navbar`. Detector de inactividad que expira la sesión a los 30 minutos continuos sin eventos del usuario y redirige al login.
- **HU-03 — Gestionar empleados (RF-03):** Módulo exclusivo para `Admin`. Creación, edición, listado con filtros y soft delete (`activo = FALSE`). **Regla crítica:** El sistema bloquea con HTTP 400 cualquier intento de desactivar o cambiar el rol del último Administrador activo.
- **HU-04 — Control de acceso por rol (RF-04, RN-12):** Menú lateral dinámico según rol, rechazo de accesos no autorizados con **HTTP 403 Forbidden**. El rol `Vendedor` únicamente ve sus prospectos asignados (`empleado_id`), mientras que `Marketing` y `Admin` tienen visibilidad global.

---

## Pruebas

```bash
cd backend && pip install -r requirements-dev.txt && pytest -v     # API (HU-43/44)
docker compose exec backend python scripts/probar_api.py          # recorrido completo
```
SQL: `DB/pruebas/08` (ACID), `09` (carga 10 000), `10` (EXPLAIN), `11` (concurrencia, 2 terminales), `12` (permisos).
Concurrencia contra la API: `docker compose exec backend python scripts/simular_concurrencia.py`.
Respaldo: `.\DBespaldoespaldo.ps1` y `restaurar.ps1` (o los `.sh`).

## Documentación del Proyecto

- [Requerimientos funcionales y reglas de negocio](REQUIREMENTS.md)
- [Backlog priorizado de la siguiente entrega](BACKLOG.md)
- [Manual de usuario](docs/MANUAL_USUARIO.md) · [Guion de demostración](docs/GUION_DEMOSTRACION.md) · [Alineación con el informe](docs/ALINEACION_ENTREGAS.md)
- Sesión 4: [Informe final en inglés (APA)](docs/Final_Report_Zimbra_CRM.docx) · [Sustentación oral de 13 min](docs/ORAL_PRESENTATION_13MIN.md)
- [Datos listos para probar](docs/DATOS_DEMO.md)

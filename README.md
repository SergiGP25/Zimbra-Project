# Proyecto Zimbra - Sistemas Transaccionales

Proyecto transaccional compuesto por una arquitectura desacoplada:
- **Backend**: API REST desarrollada en **Python** con **FastAPI**, que se comunica con el servidor **Zimbra Collaboration Suite (ZCS)** mediante SOAP / REST.
- **Frontend**: Aplicación SPA moderna desarrollada en **React**, **Vite** y **TypeScript**.

---

## 📂 Estructura General del Repositorio

```
Zimbra-Project/
├── backend/                  # Servidor Backend (FastAPI + Python)
│   ├── app/
│   │   ├── api/v1/           # Endpoints de autenticación, correos y salud
│   │   ├── core/             # Configuración y settings con Pydantic
│   │   ├── schemas/          # Modelos de solicitud y respuesta
│   │   ├── services/         # Integración y clientes SOAP con Zimbra
│   │   └── main.py           # Instancia FastAPI y middleware CORS
│   ├── requirements.txt      # Dependencias de Python
│   ├── .env.example          # Plantilla de variables de entorno
│   └── main.py               # Punto de entrada local
│
├── frontend/                 # Cliente Web (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/       # Componentes de interfaz de usuario
│   │   ├── services/         # Servicios de llamada HTTP al backend
│   │   ├── types/            # Tipos e interfaces de TypeScript
│   │   ├── App.tsx           # Vista principal interactiva
│   │   └── main.tsx          # Entrada de la aplicación React
│   ├── package.json          # Dependencias y scripts de Node.js
│   ├── tsconfig.json         # Configuración TypeScript
│   └── vite.config.ts        # Configuración de Vite
│
└── README.md                 # Guía general de inicio
```

---

## ⚡ Guía Rápida de Inicio

### 1. Iniciar el Backend (FastAPI)

En una terminal:

```bash
cd backend

# Crear y activar entorno virtual
python3 -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

- Documentación interactiva Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- Healthcheck: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 2. Iniciar el Frontend (React + Vite + TypeScript)

En otra terminal:

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

- Abre la aplicación en: [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Configuración con Zimbra

En el archivo `backend/.env`, actualiza las variables según tu servidor Zimbra (local o remoto):

```env
ZIMBRA_SERVER_URL="https://tu-servidor-zimbra.com"
ZIMBRA_SOAP_ENDPOINT="https://tu-servidor-zimbra.com/service/soap"
ZIMBRA_VERIFY_SSL=False
```


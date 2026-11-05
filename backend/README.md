# Backend - Zimbra Project (FastAPI)

Este servicio backend expone una API REST moderna para interactuar con Zimbra Collaboration Suite (ZCS) mediante protocolos SOAP y REST.

## 🚀 Requisitos

- Python 3.9 o superior
- Pip y Virtualenv (o `venv`)

## 🛠️ Instalación y Configuración

1. **Crear y activar un entorno virtual**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # En Linux/Mac
   # .venv\Scripts\activate   # En Windows
   ```

2. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Variables de entorno**:
   Copia el archivo `.env.example` como `.env` y configura tus credenciales de Zimbra:
   ```bash
   cp .env.example .env
   ```

## 💻 Ejecución

Puedes iniciar el servidor de dos formas:

Con `uvicorn` directamente:
```bash
uvicorn app.main:app --reload --port 8000
```

O ejecutando el script `main.py`:
```bash
python main.py
```

## 📖 Documentación Interactiva

Una vez en ejecución, accede a:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Healthcheck**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── api/             # Routers y endpoints HTTP (v1)
│   ├── core/            # Configuración y settings con Pydantic
│   ├── schemas/         # Modelos de datos y validaciones (Pydantic)
│   ├── services/        # Lógica de negocio e integración SOAP con Zimbra
│   └── main.py          # Inicialización de la aplicación FastAPI y CORS
├── .env.example         # Plantilla de variables de entorno
├── requirements.txt     # Dependencias de Python
└── main.py              # Script lanzador
```


# Frontend - Zimbra Project (React + Vite + TypeScript)

Interfaz de usuario moderna desarrollada con **React 18**, **Vite** y **TypeScript** para interactuar con la API transaccional de Zimbra.

## 🚀 Requisitos

- Node.js (versión 18 o superior)
- npm o yarn / pnpm

## 🛠️ Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Variables de entorno**:
   Asegúrate de tener un archivo `.env` configurado:
   ```bash
   cp .env.example .env
   ```
   Por defecto apunta a: `VITE_API_BASE_URL="http://localhost:8000/api/v1"`

3. **Iniciar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en [http://localhost:5173](http://localhost:5173).

4. **Compilar para producción**:
   ```bash
   npm run build
   ```

## 📁 Estructura del Frontend

```
frontend/
├── src/
│   ├── components/      # Componentes de React (Navbar, MailList, StatusCard)
│   ├── services/        # Cliente API para comunicación con FastAPI (api.ts)
│   ├── types/           # Interfaces y tipos de TypeScript
│   ├── App.tsx          # Componente principal con gestión de estado
│   ├── App.css          # Estilos del panel
│   ├── index.css        # Estilos globales y reset
│   ├── main.tsx         # Punto de entrada de React
│   └── vite-env.d.ts    # Declaraciones de tipos para variables de entorno Vite
├── index.html           # HTML raíz
├── package.json         # Dependencias y scripts
├── tsconfig.json        # Configuración principal de TypeScript
└── vite.config.ts       # Configuración del bundler Vite y proxy local
```


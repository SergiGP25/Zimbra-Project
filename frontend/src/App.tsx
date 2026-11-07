import React, { useState } from 'react'
import './App.css'
import { AuthProvider, useAuth } from './context/auth/AuthContext'
import { useInactivityTimer } from './hooks/auth/useInactivityTimer'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmpleadosPage } from './pages/EmpleadosPage'
import { ProspectosPage } from './pages/ProspectosPage'

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const [currentTab, setCurrentTab] = useState<string>('dashboard')

  // HU-02: Activar temporizador de inactividad de 30 minutos
  useInactivityTimer()

  if (isLoading) {
    return (
      <div className="loading-full-page">
        <div className="spinner"></div>
        <p>Cargando sesión transaccional...</p>
      </div>
    )
  }

  // HU-01: Si no está autenticado, renderizar Login
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content-layout">
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
        <main className="page-content">
          {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
          {currentTab === 'prospectos' && <ProspectosPage />}
          {currentTab === 'empleados' && <EmpleadosPage />}
        </main>
      </div>
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}

export default App

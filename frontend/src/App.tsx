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
import { InteraccionesPage } from './pages/InteraccionesPage'
import { VentasPage } from './pages/VentasPage'

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const [currentTab, setCurrentTab] = useState<string>('dashboard')

  useInactivityTimer()

  if (isLoading) {
    return (
      <div className="loading-full-page">
        <div className="spinner"></div>
        <p>Preparando tu espacio de trabajo...</p>
      </div>
    )
  }

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
          {currentTab === 'interacciones' && <InteraccionesPage />}
          {currentTab === 'ventas' && <VentasPage />}
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

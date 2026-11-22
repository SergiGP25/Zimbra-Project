import React, { useEffect } from 'react'
import './App.css'
import { AuthProvider, useAuth } from './context/auth/AuthContext'
import { ThemeProvider } from './context/theme/ThemeContext'
import { useInactivityTimer } from './hooks/auth/useInactivityTimer'
import { navegar, useRuta } from './router/router'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { AppLayout } from './components/layout/AppLayout'

/*
  Decide qué mostrar según la ruta y la sesión:
    /            -> sitio público
    /login       -> página de inicio de sesión
    /app/...     -> sistema interno (exige sesión)
  Si alguien entra a /app sin sesión, va a /login; si ya inició sesión y
  abre /login, va a /app.
*/
const Rutas: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const ruta = useRuta()
  const zonaInterna = ruta === '/app' || ruta.startsWith('/app/')

  useInactivityTimer() // HU-02: 30 minutos sin actividad cierran la sesión

  useEffect(() => {
    if (isLoading) return
    if (zonaInterna && !isAuthenticated) navegar('/login', { reemplazar: true })
    if (ruta === '/login' && isAuthenticated) navegar('/app', { reemplazar: true })
  }, [isAuthenticated, isLoading, ruta, zonaInterna])

  if (isLoading) {
    return <div className="loading-full-page"><div className="spinner" /><p>Cargando…</p></div>
  }
  if (zonaInterna) return isAuthenticated ? <AppLayout ruta={ruta} /> : null
  if (ruta === '/login') return isAuthenticated ? null : <LoginPage />
  return <LandingPage />
}

export const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <Rutas />
    </AuthProvider>
  </ThemeProvider>
)

export default App

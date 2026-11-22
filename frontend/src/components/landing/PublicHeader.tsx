import React from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { ThemeToggle } from '../theme/ThemeToggle'

/*
  Encabezado del sitio público.
  - Los enlaces del menú usan anclas (#planes): bajan a esa sección de la
    misma página sin JavaScript.
  - "Iniciar sesión" lleva a la página /login. Si ya hay sesión, el botón
    lleva directo al sistema.
*/
export const PublicHeader: React.FC = () => {
  const { isAuthenticated } = useAuth()

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#inicio" className="wordmark" aria-label="Zimbra, ir al inicio">
          <svg viewBox="0 0 32 24" width="30" height="22" aria-hidden="true">
            <rect x="1" y="1" width="30" height="22" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M3 4l13 10L29 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <span>zimbra</span>
        </a>

        <nav className="site-nav" aria-label="Secciones">
          <a href="#producto">Producto</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#planes">Planes</a>
          <a href="#preguntas">Preguntas</a>
        </nav>

        <div className="site-actions">
          <ThemeToggle />
          <a href="#prueba" className="btn btn-ghost hide-mobile">Prueba gratis</a>
          {isAuthenticated ? (
            <Enlace to="/app" className="btn btn-primary">Ir al sistema</Enlace>
          ) : (
            <Enlace to="/login" className="btn btn-primary">Iniciar sesión</Enlace>
          )}
        </div>
      </div>
    </header>
  )
}

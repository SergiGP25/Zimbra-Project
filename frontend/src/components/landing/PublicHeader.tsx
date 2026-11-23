import React from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { ThemeToggle } from '../theme/ThemeToggle'
import { Logo } from '../ui/Logo'

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
          <Logo tamano={34} />
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

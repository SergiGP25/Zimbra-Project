import React from 'react'
import { useAuth } from '../../hooks/auth/useAuth'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="brand-logo">⚡</span>
        <div>
          <div className="brand-title">Zimbra CRM</div>
          <div className="brand-subtitle">Sistemas Transaccionales · EP-01</div>
        </div>
      </div>

      <div className="navbar-actions">
        {user && (
          <div className="user-section">
            <div className="user-details">
              <span className="user-name">{user.nombre}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <span className={`role-badge role-${user.rol.toLowerCase()}`}>
              {user.rol}
            </span>
            {/* HU-02: Botón de cerrar sesión visible */}
            <button
              id="btn-logout"
              className="btn btn-secondary btn-sm"
              onClick={() => logout()}
              title="Cerrar sesión actual"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}


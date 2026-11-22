import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { ThemeToggle } from '../theme/ThemeToggle'
import { ChangePasswordModal } from '../auth/ChangePasswordModal'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  // Controla si la ventana de cambio de contraseña está abierta
  const [cambiandoPassword, setCambiandoPassword] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <svg viewBox="0 0 32 24" width="28" height="21" aria-hidden="true" className="brand-mark">
          <rect x="1" y="1" width="30" height="22" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M3 4l13 10L29 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <div>
          <div className="brand-title">Zimbra CRM</div>
          <div className="brand-subtitle">Prospectos y ventas</div>
        </div>
      </div>

      <div className="navbar-actions">
        <ThemeToggle />
        {user && (
          <div className="user-section">
            <div className="user-details">
              <span className="user-name">{user.nombre}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <span className={`role-badge role-${user.rol.toLowerCase()}`}>{user.rol}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCambiandoPassword(true)}
            >
              Cambiar contraseña
            </button>
            {/* HU-02: botón de cerrar sesión visible */}
            <button id="btn-logout" type="button" className="btn btn-secondary btn-sm" onClick={() => logout()}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {cambiandoPassword && <ChangePasswordModal onClose={() => setCambiandoPassword(false)} />}
    </header>
  )
}

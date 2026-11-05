import React from 'react'

interface NavbarProps {
  userEmail?: string | null
  onLogout?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ userEmail, onLogout }) => {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-logo">✉</div>
        <span className="brand-title">Zimbra Transactional Web</span>
      </div>
      <div className="navbar-actions">
        {userEmail ? (
          <div className="user-section">
            <span className="user-badge">{userEmail}</span>
            <button className="btn btn-secondary" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <span className="status-badge">Modo Conexión</span>
        )}
      </div>
    </header>
  )
}


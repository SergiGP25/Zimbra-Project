import React from 'react'
import { useAuth } from '../../hooks/auth/useAuth'

interface SidebarProps {
  currentTab: string
  onTabChange: (tab: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { user } = useAuth()
  const role = user?.rol || ''

  const canManageEmployees = role.toLowerCase() === 'admin'
  const isVendedor = role.toLowerCase() === 'vendedor'
  const canViewVentas = isVendedor || role.toLowerCase() === 'admin'

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <span className="sidebar-heading">Inicio</span>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            Panel
          </button>
        </nav>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-heading">Gestión comercial</span>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentTab === 'prospectos' ? 'active' : ''}`}
            onClick={() => onTabChange('prospectos')}
          >
            {isVendedor ? 'Mis prospectos' : 'Prospectos'}
          </button>

          {canManageEmployees && (
            <button
              className={`nav-item ${currentTab === 'empleados' ? 'active' : ''}`}
              onClick={() => onTabChange('empleados')}
            >
              Empleados
            </button>
          )}
        </nav>
      </div>

      {(isVendedor || canViewVentas) && (
        <div className="sidebar-section">
          <span className="sidebar-heading">Ventas</span>
          <nav className="sidebar-nav">
          {isVendedor && (
            <button
              className={`nav-item ${currentTab === 'interacciones' ? 'active' : ''}`}
              onClick={() => onTabChange('interacciones')}
            >
              Interacciones
            </button>
          )}

          {canViewVentas && (
            <button
              className={`nav-item ${currentTab === 'ventas' ? 'active' : ''}`}
              onClick={() => onTabChange('ventas')}
            >
              Ventas
            </button>
          )}
          </nav>
        </div>
      )}

    </aside>
  )
}

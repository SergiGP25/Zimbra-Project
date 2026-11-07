import React from 'react'
import { useAuth } from '../../hooks/auth/useAuth'

interface SidebarProps {
  currentTab: string
  onTabChange: (tab: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { user } = useAuth()
  const role = user?.rol || ''

  // HU-04: Menú dinámico que muestra solo las opciones permitidas según el rol
  const canManageEmployees = role.toLowerCase() === 'admin'
  const isVendedor = role.toLowerCase() === 'vendedor'

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <span className="sidebar-heading">Módulos</span>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            📊 Panel Principal
          </button>

          {/* Opción Prospectos: Visible para todos, pero con etiqueta diferenciada */}
          <button
            className={`nav-item ${currentTab === 'prospectos' ? 'active' : ''}`}
            onClick={() => onTabChange('prospectos')}
          >
            🎯 {isVendedor ? 'Mis Prospectos (Asignados)' : 'Prospectos (Global)'}
          </button>

          {/* HU-04: Gestión de Empleados visible EXCLUSIVAMENTE para Admin */}
          {canManageEmployees && (
            <button
              className={`nav-item ${currentTab === 'empleados' ? 'active' : ''}`}
              onClick={() => onTabChange('empleados')}
            >
              👥 Gestión Empleados (Admin)
            </button>
          )}
        </nav>
      </div>

      <div className="sidebar-role-info">
        <span className="sidebar-heading">Rol Activo</span>
        <div className="role-card">
          <strong>{user?.rol}</strong>
          <p className="role-description">
            {role.toLowerCase() === 'admin' && 'Acceso total y administración de usuarios (HU-03).'}
            {role.toLowerCase() === 'marketing' && 'Visibilidad global de prospectos y campañas.'}
            {role.toLowerCase() === 'vendedor' && 'Visibilidad restringida a sus prospectos asignados (RN-12).'}
          </p>
        </div>
      </div>
    </aside>
  )
}


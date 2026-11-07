import React from 'react'
import { useAuth } from '../hooks/auth/useAuth'

interface DashboardPageProps {
  onNavigate: (tab: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth()
  const role = user?.rol || ''
  const isAdmin = role.toLowerCase() === 'admin'
  const isVendedor = role.toLowerCase() === 'vendedor'

  return (
    <div className="dashboard-container">
      <div className="welcome-banner">
        <h2>¡Bienvenido al Sistema Transaccional, {user?.nombre}!</h2>
        <p className="text-muted">
          Has ingresado con el rol <strong>{user?.rol}</strong>. La sesión permanecerá activa mientras interactúes con la plataforma (expira tras 30 min sin actividad - HU-02).
        </p>
      </div>

      <div className="summary-grid">
        <div className="card summary-card">
          <div className="card-icon">🔐</div>
          <h3>HU-01 · Iniciar Sesión</h3>
          <p>Autenticado como: <code>{user?.email}</code></p>
          <span className="badge badge-success">Sesión Activa</span>
        </div>

        <div className="card summary-card">
          <div className="card-icon">⏱️</div>
          <h3>HU-02 · Expiración</h3>
          <p>Temporizador de 30 minutos de inactividad activo en segundo plano.</p>
          <span className="badge badge-outline">Inactividad Monitoreada</span>
        </div>

        <div className="card summary-card">
          <div className="card-icon">🛡️</div>
          <h3>HU-04 · Control por Rol</h3>
          <p>Permisos aplicados según rol: <strong>{user?.rol}</strong>.</p>
          <span className="badge badge-outline">RN-12 Aplicada</span>
        </div>
      </div>

      <div className="quick-actions-card card">
        <h3>Acciones Disponibles para tu Rol</h3>
        <div className="action-buttons-row">
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('prospectos')}
          >
            🎯 {isVendedor ? 'Ver Mis Prospectos Asignados' : 'Explorar Todos los Prospectos'}
          </button>

          {isAdmin && (
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('empleados')}
            >
              👥 Administrar Empleados (HU-03)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


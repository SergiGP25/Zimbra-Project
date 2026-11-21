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
      <div className="page-heading">
        <div>
          <h1>Hola, {user?.nombre?.split(' ')[0]}</h1>
          <p>Este es tu espacio de trabajo para prospectos y ventas.</p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="card summary-card">
          <div className="card-icon">◎</div>
          <h3>Tu cuenta</h3>
          <p>{user?.email}</p>
        </div>

        <div className="card summary-card">
          <div className="card-icon">◈</div>
          <h3>Tu perfil</h3>
          <p>{user?.rol} · Acceso personalizado a tus herramientas.</p>
        </div>

        <div className="card summary-card">
          <div className="card-icon">↗</div>
          <h3>Seguimiento</h3>
          <p>Continúa con tus prospectos y mantén al día la gestión comercial.</p>
        </div>
      </div>

      <div className="quick-actions-card card">
        <h3>Accesos rápidos</h3>
        <div className="action-buttons-row">
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('prospectos')}
          >
            {isVendedor ? 'Ver mis prospectos' : 'Ver prospectos'}
          </button>

          {isAdmin && (
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('empleados')}
            >
              Administrar empleados
            </button>
          )}

          {isVendedor && (
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('interacciones')}
            >
              Registrar interacción
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

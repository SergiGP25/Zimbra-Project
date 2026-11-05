import React from 'react'
import { HealthResponse } from '../types'

interface StatusCardProps {
  health: HealthResponse | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export const StatusCard: React.FC<StatusCardProps> = ({ health, loading, error, onRefresh }) => {
  return (
    <div className="card status-card">
      <div className="card-header">
        <h3>Estado del Backend (FastAPI)</h3>
        <button className="btn btn-sm" onClick={onRefresh} disabled={loading}>
          {loading ? 'Comprobando...' : 'Revisar'}
        </button>
      </div>
      <div className="card-body">
        {loading && <p className="text-muted">Conectando con el servidor...</p>}
        {error && (
          <div className="alert alert-error">
            <strong>Error de conexión:</strong> {error}
            <div className="hint">Asegúrate de que el backend esté corriendo en <code>http://localhost:8000</code></div>
          </div>
        )}
        {health && !loading && (
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">API Status:</span>
              <span className="badge badge-success">{health.status.toUpperCase()}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Servicio:</span>
              <span>{health.service}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Servidor Zimbra:</span>
              <span className="code-tag">{health.zimbra_target}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Versión API:</span>
              <span>v{health.version}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


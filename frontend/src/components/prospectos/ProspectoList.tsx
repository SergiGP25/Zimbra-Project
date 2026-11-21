import React, { useEffect, useState } from 'react'
import { Prospecto } from '../../types/prospectos/prospectoTypes'
import { prospectoService } from '../../services/prospectos/prospectoService'
import { useAuth } from '../../hooks/auth/useAuth'

export const ProspectoList: React.FC = () => {
  const { user } = useAuth()
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProspectos = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await prospectoService.listProspectos()
      setProspectos(res.prospectos)
    } catch (err: any) {
      setError(err.detail || err.message || 'Error al obtener los prospectos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProspectos()
  }, [])

  return (
    <div className="prospectos-container">
      <div className="card-header-actions">
        <div>
          <h2>Prospectos</h2>
          <p className="text-muted">
            {user?.rol?.toLowerCase() === 'vendedor'
              ? 'Consulta y organiza los prospectos asignados a tu equipo.'
              : 'Consulta y gestiona los prospectos de tu organización.'}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchProspectos}>
          Actualizar
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">Cargando prospectos...</div>
      ) : prospectos.length === 0 ? (
        <div className="empty-state">
          No hay prospectos disponibles por ahora.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Puntaje</th>
                <th>Vendedor Asignado</th>
              </tr>
            </thead>
            <tbody>
              {prospectos.map((p) => (
                <tr key={p.id}>
                  <td><strong>#{p.id}</strong></td>
                  <td><strong>{p.nombre}</strong></td>
                  <td>{p.empresa || <span className="text-muted">—</span>}</td>
                  <td>{p.email}</td>
                  <td>{p.telefono || <span className="text-muted">—</span>}</td>
                  <td>
                    <span className="badge badge-outline">{p.estado}</span>
                  </td>
                  <td>
                    <span className="badge badge-success">{p.puntaje} pts</span>
                  </td>
                  <td>
                    {p.vendedor_nombre ? (
                      <span className="vendedor-tag">{p.vendedor_nombre}</span>
                    ) : (
                      <span className="text-muted text-xs">Sin asignar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

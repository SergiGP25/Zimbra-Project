import React, { useEffect, useState } from 'react'
import { Empleado, RolType } from '../../types/empleados/empleadoTypes'
import { empleadoService } from '../../services/empleados/empleadoService'
import { EmpleadoModal } from './EmpleadoModal'

export const EmpleadoList: React.FC = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [search, setSearch] = useState('')
  const [filterRol, setFilterRol] = useState<string>('')
  const [filterActivo, setFilterActivo] = useState<string>('')

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null)

  const fetchEmpleados = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {}
      if (filterRol) params.rol = filterRol
      if (filterActivo !== '') params.activo = filterActivo === 'true'
      if (search.trim()) params.search = search.trim()

      const res = await empleadoService.listEmpleados(params)
      setEmpleados(res.empleados)
    } catch (err: any) {
      setError(err.detail || err.message || 'Error al cargar empleados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmpleados()
  }, [filterRol, filterActivo])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchEmpleados()
  }

  const handleOpenCreate = () => {
    setSelectedEmpleado(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (emp: Empleado) => {
    setSelectedEmpleado(emp)
    setIsModalOpen(true)
  }

  const handleDeactivate = async (emp: Empleado) => {
    const confirm = window.confirm(
      `¿Estás seguro de desactivar a "${emp.nombre}" (${emp.email})?\n\nNota: Esto realiza un soft-delete (activo = FALSE) sin borrar el registro.`
    )
    if (!confirm) return

    try {
      await empleadoService.deactivateEmpleado(emp.id)
      fetchEmpleados()
    } catch (err: any) {
      alert(`No se pudo desactivar: ${err.detail || err.message}`)
    }
  }

  const handleSaveModal = async (data: {
    nombre: string
    email: string
    password?: string
    rol: RolType
    activo: boolean
  }) => {
    if (selectedEmpleado) {
      await empleadoService.updateEmpleado(selectedEmpleado.id, data)
    } else {
      await empleadoService.createEmpleado({
        nombre: data.nombre,
        email: data.email,
        password: data.password || 'Zimbra2026*',
        rol: data.rol,
        activo: data.activo,
      })
    }
    fetchEmpleados()
  }

  return (
    <div className="card empleados-container">
      <div className="card-header-actions">
        <div>
          <h2>Gestión de Empleados (HU-03)</h2>
          <p className="text-muted">
            Control de usuarios con roles (Admin, Marketing, Vendedor) y regla de protección del último Administrador.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          ➕ Nuevo Empleado
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            className="input search-input"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            Buscar
          </button>
        </form>

        <div className="filter-group">
          <label>Rol:</label>
          <select
            className="input select-filter"
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
          >
            <option value="">Todos los roles</option>
            <option value="Admin">Admin</option>
            <option value="Marketing">Marketing</option>
            <option value="Vendedor">Vendedor</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Estado:</label>
          <select
            className="input select-filter"
            value={filterActivo}
            onChange={(e) => setFilterActivo(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchEmpleados}>
          🔄 Refrescar
        </button>
      </div>

      {/* Tabla de Empleados */}
      {loading ? (
        <div className="loading-state">Cargando lista de empleados...</div>
      ) : empleados.length === 0 ? (
        <div className="empty-state">No se encontraron empleados con los filtros aplicados.</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp.id} className={!emp.activo ? 'row-inactive' : ''}>
                  <td><strong>#{emp.id}</strong></td>
                  <td>{emp.nombre}</td>
                  <td><code>{emp.email}</code></td>
                  <td>
                    <span className={`role-badge role-${emp.rol.toLowerCase()}`}>
                      {emp.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${emp.activo ? 'pill-active' : 'pill-inactive'}`}>
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-center actions-cell">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(emp)}
                      title="Editar empleado"
                    >
                      ✏️ Editar
                    </button>
                    {emp.activo ? (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeactivate(emp)}
                        title="Desactivar (Soft delete)"
                      >
                        🚫 Desactivar
                      </button>
                    ) : (
                      <span className="text-muted text-xs">Desactivado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para Crear / Editar */}
      <EmpleadoModal
        isOpen={isModalOpen}
        empleado={selectedEmpleado}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
      />
    </div>
  )
}


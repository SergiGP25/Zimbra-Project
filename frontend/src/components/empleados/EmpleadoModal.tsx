import React, { useEffect, useState } from 'react'
import { Empleado, RolType } from '../../types/empleados/empleadoTypes'

interface EmpleadoModalProps {
  isOpen: boolean
  empleado: Empleado | null // null para crear, objeto para editar
  onClose: () => void
  onSave: (data: {
    nombre: string
    email: string
    password?: string
    rol: RolType
    activo: boolean
  }) => Promise<void>
}

export const EmpleadoModal: React.FC<EmpleadoModalProps> = ({
  isOpen,
  empleado,
  onClose,
  onSave,
}) => {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<RolType>('Vendedor')
  const [activo, setActivo] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (empleado) {
      setNombre(empleado.nombre)
      setEmail(empleado.email)
      setPassword('')
      setRol(empleado.rol as RolType)
      setActivo(empleado.activo)
    } else {
      setNombre('')
      setEmail('')
      setPassword('')
      setRol('Vendedor')
      setActivo(true)
    }
    setError(null)
  }, [empleado, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await onSave({
        nombre,
        email,
        password: password || undefined,
        rol,
        activo,
      })
      onClose()
    } catch (err: any) {
      setError(err.detail || err.message || 'Error al guardar los datos del empleado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{empleado ? 'Editar Empleado (HU-03)' : 'Nuevo Empleado (HU-03)'}</h3>
          <button className="btn-close" onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nombre Completo:</label>
            <input
              type="text"
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label>Correo Electrónico (Único):</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@zimbra-demo.com"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Contraseña {empleado ? '(Opcional, dejar vacía para conservar)' : '(Obligatoria)'}:
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={empleado ? '••••••••' : 'Mínimo 6 caracteres'}
              required={!empleado}
            />
          </div>

          <div className="form-group">
            <label>Rol Asignado (Limitado a Vendedor, Marketing o Admin):</label>
            <select
              className="input"
              value={rol}
              onChange={(e) => setRol(e.target.value as RolType)}
            >
              <option value="Admin">Admin</option>
              <option value="Marketing">Marketing</option>
              <option value="Vendedor">Vendedor</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
              />
              <span>Empleado Activo (Permite iniciar sesión)</span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


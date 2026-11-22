import React, { useState } from 'react'
import { authService } from '../../services/auth/authService'

/*
  Ventana para cambiar la contraseña del usuario que inició sesión.

  Las reglas se revisan dos veces:
  - Aquí, mientras el usuario escribe, para mostrarle qué le falta.
  - En el backend (CambioPasswordRequest), que es la validación que cuenta:
    el navegador se puede manipular, el servidor no.
*/

interface Props {
  onClose: () => void
}

// Cada regla: un texto y una función que dice si se cumple
const REGLAS: { texto: string; cumple: (p: string) => boolean }[] = [
  { texto: 'Al menos 8 caracteres', cumple: (p) => p.length >= 8 },
  { texto: 'Una letra mayúscula', cumple: (p) => /[A-Z]/.test(p) },
  { texto: 'Una letra minúscula', cumple: (p) => /[a-z]/.test(p) },
  { texto: 'Un número', cumple: (p) => /\d/.test(p) },
]

export const ChangePasswordModal: React.FC<Props> = ({ onClose }) => {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  const reglasOk = REGLAS.every((r) => r.cumple(nueva))
  const coinciden = nueva.length > 0 && nueva === confirmacion
  const puedeGuardar = actual.length > 0 && reglasOk && coinciden && !guardando

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await authService.cambiarPassword({
        password_actual: actual,
        password_nueva: nueva,
        confirmacion,
      })
      setListo(true)
    } catch (err: any) {
      setError(err.detail || 'No se pudo cambiar la contraseña. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      {/* stopPropagation: un clic dentro de la tarjeta no debe cerrarla */}
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cambio-password"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="titulo-cambio-password">Cambiar contraseña</h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {listo ? (
          <>
            <div className="alert alert-success" role="status">
              Contraseña actualizada. Úsala la próxima vez que inicies sesión.
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="pw-actual">Contraseña actual</label>
              <input id="pw-actual" type="password" className="input" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="pw-nueva">Nueva contraseña</label>
              <input id="pw-nueva" type="password" className="input" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} aria-describedby="pw-reglas" required />
              <ul id="pw-reglas" className="password-rules">
                {REGLAS.map((r) => (
                  <li key={r.texto} className={r.cumple(nueva) ? 'is-ok' : ''}>
                    {r.texto}
                  </li>
                ))}
              </ul>
            </div>

            <div className="form-group">
              <label htmlFor="pw-confirmacion">Repite la nueva contraseña</label>
              <input id="pw-confirmacion" type="password" className="input" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required />
              {confirmacion.length > 0 && !coinciden && <p className="field-error">No coincide con la nueva contraseña.</p>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={!puedeGuardar}>
                {guardando ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'

export const LoginForm: React.FC = () => {
  const { login, sessionExpiredMessage, clearSessionMessage } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    clearSessionMessage()

    try {
      await login(email, password)
    } catch (err: any) {
      setErrorMessage(err.detail || 'Credenciales inválidas. Verifique su correo y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-card">
      <div className="login-header">
        <h2>Iniciar Sesión</h2>
        <p className="text-muted">Accede al Sistema Transaccional Zimbra</p>
      </div>

      {sessionExpiredMessage && (
        <div className="alert alert-warning">
          <strong>Aviso:</strong> {sessionExpiredMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="login-email">Correo Electrónico:</label>
          <input
            id="login-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@zimbra-demo.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Contraseña:</label>
          <input
            id="login-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Validando credenciales...' : 'Ingresar al Sistema'}
        </button>
      </form>
    </div>
  )
}

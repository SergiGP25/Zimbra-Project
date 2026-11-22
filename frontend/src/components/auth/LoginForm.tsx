import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'

/*
  Formulario de inicio de sesión (HU-01).
  Se muestra dentro del panel que se despliega desde el encabezado.

  Cómo funciona:
  - Cada campo es "controlado": su valor vive en un useState y React lo
    actualiza con onChange en cada tecla.
  - Al enviar, e.preventDefault() evita que el navegador recargue la página
    (comportamiento por defecto de un <form>).
  - login() viene de AuthContext: llama a la API y, si sale bien, guarda el
    token. App.tsx detecta el cambio y muestra el panel interno.
*/
export const LoginForm: React.FC = () => {
  const { login, sessionExpiredMessage, clearSessionMessage } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Al abrir el panel, el cursor queda en el correo
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    clearSessionMessage()

    try {
      await login(email.trim(), password)
    } catch (err: any) {
      // El backend responde el mismo mensaje si el correo no existe o la
      // contraseña está mal: así nadie puede averiguar qué correos existen.
      setError(err.detail || 'No se pudo iniciar sesión. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form" noValidate>
      <h2 className="login-title">Entrar al CRM</h2>
      <p className="login-help">Solo para el equipo de Zimbra.</p>

      {sessionExpiredMessage && (
        <div className="alert alert-warning" role="status">
          {sessionExpiredMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="login-email">Correo</label>
        <input
          ref={emailRef}
          id="login-email"
          type="email"
          className="input"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@zimbra-demo.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="login-password">Contraseña</label>
        <div className="input-with-action">
          <input
            id="login-password"
            type={verPassword ? 'text' : 'password'}
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="input-action"
            onClick={() => setVerPassword((v) => !v)}
            aria-pressed={verPassword}
          >
            {verPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={cargando || !email || !password}
      >
        {cargando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

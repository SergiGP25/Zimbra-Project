import React, { useState } from 'react'
import { authService } from '../../services/auth/authService'
import { Enlace } from '../../router/router'

/*
  "¿Olvidaste tu contraseña?" en dos pasos:
  1. RecuperarForm: la persona escribe su correo. El backend crea un token
     firmado que vence en 30 minutos y lo envía dentro de un enlace.
  2. RestablecerForm: el enlace abre /restablecer?token=...; aquí se escribe
     la contraseña nueva y el backend valida el token antes de guardarla.
*/

export const RecuperarForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const r = await authService.recuperarPassword(email.trim())
      setMensaje(r.message)
    } catch (err: any) {
      setError(err.detail || 'No pudimos procesar la solicitud. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (mensaje) {
    return (
      <div className="login-form">
        <h2 className="login-title">Revisa tu correo</h2>
        <p className="login-help">{mensaje}</p>
        <Enlace to="/login" className="btn btn-secondary btn-block">Volver a iniciar sesión</Enlace>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="login-form">
      <h2 className="login-title">Recupera tu acceso</h2>
      <p className="login-help">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.</p>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className="form-group">
        <label htmlFor="rec-email">Correo</label>
        <input id="rec-email" type="email" className="input" autoComplete="username" required autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@zimbra-demo.com" />
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={enviando || !email}>
        {enviando ? 'Enviando…' : 'Enviar enlace'}
      </button>
      <p className="login-note"><Enlace to="/login" className="link-quiet">Volver a iniciar sesión</Enlace></p>
    </form>
  )
}

export const RestablecerForm: React.FC = () => {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const r = await authService.restablecerPassword(token, nueva, confirmacion)
      setListo(r.message)
    } catch (err: any) {
      setError(err.detail || 'No se pudo cambiar la contraseña. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (!token) {
    return (
      <div className="login-form">
        <h2 className="login-title">Enlace incompleto</h2>
        <p className="login-help">Abre el enlace tal como llegó en el correo, o pide uno nuevo.</p>
        <Enlace to="/recuperar" className="btn btn-primary btn-block">Pedir un enlace nuevo</Enlace>
      </div>
    )
  }

  if (listo) {
    return (
      <div className="login-form">
        <h2 className="login-title">Contraseña actualizada</h2>
        <p className="login-help">{listo}</p>
        <Enlace to="/login" className="btn btn-primary btn-block">Iniciar sesión</Enlace>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="login-form">
      <h2 className="login-title">Crea tu contraseña nueva</h2>
      <p className="login-help">Mínimo 8 caracteres, con una mayúscula, una minúscula y un número.</p>
      {error && (
        <div className="alert alert-error" role="alert">
          {error} {error.includes('enlace') && <Enlace to="/recuperar">Pedir un enlace nuevo</Enlace>}
        </div>
      )}
      <div className="form-group">
        <label htmlFor="res-nueva">Contraseña nueva</label>
        <input id="res-nueva" type="password" className="input" autoComplete="new-password" required minLength={8} maxLength={72}
          value={nueva} onChange={(e) => setNueva(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="res-confirmacion">Repite la contraseña</label>
        <input id="res-confirmacion" type="password" className="input" autoComplete="new-password" required
          value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={enviando || !nueva || !confirmacion}>
        {enviando ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  )
}

import React, { useEffect, useState } from 'react'
import './App.css'
import { Navbar } from './components/Navbar'
import { StatusCard } from './components/StatusCard'
import { MailList } from './components/MailList'
import { api } from './services/api'
import { HealthResponse, MailMessage } from './types'

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthLoading, setHealthLoading] = useState<boolean>(true)
  const [healthError, setHealthError] = useState<string | null>(null)

  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('zimbra_token'))
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('zimbra_email'))
  const [loginUsername, setLoginUsername] = useState<string>('admin@zimbra.local')
  const [loginPassword, setLoginPassword] = useState<string>('password123')
  const [authLoading, setAuthLoading] = useState<boolean>(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  // Mail State
  const [messages, setMessages] = useState<MailMessage[]>([])
  const [mailsLoading, setMailsLoading] = useState<boolean>(false)

  // Send Mail Form State
  const [toEmail, setToEmail] = useState<string>('')
  const [subject, setSubject] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)

  const checkHealth = async () => {
    setHealthLoading(true)
    setHealthError(null)
    try {
      const data = await api.checkHealth()
      setHealth(data)
    } catch (err: unknown) {
      setHealthError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setHealthLoading(false)
    }
  }

  const loadInbox = async (authToken?: string) => {
    setMailsLoading(true)
    try {
      const data = await api.getInbox(authToken || token || undefined)
      setMessages(data.messages)
    } catch (err) {
      console.error(err)
    } finally {
      setMailsLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    loadInbox()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthMessage(null)
    try {
      const res = await api.login(loginUsername, loginPassword)
      setToken(res.auth_token)
      setUserEmail(res.email || loginUsername)
      localStorage.setItem('zimbra_token', res.auth_token)
      if (res.email) localStorage.setItem('zimbra_email', res.email)
      setAuthMessage(`Sesión iniciada: ${res.message}`)
      loadInbox(res.auth_token)
    } catch (err: unknown) {
      setAuthMessage(err instanceof Error ? err.message : 'Error al autenticar')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUserEmail(null)
    localStorage.removeItem('zimbra_token')
    localStorage.removeItem('zimbra_email')
  }

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!toEmail || !subject || !content) return
    setSending(true)
    setSendSuccess(null)
    try {
      const res = await api.sendMail(
        {
          to: [toEmail],
          subject,
          content,
        },
        token || undefined
      )
      setSendSuccess(res.message || 'Mensaje enviado correctamente')
      setToEmail('')
      setSubject('')
      setContent('')
      loadInbox()
    } catch (err: unknown) {
      setSendSuccess(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="app-container">
      <Navbar userEmail={userEmail} onLogout={handleLogout} />

      <main className="content">
        <div className="hero-banner">
          <h2>Panel de Integración Zimbra</h2>
          <p>
            Arquitectura transaccional: Frontend en React + Vite (TypeScript) conectado a Backend FastAPI y servicios SOAP de Zimbra.
          </p>
        </div>

        <div className="grid-layout">
          {/* Columna Izquierda: Conexión y Autenticación */}
          <div className="column">
            <StatusCard
              health={health}
              loading={healthLoading}
              error={healthError}
              onRefresh={checkHealth}
            />

            <div className="card">
              <h3>Autenticación Zimbra</h3>
              {userEmail ? (
                <div className="logged-in-panel">
                  <p>Sesión activa como: <strong>{userEmail}</strong></p>
                  <p className="token-preview">Token: {token?.slice(0, 18)}...</p>
                  <button className="btn btn-secondary" onClick={handleLogout}>
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="login-form">
                  <div className="form-group">
                    <label>Usuario / Correo Zimbra:</label>
                    <input
                      type="text"
                      className="input"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Contraseña:</label>
                    <input
                      type="password"
                      className="input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={authLoading}>
                    {authLoading ? 'Autenticando...' : 'Iniciar Sesión'}
                  </button>
                  {authMessage && <div className="info-badge">{authMessage}</div>}
                </form>
              )}
            </div>

            <div className="card">
              <h3>Redactar Correo Transaccional</h3>
              <form onSubmit={handleSendMail} className="mail-form">
                <div className="form-group">
                  <label>Destinatario:</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="usuario@dominio.com"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Asunto:</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Asunto del correo"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mensaje:</label>
                  <textarea
                    className="input textarea"
                    rows={4}
                    placeholder="Escribe el cuerpo del mensaje..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Enviando...' : 'Enviar vía Zimbra'}
                </button>
                {sendSuccess && <div className="info-badge">{sendSuccess}</div>}
              </form>
            </div>
          </div>

          {/* Columna Derecha: Buzón de Correos */}
          <div className="column">
            <div className="card">
              <div className="card-header">
                <h3>Bandeja de Entrada</h3>
                <button className="btn btn-sm" onClick={() => loadInbox()} disabled={mailsLoading}>
                  Actualizar
                </button>
              </div>
              <MailList messages={messages} loading={mailsLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App


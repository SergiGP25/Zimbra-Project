import React from 'react'
import '../styles/landing.css'
import { LoginForm } from '../components/auth/LoginForm'
import { RecuperarForm, RestablecerForm } from '../components/auth/RecuperarPassword'
import { ThemeToggle } from '../components/theme/ThemeToggle'
import { Enlace } from '../router/router'

/*
  Página de inicio de sesión (/login), separada del sitio público.
  Dos columnas: a la izquierda qué es el sistema; a la derecha el formulario.
  En celular solo se ve el formulario.
  La misma página sirve para "¿Olvidaste tu contraseña?" (/recuperar) y
  para crear la contraseña nueva desde el enlace del correo (/restablecer).
*/
export const LoginPage: React.FC<{ vista?: 'login' | 'recuperar' | 'restablecer' }> = ({ vista = 'login' }) => (
  <div className="login-page">
    <aside className="login-aside">
      <Enlace to="/" className="wordmark wordmark-light" aria-label="Volver al inicio">
        <svg viewBox="0 0 32 24" width="30" height="22" aria-hidden="true">
          <rect x="1" y="1" width="30" height="22" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M3 4l13 10L29 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <span>zimbra</span>
      </Enlace>
      <div className="login-aside-body">
        <h1>Tu bandeja comercial, al día.</h1>
        <p>Prospectos, pruebas de 60 días, alertas y ventas del equipo en un solo lugar.</p>
        <ul className="login-aside-list">
          <li>Marketing ve de dónde llega cada prospecto.</li>
          <li>Ventas recibe la alerta cuando un prospecto calificado vuelve al sitio.</li>
          <li>Gerencia mide la conversión y la tasa de cierre.</li>
        </ul>
      </div>
      <p className="login-aside-foot">Sistema transaccional del caso Zimbra.</p>
    </aside>

    <main className="login-main">
      <div className="login-topbar">
        <Enlace to="/" className="link-quiet">Volver al inicio</Enlace>
        <ThemeToggle />
      </div>
      <div className="login-card">
        {vista === 'login' && (
          <>
            <LoginForm />
            <p className="login-note"><Enlace to="/recuperar">¿Olvidaste tu contraseña?</Enlace></p>
          </>
        )}
        {vista === 'recuperar' && <RecuperarForm />}
        {vista === 'restablecer' && <RestablecerForm />}
      </div>
    </main>
  </div>
)

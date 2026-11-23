import React, { useEffect, useState } from 'react'
import { publicoService } from '../services/publico/publicoService'
import { PortalPrueba, PruebaPortal, SeccionPortal } from '../types/publico/publicoTypes'
import { ThemeToggle } from '../components/theme/ThemeToggle'
import { Enlace } from '../router/router'
import { formatoFecha } from '../lib/formato'
import { Estado } from '../components/ui/ui'
import '../styles/landing.css'

/*
  "Mi prueba": así entra el visitante que activó una prueba gratis.

  El visitante NO es usuario del CRM (el CRM es para el equipo comercial:
  Admin, Marketing y Vendedor). Por eso no tiene contraseña: recibe por
  correo un enlace personal /mi-prueba?token=... firmado por el backend.

  Esta página también alimenta el proceso comercial del caso:
    - Abrirla registra una visita web (T2), una vez al día.
    - Los botones de precios, características y soporte registran una visita
      a esa sección. Ver precios suma más puntos (RN-04). Si el prospecto
      llega a 50 puntos pasa a Calificado y su vendedor recibe una alerta.
*/

const SECCIONES: { pagina: SeccionPortal; texto: string; destino: string }[] = [
  { pagina: '/caracteristicas', texto: 'Ver qué incluye Zimbra', destino: '/#producto' },
  { pagina: '/precios', texto: 'Ver planes y precios', destino: '/#planes' },
]

export const MiPruebaPage: React.FC = () => {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [datos, setDatos] = useState<PortalPrueba | null>(null)
  const [error, setError] = useState<string | null>(token ? null : 'Abre esta página con el enlace que llegó a tu correo.')

  useEffect(() => {
    if (!token) return
    publicoService
      .verMiPrueba(token)
      .then(setDatos)
      .catch((err: any) => setError(err.detail || 'No pudimos cargar tu prueba. Intenta de nuevo.'))
  }, [token])

  // Registra la visita y luego lleva a la sección del sitio
  const abrirSeccion = async (pagina: SeccionPortal, destino: string) => {
    try {
      await publicoService.visitarSeccion(token, pagina)
    } finally {
      window.location.href = destino
    }
  }

  return (
    <div className="landing portal">
      <header className="site-header">
        <div className="site-header-inner">
          <Enlace to="/" className="wordmark" aria-label="Zimbra, ir al inicio">
            <svg viewBox="0 0 32 24" width="30" height="22" aria-hidden="true">
              <rect x="1" y="1" width="30" height="22" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M3 4l13 10L29 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span>zimbra</span>
          </Enlace>
          <div className="site-actions">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="portal-main">
        {error && (
          <div className="portal-card">
            <h1>No pudimos abrir tu prueba</h1>
            <p>{error}</p>
            <a href="/#prueba" className="btn btn-primary">Activar una prueba</a>
          </div>
        )}

        {!error && !datos && <p className="text-muted">Cargando tu prueba…</p>}

        {datos && (
          <>
            <h1 className="portal-title">Hola, {datos.nombre.split(' ')[0]}</h1>
            <p className="portal-lead">
              Esta es tu página personal{datos.empresa ? ` para ${datos.empresa}` : ''}. Aquí ves tus pruebas y cuántos días te quedan.
            </p>

            <div className="portal-pruebas">
              {datos.pruebas.map((p, i) => <TarjetaPrueba key={i} prueba={p} />)}
            </div>

            <section className="portal-card">
              <h2>Cómo empezar</h2>
              <ol className="portal-pasos">
                <li>Abre el producto que elegiste e inicia sesión con tu correo de trabajo.</li>
                <li>Invita a dos o tres compañeros para probar el correo y el calendario compartidos.</li>
                <li>Antes de que termine la prueba, decide con tu asesor el plan que te sirve.</li>
              </ol>
              <div className="portal-acciones">
                {SECCIONES.map((s) => (
                  <button key={s.pagina} type="button" className="btn btn-secondary" onClick={() => abrirSeccion(s.pagina, s.destino)}>
                    {s.texto}
                  </button>
                ))}
              </div>
            </section>

            <section className="portal-card">
              <h2>Tu asesor</h2>
              {datos.asesor ? (
                <>
                  <p><strong>{datos.asesor}</strong> te acompaña durante la prueba.</p>
                  {datos.asesor_email && (
                    <a className="btn btn-primary" href={`mailto:${datos.asesor_email}`}
                      onClick={() => publicoService.visitarSeccion(token, '/soporte').catch(() => undefined)}>
                      Escribir a {datos.asesor.split(' ')[0]}
                    </a>
                  )}
                </>
              ) : (
                <p>En las próximas horas te asignamos un asesor y te escribirá a tu correo.</p>
              )}
            </section>

            <p className="portal-nota">Este enlace es solo tuyo. No lo compartas: cualquiera que lo tenga ve esta página.</p>
          </>
        )}
      </main>
    </div>
  )
}

const TarjetaPrueba: React.FC<{ prueba: PruebaPortal }> = ({ prueba }) => {
  const usados = Math.min(60, Math.max(0, 60 - prueba.dias_restantes))
  const activa = prueba.estado === 'Activa'
  return (
    <article className="portal-card portal-prueba">
      <div className="portal-prueba-cabeza">
        <div>
          <h2>{prueba.producto}</h2>
          {prueba.descripcion && <p className="text-muted">{prueba.descripcion}</p>}
        </div>
        <Estado valor={prueba.estado} />
      </div>
      {activa ? (
        <>
          <p className="portal-dias"><strong>{prueba.dias_restantes}</strong> {prueba.dias_restantes === 1 ? 'día restante' : 'días restantes'}</p>
          <div className="portal-barra" role="progressbar" aria-valuemin={0} aria-valuemax={60} aria-valuenow={usados}
            aria-label={`Días usados: ${usados} de 60`}>
            <span style={{ width: `${(usados / 60) * 100}%` }} />
          </div>
        </>
      ) : (
        <p className="portal-dias">
          {prueba.estado === 'Convertida' ? 'Ya compraste este producto. Gracias por elegir Zimbra.' : 'Esta prueba terminó. Tu asesor te puede ayudar a continuar.'}
        </p>
      )}
      <p className="text-muted portal-fechas">Del {formatoFecha(prueba.fecha_inicio)} al {formatoFecha(prueba.fecha_fin)}</p>
    </article>
  )
}

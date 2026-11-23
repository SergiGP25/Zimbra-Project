import React from 'react'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { alertaService } from '../../services/crm/crmService'
import { ThemeToggle } from '../theme/ThemeToggle'
import { Icono } from '../ui/Iconos'

/*
  Franja superior del contenido: la fecha de hoy, el cambio de tema y la
  campana de alertas (con punto si hay pendientes). Va sobre la banda de
  color de la cabecera (ver .page-content en App.css).
*/
export const Topbar: React.FC<{ rutaActual: string }> = ({ rutaActual }) => {
  const { datos } = useCarga(() => alertaService.pendientes(), [rutaActual])
  const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const pendientes = datos?.pendientes || 0

  return (
    <div className="topbar">
      <span className="topbar-fecha">{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</span>
      <div className="topbar-acciones">
        <ThemeToggle />
        <Enlace to="/app/alertas" className="topbar-campana"
          aria-label={pendientes ? `Alertas: ${pendientes} sin atender` : 'Alertas'} title="Alertas">
          <Icono nombre="alertas" />
          {pendientes > 0 && <span className="topbar-punto" aria-hidden="true" />}
        </Enlace>
      </div>
    </div>
  )
}

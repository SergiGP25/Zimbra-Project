import React from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { formatoMoneda } from '../../lib/formato'
import { reporteService } from '../../services/crm/crmService'
import { Cargando, ErrorCarga, Indicador } from '../../components/ui/ui'

const ESTADOS = ['Nuevo', 'En prueba', 'Calificado', 'Cliente', 'Descartado'] as const

/*
  Panel de inicio (RF-46). Los números vienen de GET /reportes/panel, que
  filtra por el vendedor cuando el rol es Vendedor (RN-12).
  El embudo se dibuja con barras de CSS: el ancho es el porcentaje.
*/
export const PanelPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const { datos, cargando, error, recargar } = useCarga(() => reporteService.panel(), [])

  if (cargando) return <Cargando />
  if (error || !datos) return <ErrorCarga mensaje={error || 'Sin datos'} onReintentar={recargar} />

  const total = ESTADOS.reduce((s, e) => s + (datos.prospectos_por_estado[e] || 0), 0)
  const nombre = user?.nombre.split(' ')[0]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Hola, {nombre}</h2>
          <p className="text-muted">
            {user?.rol === 'Vendedor' ? 'Esto es lo que tienes pendiente con tus prospectos.' : 'Así va el proceso comercial hoy.'}
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        <Enlace to="/app/alertas" className="kpi-link">
          <Indicador etiqueta="Alertas sin atender" valor={datos.alertas_pendientes} destacado={datos.alertas_pendientes > 0}
            detalle="Prospectos calificados que volvieron o pruebas por vencer" />
        </Enlace>
        <Enlace to="/app/pruebas" className="kpi-link">
          <Indicador etiqueta="Pruebas por vencer" valor={datos.pruebas_por_vencer} detalle="Activas a 7 días o menos" />
        </Enlace>
        <Enlace to="/app/propuestas" className="kpi-link">
          <Indicador etiqueta="Propuestas esperando respuesta" valor={datos.propuestas_enviadas} />
        </Enlace>
        <Enlace to="/app/ventas" className="kpi-link">
          <Indicador etiqueta="Ventas de este mes" valor={formatoMoneda(datos.monto_mes)}
            detalle={`${datos.ventas_mes} ventas, ${datos.ventas_pendientes_pago} sin pagar`} />
        </Enlace>
      </div>

      <section className="card">
        <h3 className="card-title">Embudo de prospectos</h3>
        <p className="text-muted">{total} prospectos{user?.rol === 'Vendedor' ? ' asignados a ti' : ''}.</p>
        <div className="funnel">
          {ESTADOS.map((e) => {
            const n = datos.prospectos_por_estado[e] || 0
            const pct = total ? Math.round((n / total) * 100) : 0
            return (
              <Enlace key={e} to={`/app/prospectos?estado=${encodeURIComponent(e)}`} className="funnel-row">
                <span className="funnel-label">{e}</span>
                <span className="funnel-bar"><span className={`funnel-fill fill-${e.toLowerCase().replace(' ', '-')}`} style={{ width: `${pct}%` }} /></span>
                <span className="funnel-value">{n} <small>({pct} %)</small></span>
              </Enlace>
            )
          })}
        </div>
      </section>
    </div>
  )
}

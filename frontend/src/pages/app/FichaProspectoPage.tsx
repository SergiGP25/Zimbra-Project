import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { formatoFecha, formatoFechaHora, formatoMoneda } from '../../lib/formato'
import { puede } from '../../lib/roles'
import { prospectoService } from '../../services/crm/crmService'
import { Aviso, Cargando, ErrorCarga, Estado } from '../../components/ui/ui'
import { FormInteraccion, FormPropuesta, FormPrueba } from '../../components/crm/Formularios'

/*
  RF-10: ficha del prospecto. Una sola petición (GET /prospectos/{id}/ficha)
  trae los datos y todo el historial. Desde aquí se registran las acciones
  del proceso sin tener que buscar el prospecto en otra pantalla.
*/
export const FichaProspectoPage: React.FC<{ params: Record<string, string> }> = ({ params }) => {
  const id = Number(params.id)
  const { user } = useAuth()
  const { datos, cargando, error, recargar } = useCarga(() => prospectoService.ficha(id), [id])
  const [ventana, setVentana] = useState<'prueba' | 'interaccion' | 'propuesta' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  if (cargando && !datos) return <Cargando />
  if (error || !datos) return <ErrorCarga mensaje={error || 'Sin datos'} onReintentar={recargar} />

  const p = datos.prospecto
  const d = datos.desglose_puntaje
  const guardado = (m: string) => { setVentana(null); setAviso(m); recargar() }
  const cerrado = p.estado === 'Cliente' || p.estado === 'Descartado'

  return (
    <div>
      <Enlace to="/app/prospectos" className="link-quiet">Volver a prospectos</Enlace>
      <div className="page-header">
        <div>
          <h2>{p.nombre}</h2>
          <p className="text-muted">{[p.empresa, p.email, p.telefono].filter(Boolean).join(', ')}</p>
        </div>
        <div className="page-header-actions">
          {!cerrado && <button type="button" className="btn btn-secondary" onClick={() => setVentana('prueba')}>Registrar prueba</button>}
          {puede.registrarInteracciones(user?.rol) && <button type="button" className="btn btn-secondary" onClick={() => setVentana('interaccion')}>Registrar interacción</button>}
          {puede.gestionarPropuestas(user?.rol) && p.estado !== 'Descartado' && <button type="button" className="btn btn-primary" onClick={() => setVentana('propuesta')}>Crear propuesta</button>}
        </div>
      </div>

      <Aviso tipo="success" texto={aviso} onCerrar={() => setAviso(null)} />

      <div className="ficha-resumen card">
        <div><span className="kpi-etiqueta">Estado</span><Estado valor={p.estado} /></div>
        <div><span className="kpi-etiqueta">Puntaje</span><span className="kpi-valor">{p.puntaje}</span></div>
        <div><span className="kpi-etiqueta">Vendedor</span><span>{p.vendedor_nombre || 'Sin asignar'}</span></div>
        <div><span className="kpi-etiqueta">Campaña</span><span>{p.campana_nombre}</span></div>
        <div><span className="kpi-etiqueta">Registro</span><span>{formatoFecha(p.fecha_registro)}</span></div>
      </div>

      <section className="card">
        <h3 className="card-title">De dónde sale el puntaje</h3>
        <div className="score-breakdown">
          <span>Pruebas (+20 c/u): <strong>{d.pruebas}</strong></span>
          <span>Visitas (+5, +15 en precios): <strong>{d.visitas}</strong></span>
          <span>Interacciones positivas (+10): <strong>{d.interacciones}</strong></span>
          <span>Calculado: <strong>{d.total_calculado}</strong></span>
        </div>
        {d.total_calculado !== p.puntaje && (
          <p className="field-help">El puntaje guardado ({p.puntaje}) difiere del calculado porque los datos de ejemplo se cargaron sin pasar por las transacciones.</p>
        )}
      </section>

      <div className="ficha-grid">
        <Seccion titulo="Pruebas gratuitas" vacio="Sin pruebas." filas={datos.pruebas.map((x) => [
          x.producto, <Estado key="e" valor={x.estado} />, `${formatoFecha(x.fecha_inicio)} a ${formatoFecha(x.fecha_fin)}`,
          x.estado === 'Activa' ? `${x.dias_restantes} días` : '',
        ])} />
        <Seccion titulo="Propuestas" vacio="Sin propuestas." filas={datos.propuestas.map((x) => [
          `N.º ${x.propuesta_id}: ${x.producto}`, `${x.num_licencias} lic.`, formatoMoneda(x.valor_total), <Estado key="e" valor={x.estado} />,
        ])} />
        <Seccion titulo="Ventas" vacio="Sin ventas." filas={datos.ventas.map((x) => [
          formatoFecha(x.fecha_venta), formatoMoneda(x.monto_final), x.forma_pago, <Estado key="e" valor={x.estado} />,
        ])} />
        <Seccion titulo="Interacciones" vacio="Sin interacciones." filas={datos.interacciones.map((x) => [
          formatoFechaHora(x.fecha_hora), `${x.tipo}, ${x.empleado}`, <Estado key="e" valor={x.resultado} />, x.notas || '',
        ])} />
        <Seccion titulo="Visitas al sitio" vacio="Sin visitas." filas={datos.visitas.map((x) => [
          formatoFechaHora(x.fecha_hora), x.pagina_visitada, `${x.duracion_segundos} s`,
        ])} />
        <Seccion titulo="Alertas" vacio="Sin alertas." filas={datos.alertas.map((x) => [
          formatoFechaHora(x.fecha_hora), x.motivo, x.atendida ? 'Atendida' : 'Pendiente',
        ])} />
      </div>

      {ventana === 'prueba' && <FormPrueba prospectoId={id} onClose={() => setVentana(null)} onGuardado={guardado} />}
      {ventana === 'interaccion' && <FormInteraccion prospectoId={id} onClose={() => setVentana(null)} onGuardado={guardado} />}
      {ventana === 'propuesta' && <FormPropuesta prospectoId={id} onClose={() => setVentana(null)} onGuardado={guardado} />}
    </div>
  )
}

const Seccion: React.FC<{ titulo: string; vacio: string; filas: React.ReactNode[][] }> = ({ titulo, vacio, filas }) => (
  <section className="card">
    <h3 className="card-title">{titulo} <span className="count">{filas.length}</span></h3>
    {filas.length === 0 ? <p className="text-muted">{vacio}</p> : (
      <table className="data-table compact"><tbody>
        {filas.map((f, i) => <tr key={i}>{f.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
      </tbody></table>
    )}
  </section>
)

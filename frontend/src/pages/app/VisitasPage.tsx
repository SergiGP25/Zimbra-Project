import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { formatoFechaHora } from '../../lib/formato'
import { puede } from '../../lib/roles'
import { visitaService } from '../../services/crm/crmService'
import { Cargando, Encabezado, ErrorCarga, SelectorProspecto, Vacio } from '../../components/ui/ui'

// Páginas típicas del sitio de Zimbra para el simulador
const PAGINAS = ['/precios', '/caracteristicas', '/descargas', '/documentacion', '/blog', '/casos-de-exito', '/soporte', '/contacto', '/inicio']

/*
  RF-22 a RF-24: simulador de visitas web. En el caso real, OneView rastreaba
  el sitio; aquí Marketing registra la visita a mano y la transacción T2
  hace lo mismo que haría el rastreador: guarda la visita, suma puntos y, si
  el prospecto ya está Calificado, alerta al vendedor.
*/
export const VisitasPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const [form, setForm] = useState<{ prospecto_id: number | ''; pagina_visitada: string; duracion_segundos: number }>({ prospecto_id: '', pagina_visitada: '/precios', duracion_segundos: 120 })
  const [resultado, setResultado] = useState<string | null>(null)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const historial = useCarga(() => visitaService.listar({ limite: 50 }), [])

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const r = await visitaService.registrar({ ...form, prospecto_id: Number(form.prospecto_id) })
      setResultado(`+${r.puntos} puntos. El prospecto quedó con ${r.puntaje} puntos (${r.estado}).` +
        (r.alerta_generada ? ' Se envió una alerta a su vendedor.' : ''))
      historial.recargar()
    } catch (err: any) {
      setErrorEnvio(err.detail || 'No se pudo registrar la visita.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <Encabezado titulo="Visitas web" descripcion="Cada visita suma 5 puntos; la página de precios suma 15." />
      {puede.simularVisitas(user?.rol) && (
        <form className="card simulator" onSubmit={registrar}>
          <h3 className="card-title">Simulador de visitas</h3>
          <div className="form-grid-3">
            <div className="form-group"><label htmlFor="vi-prospecto">Prospecto</label>
              <SelectorProspecto id="vi-prospecto" valor={form.prospecto_id} onChange={(v) => setForm({ ...form, prospecto_id: v })} requerido /></div>
            <div className="form-group"><label htmlFor="vi-pagina">Página visitada</label>
              <select id="vi-pagina" className="input" value={form.pagina_visitada} onChange={(e) => setForm({ ...form, pagina_visitada: e.target.value })}>
                {PAGINAS.map((p) => <option key={p}>{p}</option>)}
              </select></div>
            <div className="form-group"><label htmlFor="vi-duracion">Duración (segundos)</label>
              <input id="vi-duracion" type="number" min={0} className="input" value={form.duracion_segundos}
                onChange={(e) => setForm({ ...form, duracion_segundos: Number(e.target.value) })} /></div>
          </div>
          {errorEnvio && <div className="alert alert-error" role="alert">{errorEnvio}</div>}
          {resultado && <div className="alert alert-success" role="status">{resultado}</div>}
          <button type="submit" className="btn btn-primary" disabled={enviando || !form.prospecto_id}>{enviando ? 'Registrando…' : 'Registrar visita'}</button>
        </form>
      )}

      <h3 className="section-title">Últimas visitas</h3>
      {historial.error && <ErrorCarga mensaje={historial.error} onReintentar={historial.recargar} />}
      {historial.cargando && !historial.datos ? <Cargando /> : historial.datos?.length === 0 ? <Vacio texto="Sin visitas registradas." /> : (
        <div className="table-wrapper card card-flush">
          <table className="data-table">
            <thead><tr><th>Fecha</th><th>Prospecto</th><th>Página</th><th className="num">Duración</th><th className="num">Puntos</th></tr></thead>
            <tbody>
              {historial.datos?.map((v) => (
                <tr key={v.visita_id}>
                  <td className="cell-sub">{formatoFechaHora(v.fecha_hora)}</td>
                  <td><Enlace to={`/app/prospectos/${v.prospecto_id}`}>{v.prospecto}</Enlace></td>
                  <td><code>{v.pagina_visitada}</code></td>
                  <td className="num">{v.duracion_segundos} s</td>
                  <td className="num">+{v.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

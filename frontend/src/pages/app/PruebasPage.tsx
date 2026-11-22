import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { formatoFecha } from '../../lib/formato'
import { puede } from '../../lib/roles'
import { pruebaService } from '../../services/crm/crmService'
import { Aviso, Cargando, Encabezado, ErrorCarga, Estado, Vacio } from '../../components/ui/ui'
import { FormPrueba } from '../../components/crm/Formularios'

/* RF-17 a RF-21: pruebas gratuitas de 60 días. */
export const PruebasPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const [estado, setEstado] = useState('Activa')
  const [porVencer, setPorVencer] = useState(false)
  const [nueva, setNueva] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const { datos, cargando, error, recargar } = useCarga(() => pruebaService.listar({ estado, por_vencer: porVencer }), [estado, porVencer])

  const vencer = async () => {
    const r = await pruebaService.vencer()
    setAviso(`Pruebas vencidas: ${r.pruebas_vencidas}. Alertas de "prueba por vencer" creadas: ${r.alertas_creadas}.`)
    recargar()
  }

  return (
    <div>
      <Encabezado titulo="Pruebas gratuitas" descripcion="Cada prueba dura 60 días. Los días restantes se calculan cada vez que consultas.">
        {puede.vencerPruebas(user?.rol) && <button type="button" className="btn btn-secondary" onClick={vencer}>Actualizar vencimientos</button>}
        <button type="button" className="btn btn-primary" onClick={() => setNueva(true)}>Registrar prueba</button>
      </Encabezado>
      <Aviso tipo="success" texto={aviso} onCerrar={() => setAviso(null)} />
      <div className="filter-bar">
        <div className="segmented" role="group" aria-label="Estado">
          {['Activa', 'Vencida', 'Convertida', ''].map((e) => (
            <button key={e || 'todas'} type="button" className={estado === e ? 'is-on' : ''} onClick={() => setEstado(e)}>{e || 'Todas'}</button>
          ))}
        </div>
        <label className="check"><input type="checkbox" checked={porVencer} onChange={(e) => setPorVencer(e.target.checked)} /> Solo las que vencen en 7 días o menos</label>
      </div>
      {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}
      {cargando && !datos ? <Cargando /> : datos && datos.length === 0 ? <Vacio texto="No hay pruebas con ese filtro." /> : (
        <div className="table-wrapper card card-flush">
          <table className="data-table">
            <thead><tr><th>Prospecto</th><th>Producto</th><th>Inicio</th><th>Fin</th><th className="num">Días restantes</th><th>Estado</th><th>Vendedor</th></tr></thead>
            <tbody>
              {datos?.map((p) => (
                <tr key={p.descarga_id}>
                  <td><Enlace to={`/app/prospectos/${p.prospecto_id}`} className="cell-title">{p.prospecto}</Enlace><div className="cell-sub">{p.empresa}</div></td>
                  <td>{p.producto}</td>
                  <td>{formatoFecha(p.fecha_inicio)}</td>
                  <td>{formatoFecha(p.fecha_fin)}</td>
                  <td className="num">{p.estado !== 'Activa' ? '—' : p.dias_restantes < 0
                    ? <span className="text-warning" title="Pulsa Actualizar vencimientos">Venció</span>
                    : <span className={p.dias_restantes <= 7 ? 'text-warning' : ''}>{p.dias_restantes}</span>}</td>
                  <td><Estado valor={p.estado} /></td>
                  <td className="cell-sub">{p.vendedor || 'Sin asignar'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {nueva && <FormPrueba onClose={() => setNueva(false)} onGuardado={(m) => { setNueva(false); setAviso(m); recargar() }} />}
    </div>
  )
}

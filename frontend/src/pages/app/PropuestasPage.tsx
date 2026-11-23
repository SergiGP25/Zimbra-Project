import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { formatoFecha, formatoMoneda } from '../../lib/formato'
import { puede } from '../../lib/roles'
import { propuestaService } from '../../services/crm/crmService'
import { Aviso, Cargando, Encabezado, ErrorCarga, Estado, Vacio, Paginacion, usePaginacion, SelectorProspecto } from '../../components/ui/ui'
import { FormPropuesta, FormVenta } from '../../components/crm/Formularios'

/*
  RF-32 a RF-35. Una propuesta nace Enviada (lo fija el trigger TR-02) y solo
  puede pasar a Aceptada o Rechazada una vez (TR-03). Una Aceptada sin venta
  muestra el botón para registrar la venta.
*/
export const PropuestasPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const [estado, setEstado] = useState('')
  // HU-32: filtrar también por prospecto y por fecha de emisión
  const [prospecto, setProspecto] = useState<number | ''>('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [ventana, setVentana] = useState<{ tipo: 'nueva' } | { tipo: 'venta'; id: number } | null>(null)
  const [aviso, setAviso] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)
  const { datos, cargando, error, recargar } = useCarga(
    () => propuestaService.listar({ estado, prospecto_id: prospecto || undefined, desde, hasta }),
    [estado, prospecto, desde, hasta],
  )
  const pag = usePaginacion(datos)
  const gestiona = puede.gestionarPropuestas(user?.rol)

  const responder = async (id: number, nuevo: 'Aceptada' | 'Rechazada') => {
    try {
      await propuestaService.cambiarEstado(id, nuevo)
      setAviso({ tipo: 'success', texto: `Propuesta ${id} ${nuevo.toLowerCase()}.` })
      recargar()
    } catch (err: any) {
      setAviso({ tipo: 'error', texto: err.detail || 'No se pudo cambiar el estado.' })
    }
  }
  const guardado = (m: string) => { setVentana(null); setAviso({ tipo: 'success', texto: m }); recargar() }

  return (
    <div>
      <Encabezado titulo="Propuestas" descripcion="Ofertas de productos comerciales. El valor es licencias por precio y lo calcula la base de datos.">
        {gestiona && <button type="button" className="btn btn-primary" onClick={() => setVentana({ tipo: 'nueva' })}>Crear propuesta</button>}
      </Encabezado>
      <Aviso tipo={aviso?.tipo || 'success'} texto={aviso?.texto || null} onCerrar={() => setAviso(null)} />
      <div className="filter-bar">
        <div className="segmented" role="group" aria-label="Estado">
          {['', 'Enviada', 'Aceptada', 'Rechazada'].map((e) => (
            <button key={e || 'todas'} type="button" className={estado === e ? 'is-on' : ''} onClick={() => setEstado(e)}>{e || 'Todas'}</button>
          ))}
        </div>
        <div className="filter-select"><SelectorProspecto valor={prospecto} onChange={setProspecto} textoVacio="Todos los prospectos" /></div>
        <label className="filter-group">Desde <input type="date" className="input select-filter" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
        <label className="filter-group">Hasta <input type="date" className="input select-filter" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
      </div>
      {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}
      {cargando && !datos ? <Cargando /> : datos?.length === 0 ? <Vacio texto="No hay propuestas con ese filtro." /> : (
        <div className="table-wrapper card card-flush">
          <table className="data-table">
            <thead><tr><th className="num">N.º</th><th>Prospecto</th><th>Producto</th><th className="num">Licencias</th><th className="num">Valor</th><th>Emitida</th><th>Estado</th><th>Vendedor</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {pag.visibles.map((p) => (
                <tr key={p.propuesta_id}>
                  <td className="num">{p.propuesta_id}</td>
                  <td><Enlace to={`/app/prospectos/${p.prospecto_id}`} className="cell-title">{p.prospecto}</Enlace><div className="cell-sub">{p.empresa}</div></td>
                  <td>{p.producto}<div className="cell-sub">{formatoMoneda(p.precio_unitario)} c/u</div></td>
                  <td className="num">{p.num_licencias}</td>
                  <td className="num strong">{formatoMoneda(p.valor_total)}</td>
                  <td className="cell-sub">{formatoFecha(p.fecha_emision)}</td>
                  <td><Estado valor={p.estado} /></td>
                  <td className="cell-sub">{p.vendedor}</td>
                  <td className="actions-cell">
                    {gestiona && p.estado === 'Enviada' && (
                      <>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => responder(p.propuesta_id, 'Aceptada')}>Aceptar</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => responder(p.propuesta_id, 'Rechazada')}>Rechazar</button>
                      </>
                    )}
                    {puede.registrarVentas(user?.rol) && p.estado === 'Aceptada' && !p.venta_id && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setVentana({ tipo: 'venta', id: p.propuesta_id })}>Registrar venta</button>
                    )}
                    {p.venta_id && <span className="cell-sub">Venta {p.venta_id}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginacion estado={pag} nombre="propuestas" />
      {ventana?.tipo === 'nueva' && <FormPropuesta onClose={() => setVentana(null)} onGuardado={guardado} />}
      {ventana?.tipo === 'venta' && <FormVenta propuestaId={ventana.id} onClose={() => setVentana(null)} onGuardado={guardado} />}
    </div>
  )
}

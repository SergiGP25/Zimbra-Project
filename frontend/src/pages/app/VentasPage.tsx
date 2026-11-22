import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { descargarCSV, formatoFecha, formatoMoneda } from '../../lib/formato'
import { puede } from '../../lib/roles'
import { ventaService } from '../../services/crm/crmService'
import { Aviso, Cargando, Encabezado, ErrorCarga, Estado, Indicador, Vacio } from '../../components/ui/ui'
import { FormVenta } from '../../components/crm/Formularios'

/* RF-36 a RF-39: ventas, filtro por fechas y estado de pago. */
export const VentasPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', estado: '' })
  const [nueva, setNueva] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)
  const { datos, cargando, error, recargar } = useCarga(() => ventaService.listar(filtros), [JSON.stringify(filtros)])

  const pagar = async (id: number) => {
    try {
      await ventaService.pagar(id)
      setAviso({ tipo: 'success', texto: `Venta ${id} marcada como pagada.` })
      recargar()
    } catch (err: any) {
      setAviso({ tipo: 'error', texto: err.detail || 'No se pudo marcar como pagada.' })
    }
  }

  return (
    <div>
      <Encabezado titulo="Ventas" descripcion="Cada venta nace de una propuesta aceptada y convierte al prospecto en Cliente.">
        <button type="button" className="btn btn-secondary" disabled={!datos?.ventas.length}
          onClick={() => descargarCSV('ventas', (datos?.ventas || []).map((v) => ({
            venta: v.venta_id, fecha: v.fecha_venta, cliente: v.prospecto, empresa: v.empresa, producto: v.producto,
            licencias: v.num_licencias, monto: v.monto_final, forma_pago: v.forma_pago, estado: v.estado, vendedor: v.vendedor,
          })))}>Exportar CSV</button>
        {puede.registrarVentas(user?.rol) && <button type="button" className="btn btn-primary" onClick={() => setNueva(true)}>Registrar venta</button>}
      </Encabezado>
      <Aviso tipo={aviso?.tipo || 'success'} texto={aviso?.texto || null} onCerrar={() => setAviso(null)} />
      <div className="filter-bar">
        <label className="filter-group">Desde <input type="date" className="input select-filter" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} /></label>
        <label className="filter-group">Hasta <input type="date" className="input select-filter" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} /></label>
        <select className="input select-filter" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })} aria-label="Estado de pago">
          <option value="">Pagadas y pendientes</option><option>Pendiente</option><option>Pagada</option>
        </select>
      </div>
      {datos && (
        <div className="kpi-grid kpi-grid-2">
          <Indicador etiqueta="Ventas" valor={datos.total} />
          <Indicador etiqueta="Monto total" valor={formatoMoneda(datos.monto_total)} />
        </div>
      )}
      {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}
      {cargando && !datos ? <Cargando /> : datos?.ventas.length === 0 ? <Vacio texto="No hay ventas en ese periodo." /> : (
        <div className="table-wrapper card card-flush">
          <table className="data-table">
            <thead><tr><th className="num">N.º</th><th>Fecha</th><th>Cliente</th><th>Producto</th><th className="num">Monto</th><th>Pago</th><th>Estado</th><th>Vendedor</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {datos?.ventas.map((v) => (
                <tr key={v.venta_id}>
                  <td className="num">{v.venta_id}</td>
                  <td className="cell-sub">{formatoFecha(v.fecha_venta)}</td>
                  <td><Enlace to={`/app/prospectos/${v.prospecto_id}`} className="cell-title">{v.prospecto}</Enlace><div className="cell-sub">{v.empresa}</div></td>
                  <td>{v.producto}<div className="cell-sub">{v.num_licencias} licencias</div></td>
                  <td className="num strong">{formatoMoneda(v.monto_final)}</td>
                  <td className="cell-sub">{v.forma_pago}</td>
                  <td><Estado valor={v.estado} />{v.fecha_pago && <div className="cell-sub">{formatoFecha(v.fecha_pago)}</div>}</td>
                  <td className="cell-sub">{v.vendedor}</td>
                  <td className="actions-cell">
                    {puede.marcarPagada(user?.rol) && v.estado === 'Pendiente' && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => pagar(v.venta_id)}>Marcar pagada</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {nueva && <FormVenta onClose={() => setNueva(false)} onGuardado={(m) => { setNueva(false); setAviso({ tipo: 'success', texto: m }); recargar() }} />}
    </div>
  )
}

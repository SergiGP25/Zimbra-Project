import React, { useState } from 'react'
import { useCarga } from '../../lib/useCarga'
import { descargarCSV, formatoMoneda } from '../../lib/formato'
import { reporteService } from '../../services/crm/crmService'
import { Cargando, Encabezado, ErrorCarga, Indicador, Vacio } from '../../components/ui/ui'

/*
  RF-40 a RF-46. Cada pestaña llama un endpoint que ejecuta un procedimiento
  almacenado de 07_reportes.sql (R-01 a R-06). La pantalla solo pide y dibuja:
  los cálculos los hace MySQL. Cada tabla se puede exportar a CSV (RF-45).
*/
const PESTANAS = [
  { id: 'mensual', texto: 'Ventas del mes' },
  { id: 'anual', texto: 'Resumen anual' },
  { id: 'conversion', texto: 'Conversión' },
  { id: 'campanas', texto: 'Campañas' },
  { id: 'cierre', texto: 'Tasa de cierre' },
] as const
type Pestana = typeof PESTANAS[number]['id']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const ReportesPage: React.FC<{ params: Record<string, string> }> = () => {
  const hoy = new Date()
  const [pestana, setPestana] = useState<Pestana>('mensual')
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(6)
  const [desde, setDesde] = useState(`${hoy.getFullYear()}-01-01`)
  const [hasta, setHasta] = useState(`${hoy.getFullYear()}-12-31`)

  const usaRango = pestana === 'conversion' || pestana === 'campanas' || pestana === 'cierre'

  return (
    <div>
      <Encabezado titulo="Reportes" descripcion="Indicadores calculados por procedimientos almacenados en MySQL." />
      <div className="tabs" role="tablist">
        {PESTANAS.map((p) => (
          <button key={p.id} role="tab" aria-selected={pestana === p.id} className={pestana === p.id ? 'is-on' : ''} onClick={() => setPestana(p.id)}>{p.texto}</button>
        ))}
      </div>

      <div className="filter-bar">
        {(pestana === 'mensual' || pestana === 'anual') && (
          <label className="filter-group">Año
            <input type="number" className="input select-filter" min={2020} max={2100} value={anio} onChange={(e) => setAnio(Number(e.target.value))} /></label>
        )}
        {pestana === 'mensual' && (
          <label className="filter-group">Mes
            <select className="input select-filter" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select></label>
        )}
        {usaRango && (
          <>
            <label className="filter-group">Desde <input type="date" className="input select-filter" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
            <label className="filter-group">Hasta <input type="date" className="input select-filter" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
          </>
        )}
      </div>

      {pestana === 'mensual' && <VentasMensual anio={anio} mes={mes} />}
      {pestana === 'anual' && <ResumenAnual anio={anio} />}
      {pestana === 'conversion' && <Conversion desde={desde} hasta={hasta} />}
      {pestana === 'campanas' && <Campanas desde={desde} hasta={hasta} />}
      {pestana === 'cierre' && <TasaCierre desde={desde} hasta={hasta} />}
    </div>
  )
}

const VentasMensual: React.FC<{ anio: number; mes: number }> = ({ anio, mes }) => {
  const { datos, cargando, error, recargar } = useCarga(() => reporteService.ventasMensual(anio, mes), [anio, mes])
  if (cargando) return <Cargando />
  if (error || !datos) return <ErrorCarga mensaje={error || 'Sin datos'} onReintentar={recargar} />
  const t = datos.total
  return (
    <>
      <div className="kpi-grid">
        <Indicador etiqueta="Ventas del mes" valor={t.num_ventas ?? 0} />
        <Indicador etiqueta="Monto" valor={formatoMoneda(t.monto_total)} destacado />
        <Indicador etiqueta="Pagadas" valor={Number(t.pagadas ?? 0)} />
        <Indicador etiqueta="Pendientes de pago" valor={Number(t.pendientes ?? 0)} />
      </div>
      <TablaReporte titulo={`Ventas por vendedor, ${MESES[mes - 1].toLowerCase()} de ${anio}`} archivo={`ventas-${anio}-${mes}`} filas={datos.detalle}
        columnas={[['vendedor', 'Vendedor'], ['num_ventas', 'Ventas'], ['monto_total', 'Monto', 'moneda'], ['ticket_promedio', 'Ticket promedio', 'moneda'], ['pct_del_mes', '% del mes', 'pct']]}
        vacio="No hubo ventas en ese mes. Prueba con junio de 2026, que tiene datos de ejemplo." />
    </>
  )
}

const ResumenAnual: React.FC<{ anio: number }> = ({ anio }) => {
  const { datos, cargando, error, recargar } = useCarga(() => reporteService.resumenAnual(anio), [anio])
  if (cargando) return <Cargando />
  if (error || !datos) return <ErrorCarga mensaje={error || 'Sin datos'} onReintentar={recargar} />
  const max = Math.max(1, ...datos.map((m) => Number(m.monto)))
  return (
    <>
      <section className="card">
        <h3 className="card-title">Monto vendido por mes en {anio}</h3>
        {/* Gráfico de barras hecho con CSS: la altura de cada barra es su porcentaje del mes más alto */}
        <div className="bars" role="img" aria-label={`Ventas por mes de ${anio}`}>
          {datos.map((m) => (
            <div key={m.mes} className="bar-col" title={`${MESES[m.mes - 1]}: ${formatoMoneda(m.monto)}`}>
              <span className="bar-value">{Number(m.monto) > 0 ? formatoMoneda(m.monto).replace(/,\d+$/, '') : ''}</span>
              <span className="bar" style={{ height: `${(Number(m.monto) / max) * 100}%` }} />
              <span className="bar-label">{MESES[m.mes - 1].slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </section>
      <TablaReporte titulo="Detalle mes a mes" archivo={`resumen-${anio}`} filas={datos.map((m) => ({ ...m, mes: MESES[m.mes - 1] }))}
        columnas={[['mes', 'Mes'], ['prospectos_nuevos', 'Prospectos nuevos'], ['pruebas', 'Pruebas'], ['propuestas', 'Propuestas'], ['ventas', 'Ventas'], ['monto', 'Monto', 'moneda']]} vacio="" />
    </>
  )
}

const Conversion: React.FC<{ desde: string; hasta: string }> = ({ desde, hasta }) => {
  const { datos, cargando, error, recargar } = useCarga(() => reporteService.conversion({ desde, hasta }), [desde, hasta])
  const embudo = useCarga(() => reporteService.embudo(), [])
  if (cargando) return <Cargando />
  if (error || !datos) return <ErrorCarga mensaje={error || 'Sin datos'} onReintentar={recargar} />
  return (
    <>
      <div className="kpi-grid">
        <Indicador etiqueta="Pruebas descargadas" valor={datos.pruebas_descargadas ?? 0} />
        <Indicador etiqueta="Terminaron en venta" valor={Number(datos.pruebas_convertidas ?? 0)} />
        <Indicador etiqueta="Conversión" valor={`${datos.pct_conversion ?? 0} %`} destacado />
        <Indicador etiqueta="Activas / vencidas" valor={`${Number(datos.pruebas_activas ?? 0)} / ${Number(datos.pruebas_vencidas ?? 0)}`} />
      </div>
      {embudo.datos && (
        <TablaReporte titulo="Embudo actual de prospectos" archivo="embudo" filas={embudo.datos}
          columnas={[['estado', 'Estado'], ['prospectos', 'Prospectos'], ['pct_total', '% del total', 'pct']]} vacio="" />
      )}
    </>
  )
}

const Campanas: React.FC<{ desde: string; hasta: string }> = ({ desde, hasta }) => {
  const { datos, cargando, error, recargar } = useCarga(() => reporteService.campanas({ desde, hasta }), [desde, hasta])
  if (cargando) return <Cargando />
  if (error || !datos) return <ErrorCarga mensaje={error || 'Sin datos'} onReintentar={recargar} />
  return (
    <TablaReporte titulo="Rendimiento por campaña" archivo="campanas" filas={datos}
      columnas={[['nombre', 'Campaña'], ['canal', 'Canal'], ['presupuesto', 'Presupuesto', 'moneda'], ['prospectos', 'Prospectos'], ['pruebas', 'Pruebas'], ['ventas', 'Ventas'], ['monto_vendido', 'Vendido', 'moneda'], ['costo_por_venta', 'Costo por venta', 'moneda']]}
      vacio="No hay campañas en ese rango." />
  )
}

const TasaCierre: React.FC<{ desde: string; hasta: string }> = ({ desde, hasta }) => {
  const { datos, cargando, error, recargar } = useCarga(() => reporteService.tasaCierre({ desde, hasta }), [desde, hasta])
  if (cargando) return <Cargando />
  if (error || !datos) return <ErrorCarga mensaje={error || 'Sin datos'} onReintentar={recargar} />
  const tasa = Number(datos.tasa_cierre_pct ?? 0)
  return (
    <section className="card">
      <div className="kpi-grid">
        <Indicador etiqueta="Prospectos calificados" valor={datos.calificados ?? 0} />
        <Indicador etiqueta="Cerrados (Clientes)" valor={Number(datos.cerrados ?? 0)} />
        <Indicador etiqueta="Tasa de cierre" valor={`${tasa} %`} destacado />
      </div>
      {/* Meta del caso: Zimbra pasó de 10 % a 15 % de cierre con OneView */}
      <div className="goal">
        <div className="goal-track">
          <span className="goal-fill" style={{ width: `${Math.min(tasa, 100)}%` }} />
          <span className="goal-mark" style={{ left: '10%' }}><span>10 % antes</span></span>
          <span className="goal-mark goal-mark-abajo" style={{ left: '15%' }}><span>15 % meta</span></span>
        </div>
        <p className="text-muted">En el caso, Zimbra subió su tasa de cierre del 10 % al 15 % al usar las alertas de OneView.</p>
      </div>
    </section>
  )
}

type Columna = [clave: string, titulo: string, formato?: 'moneda' | 'pct']

const TablaReporte: React.FC<{ titulo: string; archivo: string; filas: Record<string, any>[]; columnas: Columna[]; vacio: string }> = ({ titulo, archivo, filas, columnas, vacio }) => {
  const mostrar = (v: unknown, f?: string) => (f === 'moneda' ? formatoMoneda(v as number) : f === 'pct' ? (v == null ? '—' : `${v} %`) : String(v ?? '—'))
  return (
    <section className="card card-flush">
      <div className="card-head">
        <h3 className="card-title">{titulo}</h3>
        <button type="button" className="btn btn-secondary btn-sm" disabled={!filas.length}
          onClick={() => descargarCSV(archivo, filas.map((f) => Object.fromEntries(columnas.map(([c, t]) => [t, f[c]]))))}>Exportar CSV</button>
      </div>
      {filas.length === 0 ? <Vacio texto={vacio} /> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr>{columnas.map(([c, t, f]) => <th key={c} className={f || typeof filas[0][c] === 'number' ? 'num' : ''}>{t}</th>)}</tr></thead>
            <tbody>
              {filas.map((fila, i) => (
                <tr key={i}>{columnas.map(([c, , f]) => <td key={c} className={f || typeof fila[c] === 'number' ? 'num' : ''}>{mostrar(fila[c], f)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

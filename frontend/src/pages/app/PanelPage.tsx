import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { formatoMoneda } from '../../lib/formato'
import { reporteService } from '../../services/crm/crmService'
import { Cargando, ErrorCarga } from '../../components/ui/ui'
import { GraficaBarras, GraficaLinea, Sparkline } from '../../components/crm/Graficas'
import { Icono } from '../../components/ui/Iconos'

const ESTADOS = ['Nuevo', 'En prueba', 'Calificado', 'Cliente', 'Descartado'] as const
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** "2026-11" -> "Nov" */
const nombreMes = (m: string) => MESES[Number(m.slice(5, 7)) - 1]

/** Pesos abreviados para los ejes: 12.500.000 -> "$ 12,5 M" */
const pesosCortos = (n: number) =>
  n >= 1_000_000 ? `$ ${(n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`
    : n >= 1_000 ? `$ ${Math.round(n / 1_000)} mil` : `$ ${Math.round(n)}`

/** Variación contra el mes anterior, en porcentaje (null si no hay base para comparar) */
const variacion = (actual: number, anterior: number) => (anterior > 0 ? ((actual - anterior) / anterior) * 100 : null)

/*
  Panel de inicio (RF-46). Los números vienen de GET /reportes/panel, que
  filtra por el vendedor cuando el rol es Vendedor (RN-12): cada vendedor ve
  sus propias gráficas.
  - Tres indicadores del mes con su mini-gráfica de 12 meses.
  - Pendientes de hoy (alertas, pruebas por vencer, propuestas, cobros).
  - Ventas por mes (línea) y embudo de prospectos (barras).
  - Productos más vendidos.
*/
export const PanelPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const { datos, cargando, error, recargar } = useCarga(() => reporteService.panel(), [])
  const [medida, setMedida] = useState<'monto' | 'ventas'>('monto')

  if (cargando) return <Cargando />
  if (error || !datos) return <ErrorCarga mensaje={error || 'Sin datos'} onReintentar={recargar} />

  const serie = datos.serie_meses || []
  const actual = serie[serie.length - 1]
  const anterior = serie[serie.length - 2]
  const esVendedor = user?.rol === 'Vendedor'
  const totalProspectos = ESTADOS.reduce((s, e) => s + (datos.prospectos_por_estado[e] || 0), 0)
  const top = datos.productos_top || []
  const montoTop = top.reduce((s, p) => s + p.monto, 0) || 1

  const tarjetas = actual ? [
    { titulo: 'Ventas de este mes', valor: formatoMoneda(datos.monto_mes), cambio: variacion(actual.monto, anterior?.monto ?? 0),
      serie: serie.map((m) => m.monto), ir: '/app/ventas' },
    { titulo: 'Prospectos nuevos', valor: String(actual.prospectos), cambio: variacion(actual.prospectos, anterior?.prospectos ?? 0),
      serie: serie.map((m) => m.prospectos), ir: '/app/prospectos' },
    { titulo: 'Pruebas activadas', valor: String(actual.pruebas), cambio: variacion(actual.pruebas, anterior?.pruebas ?? 0),
      serie: serie.map((m) => m.pruebas), ir: '/app/pruebas' },
  ] : []

  const pendientes = [
    { texto: 'Alertas sin atender', valor: datos.alertas_pendientes, ir: '/app/alertas', icono: 'alertas' },
    { texto: 'Pruebas por vencer', valor: datos.pruebas_por_vencer, ir: '/app/pruebas', icono: 'pruebas' },
    { texto: 'Propuestas sin respuesta', valor: datos.propuestas_enviadas, ir: '/app/propuestas', icono: 'propuestas' },
    { texto: 'Ventas sin pagar', valor: datos.ventas_pendientes_pago, ir: '/app/ventas', icono: 'ventas' },
  ]

  return (
    <div className="panel">
      <div className="page-header">
        <div>
          <h2>Hola, {user?.nombre.split(' ')[0]}</h2>
          <p className="text-muted">{esVendedor ? 'Así van tus prospectos y tus ventas.' : 'Así va el proceso comercial de Zimbra.'}</p>
        </div>
      </div>

      <div className="panel-kpis">
        {tarjetas.map((t) => (
          <Enlace key={t.titulo} to={t.ir} className="kpi-tarjeta">
            <span className="kpi-tarjeta-titulo">{t.titulo}</span>
            <span className="kpi-tarjeta-valor">{t.valor}</span>
            <span className="kpi-tarjeta-pie">
              {t.cambio !== null ? (
                <span className={`kpi-cambio ${t.cambio >= 0 ? 'sube' : 'baja'}`}>
                  <Icono nombre={t.cambio >= 0 ? 'sube' : 'baja'} tamano={14} />
                  {Math.abs(t.cambio).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %
                </span>
              ) : <span className="kpi-cambio">Sin datos</span>}
              <span className="text-muted">vs. mes anterior</span>
            </span>
            <Sparkline valores={t.serie} />
          </Enlace>
        ))}
      </div>

      <div className="panel-pendientes" aria-label="Pendientes">
        {pendientes.map((p) => (
          <Enlace key={p.texto} to={p.ir} className={`pendiente${p.valor > 0 ? ' hay' : ''}`}>
            <Icono nombre={p.icono} tamano={18} />
            <span className="pendiente-valor">{p.valor}</span>
            <span className="pendiente-texto">{p.texto}</span>
          </Enlace>
        ))}
      </div>

      <div className="panel-graficas">
        <section className="card panel-card">
          <div className="panel-card-cabeza">
            <h3>{esVendedor ? 'Tus ventas por mes' : 'Ventas por mes'}</h3>
            <div className="segmented" role="group" aria-label="Medida">
              <button type="button" className={medida === 'monto' ? 'is-on' : ''} onClick={() => setMedida('monto')}>Monto</button>
              <button type="button" className={medida === 'ventas' ? 'is-on' : ''} onClick={() => setMedida('ventas')}>Número</button>
            </div>
          </div>
          <GraficaLinea
            etiquetas={serie.map((m) => nombreMes(m.mes))}
            valores={serie.map((m) => (medida === 'monto' ? m.monto : m.ventas))}
            formato={medida === 'monto' ? pesosCortos : (n) => String(Math.round(n))}
            descripcion={`Ventas de los últimos 12 meses, ${medida === 'monto' ? 'en pesos' : 'en número de ventas'}`}
          />
        </section>

        <section className="card panel-card">
          <div className="panel-card-cabeza">
            <h3>Embudo</h3>
            <span className="text-muted">{totalProspectos} prospectos</span>
          </div>
          <GraficaBarras
            etiquetas={['Nuevo', 'Prueba', 'Calif.', 'Cliente', 'Desc.']}
            valores={ESTADOS.map((e) => datos.prospectos_por_estado[e] || 0)}
            descripcion="Prospectos por estado: nuevo, en prueba, calificado, cliente y descartado"
          />
        </section>
      </div>

      <section className="card panel-card">
        <div className="panel-card-cabeza">
          <h3>{esVendedor ? 'Lo que más has vendido' : 'Productos más vendidos'}</h3>
          <Enlace to="/app/ventas" className="btn btn-secondary btn-sm">Ver ventas</Enlace>
        </div>
        {top.length === 0 ? (
          <p className="text-muted">Todavía no hay ventas registradas.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Producto</th><th className="num">Ventas</th><th className="num">Licencias</th><th className="num">Monto</th><th>Participación</th></tr></thead>
              <tbody>
                {top.map((p) => {
                  const pct = Math.round((p.monto / montoTop) * 100)
                  return (
                    <tr key={p.producto_id}>
                      <td className="cell-title">{p.nombre}</td>
                      <td className="num">{p.ventas}</td>
                      <td className="num">{p.licencias}</td>
                      <td className="num strong">{formatoMoneda(p.monto)}</td>
                      <td>
                        <span className="participacion">
                          <span className="participacion-barra"><span style={{ width: `${pct}%` }} /></span>
                          {pct} %
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

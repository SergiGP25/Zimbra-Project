import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { formatoFechaHora } from '../../lib/formato'
import { alertaService } from '../../services/crm/crmService'
import { Cargando, Encabezado, ErrorCarga, Estado, Vacio } from '../../components/ui/ui'

/*
  RF-27 y RF-28: bandeja de alertas. Las crean la transacción T2 (un
  prospecto calificado visitó el sitio) y el proceso de vencimiento
  (prueba por vencer). El vendedor ve solo las suyas.
*/
export const AlertasPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const [soloPendientes, setSoloPendientes] = useState(true)
  const { datos, cargando, error, recargar, setDatos } = useCarga(() => alertaService.listar(soloPendientes), [soloPendientes])

  const atender = async (id: number) => {
    await alertaService.atender(id)
    // Actualización optimista: se quita de la lista sin esperar a recargar
    setDatos((lista) => (lista || []).filter((a) => !soloPendientes || a.alerta_id !== id).map((a) => (a.alerta_id === id ? { ...a, atendida: true } : a)))
  }

  return (
    <div>
      <Encabezado titulo="Alertas" descripcion={user?.rol === 'Vendedor' ? 'Prospectos tuyos que necesitan atención.' : 'Alertas de todos los vendedores.'}>
        <label className="check">
          <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} /> Solo pendientes
        </label>
      </Encabezado>
      {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}
      {cargando && !datos ? <Cargando /> : datos && datos.length === 0 ? (
        <Vacio texto={soloPendientes ? 'No tienes alertas pendientes.' : 'No hay alertas.'} />
      ) : (
        <ul className="alert-list">
          {datos?.map((a) => (
            <li key={a.alerta_id} className={`alert-item${a.atendida ? ' is-done' : ''}`}>
              <span className={`alert-dot ${a.motivo === 'Prueba por vencer' ? 'dot-warning' : 'dot-flag'}`} aria-hidden="true" />
              <div className="alert-body">
                <div className="alert-line">
                  <Enlace to={`/app/prospectos/${a.prospecto_id}`} className="cell-title">{a.prospecto}</Enlace>
                  <span className="cell-sub">{formatoFechaHora(a.fecha_hora)}</span>
                </div>
                <div className="cell-sub">
                  {a.motivo === 'Visita al sitio' ? 'Volvió a visitar el sitio.' : 'Su prueba gratuita vence en 7 días o menos.'}
                  {' '}{a.empresa}{user?.rol !== 'Vendedor' && `, vendedor: ${a.vendedor}`}
                </div>
              </div>
              <Estado valor={a.estado_prospecto} />
              <span className="score">{a.puntaje}</span>
              {!a.atendida && <button type="button" className="btn btn-secondary btn-sm" onClick={() => atender(a.alerta_id)}>Marcar atendida</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { formatoFechaHora } from '../../lib/formato'
import { puede } from '../../lib/roles'
import { interaccionService } from '../../services/crm/crmService'
import { Aviso, Cargando, Encabezado, ErrorCarga, Estado, Vacio } from '../../components/ui/ui'
import { FormInteraccion } from '../../components/crm/Formularios'

/* RF-29 a RF-31: llamadas y correos del equipo de ventas. */
export const InteraccionesPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const [tipo, setTipo] = useState('')
  const [resultado, setResultado] = useState('')
  const [nueva, setNueva] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const { datos, cargando, error, recargar } = useCarga(() => interaccionService.listar({ tipo, resultado }), [tipo, resultado])

  return (
    <div>
      <Encabezado titulo="Interacciones" descripcion="Llamadas y correos con los prospectos. Las positivas suman 10 puntos.">
        {puede.registrarInteracciones(user?.rol) && <button type="button" className="btn btn-primary" onClick={() => setNueva(true)}>Registrar interacción</button>}
      </Encabezado>
      <Aviso tipo="success" texto={aviso} onCerrar={() => setAviso(null)} />
      <div className="filter-bar">
        <select className="input select-filter" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo">
          <option value="">Llamadas y correos</option><option>Llamada</option><option>Correo</option>
        </select>
        <select className="input select-filter" value={resultado} onChange={(e) => setResultado(e.target.value)} aria-label="Resultado">
          <option value="">Todos los resultados</option><option>Positivo</option><option>Neutro</option><option>Negativo</option><option>Sin respuesta</option>
        </select>
      </div>
      {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}
      {cargando && !datos ? <Cargando /> : datos?.length === 0 ? <Vacio texto="No hay interacciones con ese filtro." /> : (
        <div className="table-wrapper card card-flush">
          <table className="data-table">
            <thead><tr><th>Fecha</th><th>Prospecto</th><th>Tipo</th><th>Resultado</th><th>Notas</th><th>Registró</th></tr></thead>
            <tbody>
              {datos?.map((i) => (
                <tr key={i.interaccion_id}>
                  <td className="cell-sub">{formatoFechaHora(i.fecha_hora)}</td>
                  <td><Enlace to={`/app/prospectos/${i.prospecto_id}`} className="cell-title">{i.prospecto}</Enlace><div className="cell-sub">{i.empresa}</div></td>
                  <td>{i.tipo}</td>
                  <td><Estado valor={i.resultado} /></td>
                  <td className="cell-notes">{i.notas}</td>
                  <td className="cell-sub">{i.empleado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {nueva && <FormInteraccion onClose={() => setNueva(false)} onGuardado={(m) => { setNueva(false); setAviso(m); recargar() }} />}
    </div>
  )
}

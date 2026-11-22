import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { useCarga } from '../../lib/useCarga'
import { formatoFecha, formatoMoneda, hoyISO } from '../../lib/formato'
import { puede } from '../../lib/roles'
import { campanaService } from '../../services/crm/crmService'
import { Campana } from '../../types/crm/crmTypes'
import { Aviso, Cargando, Encabezado, ErrorCarga, Modal, Vacio } from '../../components/ui/ui'

/* RF-12 y RF-13: campañas de marketing y lo que produjo cada una (RF-42). */
export const CampanasPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const [canal, setCanal] = useState('')
  const [editando, setEditando] = useState<Campana | 'nueva' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const { datos, cargando, error, recargar } = useCarga(() => campanaService.listar({ canal }), [canal])

  return (
    <div>
      <Encabezado titulo="Campañas" descripcion="De dónde llegan los prospectos y cuánto vendió cada campaña.">
        {puede.gestionarCampanas(user?.rol) && <button type="button" className="btn btn-primary" onClick={() => setEditando('nueva')}>Crear campaña</button>}
      </Encabezado>
      <Aviso tipo="success" texto={aviso} onCerrar={() => setAviso(null)} />
      <div className="filter-bar">
        <div className="segmented" role="group" aria-label="Canal">
          {['', 'Email', 'Web', 'Referido'].map((c) => (
            <button key={c || 'todos'} type="button" className={canal === c ? 'is-on' : ''} onClick={() => setCanal(c)}>{c || 'Todos los canales'}</button>
          ))}
        </div>
      </div>
      {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}
      {cargando && !datos ? <Cargando /> : datos?.campanas.length === 0 ? <Vacio texto="No hay campañas." /> : (
        <div className="table-wrapper card card-flush">
          <table className="data-table">
            <thead><tr><th>Campaña</th><th>Canal</th><th>Vigencia</th><th className="num">Presupuesto</th><th className="num">Prospectos</th><th className="num">Pruebas</th><th className="num">Ventas</th><th className="num">Vendido</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {datos?.campanas.map((c) => (
                <tr key={c.campana_id}>
                  <td className="cell-title">{c.nombre}{c.vigente && <span className="tag">Vigente</span>}</td>
                  <td>{c.canal}</td>
                  <td className="cell-sub">{formatoFecha(c.fecha_inicio)} a {c.fecha_fin ? formatoFecha(c.fecha_fin) : 'sin fin'}</td>
                  <td className="num">{formatoMoneda(c.presupuesto)}</td>
                  <td className="num">{c.prospectos}</td>
                  <td className="num">{c.pruebas}</td>
                  <td className="num">{c.ventas}</td>
                  <td className="num strong">{formatoMoneda(c.monto_vendido)}</td>
                  <td className="actions-cell">
                    {puede.gestionarCampanas(user?.rol) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditando(c)}>Editar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editando && <FormCampana campana={editando === 'nueva' ? undefined : editando} onClose={() => setEditando(null)}
        onGuardado={(m) => { setEditando(null); setAviso(m); recargar() }} />}
    </div>
  )
}

const FormCampana: React.FC<{ campana?: Campana; onClose: () => void; onGuardado: (m: string) => void }> = ({ campana, onClose, onGuardado }) => {
  const [form, setForm] = useState({
    nombre: campana?.nombre || '', canal: campana?.canal || 'Email', fecha_inicio: campana?.fecha_inicio || hoyISO(),
    fecha_fin: campana?.fecha_fin || '', presupuesto: campana ? Number(campana.presupuesto) : 0,
  })
  const [error, setError] = useState<string | null>(null)
  const cambiar = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value })

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const datos = { ...form, fecha_fin: form.fecha_fin || null } as Partial<Campana>
      if (campana) await campanaService.editar(campana.campana_id, datos)
      else await campanaService.crear(datos)
      onGuardado(campana ? 'Campaña actualizada.' : 'Campaña creada.')
    } catch (err: any) {
      setError(err.detail || 'No se pudo guardar.')
    }
  }

  return (
    <Modal titulo={campana ? 'Editar campaña' : 'Crear campaña'} onClose={onClose}>
      <form onSubmit={enviar}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="form-group"><label htmlFor="c-nombre">Nombre</label>
          <input id="c-nombre" name="nombre" className="input" value={form.nombre} onChange={cambiar} required minLength={3} /></div>
        <div className="form-grid-2">
          <div className="form-group"><label htmlFor="c-canal">Canal</label>
            <select id="c-canal" name="canal" className="input" value={form.canal} onChange={cambiar}><option>Email</option><option>Web</option><option>Referido</option></select></div>
          <div className="form-group"><label htmlFor="c-presupuesto">Presupuesto (USD)</label>
            <input id="c-presupuesto" name="presupuesto" type="number" min={0} step="0.01" className="input" value={form.presupuesto} onChange={cambiar} /></div>
          <div className="form-group"><label htmlFor="c-inicio">Inicio</label>
            <input id="c-inicio" name="fecha_inicio" type="date" className="input" value={form.fecha_inicio} onChange={cambiar} required /></div>
          <div className="form-group"><label htmlFor="c-fin">Fin <span className="optional">(opcional)</span></label>
            <input id="c-fin" name="fecha_fin" type="date" className="input" value={form.fecha_fin} min={form.fecha_inicio} onChange={cambiar} /></div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{campana ? 'Guardar cambios' : 'Crear campaña'}</button>
        </div>
      </form>
    </Modal>
  )
}

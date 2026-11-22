import React, { useState } from 'react'
import { Modal } from '../ui/ui'
import { prospectoService } from '../../services/crm/crmService'
import { Catalogos, Prospecto } from '../../types/crm/crmTypes'
import { useAuth } from '../../hooks/auth/useAuth'

/*
  Ventanas del módulo de prospectos. Cada una:
  1. guarda lo que escribe el usuario en useState,
  2. llama al servicio al enviar,
  3. muestra el error de la API si algo falla (por ejemplo, correo repetido),
  4. avisa a la pantalla con onGuardado() para que recargue la tabla.
*/

interface BaseProps {
  onClose: () => void
  onGuardado: (mensaje: string) => void
}

/** RF-05 y RF-07: registrar o editar. */
export const FormularioProspecto: React.FC<BaseProps & { catalogos: Catalogos; prospecto?: Prospecto }> = ({ catalogos, prospecto, onClose, onGuardado }) => {
  const { user } = useAuth()
  const editando = !!prospecto
  const [form, setForm] = useState({
    nombre: prospecto?.nombre || '',
    empresa: prospecto?.empresa || '',
    email: prospecto?.email || '',
    telefono: prospecto?.telefono || '',
    campana_id: prospecto?.campana_id || catalogos.campanas[0]?.campana_id || 0,
    empleado_id: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cambiar = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.name.endsWith('_id') ? Number(e.target.value) : e.target.value }))

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const datos = { nombre: form.nombre, empresa: form.empresa, email: form.email, telefono: form.telefono, campana_id: form.campana_id }
      if (editando) {
        await prospectoService.editar(prospecto!.prospecto_id, datos)
        onGuardado('Prospecto actualizado.')
      } else {
        await prospectoService.crear({ ...datos, empleado_id: form.empleado_id || null })
        onGuardado('Prospecto registrado como Nuevo con 0 puntos.')
      }
    } catch (err: any) {
      setError(err.detail || 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={editando ? 'Editar prospecto' : 'Registrar prospecto'} onClose={onClose} ancho={560}>
      <form onSubmit={enviar}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="p-nombre">Nombre</label>
            <input id="p-nombre" name="nombre" className="input" value={form.nombre} onChange={cambiar} required minLength={2} />
          </div>
          <div className="form-group">
            <label htmlFor="p-empresa">Empresa <span className="optional">(opcional)</span></label>
            <input id="p-empresa" name="empresa" className="input" value={form.empresa} onChange={cambiar} />
          </div>
          <div className="form-group">
            <label htmlFor="p-email">Correo</label>
            <input id="p-email" name="email" type="email" className="input" value={form.email} onChange={cambiar} required />
          </div>
          <div className="form-group">
            <label htmlFor="p-telefono">Teléfono <span className="optional">(opcional)</span></label>
            <input id="p-telefono" name="telefono" className="input" value={form.telefono} onChange={cambiar} />
          </div>
          <div className="form-group">
            <label htmlFor="p-campana">Campaña de origen</label>
            <select id="p-campana" name="campana_id" className="input" value={form.campana_id} onChange={cambiar} required>
              {catalogos.campanas.map((c) => <option key={c.campana_id} value={c.campana_id}>{c.nombre} ({c.canal})</option>)}
            </select>
          </div>
          {!editando && user?.rol !== 'Vendedor' && (
            <div className="form-group">
              <label htmlFor="p-vendedor">Vendedor <span className="optional">(opcional)</span></label>
              <select id="p-vendedor" name="empleado_id" className="input" value={form.empleado_id} onChange={cambiar}>
                <option value={0}>Sin asignar</option>
                {catalogos.vendedores.map((v) => <option key={v.empleado_id} value={v.empleado_id}>{v.nombre}</option>)}
              </select>
            </div>
          )}
        </div>
        {!editando && user?.rol === 'Vendedor' && <p className="text-muted">Quedará asignado a ti.</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar prospecto'}</button>
        </div>
      </form>
    </Modal>
  )
}

/** RF-08: solo ofrece las transiciones que el backend permite (RN-10). */
export const CambiarEstado: React.FC<BaseProps & { prospecto: Prospecto }> = ({ prospecto, onClose, onGuardado }) => {
  const [estado, setEstado] = useState(prospecto.transiciones_permitidas[0] || '')
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await prospectoService.cambiarEstado(prospecto.prospecto_id, estado)
      onGuardado(`${prospecto.nombre} pasó a ${estado}.`)
    } catch (err: any) {
      setError(err.detail || 'No se pudo cambiar el estado.')
    }
  }

  return (
    <Modal titulo={`Cambiar estado de ${prospecto.nombre}`} onClose={onClose}>
      <form onSubmit={enviar}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <p>Estado actual: <strong>{prospecto.estado}</strong></p>
        {prospecto.transiciones_permitidas.length === 0 ? (
          <p className="text-muted">Un Cliente ya cerró su compra; su estado no cambia a mano.</p>
        ) : (
          <div className="form-group">
            <label htmlFor="nuevo-estado">Nuevo estado</label>
            <select id="nuevo-estado" className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
              {prospecto.transiciones_permitidas.map((t) => <option key={t}>{t}</option>)}
            </select>
            <p className="field-help">El paso a Cliente lo hace el sistema al registrar la venta.</p>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={!estado}>Cambiar estado</button>
        </div>
      </form>
    </Modal>
  )
}

/** RF-09: transacción T5. Las alertas pendientes pasan al nuevo vendedor. */
export const AsignarVendedor: React.FC<BaseProps & { prospecto: Prospecto; catalogos: Catalogos }> = ({ prospecto, catalogos, onClose, onGuardado }) => {
  const [vendedor, setVendedor] = useState<number>(catalogos.vendedores.find((v) => v.empleado_id !== prospecto.empleado_id)?.empleado_id || 0)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const r = await prospectoService.asignar(prospecto.prospecto_id, vendedor)
      onGuardado(`Asignado a ${r.prospecto.vendedor_nombre}. Alertas trasladadas: ${r.alertas_movidas}.`)
    } catch (err: any) {
      setError(err.detail || 'No se pudo asignar.')
    }
  }

  return (
    <Modal titulo={`Asignar vendedor a ${prospecto.nombre}`} onClose={onClose}>
      <form onSubmit={enviar}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <p>Vendedor actual: <strong>{prospecto.vendedor_nombre || 'Sin asignar'}</strong></p>
        <div className="form-group">
          <label htmlFor="nuevo-vendedor">Nuevo vendedor</label>
          <select id="nuevo-vendedor" className="input" value={vendedor} onChange={(e) => setVendedor(Number(e.target.value))}>
            {catalogos.vendedores.map((v) => <option key={v.empleado_id} value={v.empleado_id}>{v.nombre}</option>)}
          </select>
          <p className="field-help">Sus alertas sin atender pasan al nuevo vendedor en la misma transacción (T5).</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={!vendedor || vendedor === prospecto.empleado_id}>Asignar</button>
        </div>
      </form>
    </Modal>
  )
}

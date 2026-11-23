import React, { useState } from 'react'
import { Modal, SelectorProspecto } from '../ui/ui'
import { useCarga } from '../../lib/useCarga'
import { formatoMoneda } from '../../lib/formato'
import {
  interaccionService, productoService, propuestaService, pruebaService, ventaService,
} from '../../services/crm/crmService'

/*
  Formularios de las transacciones del proceso comercial.
  Cada uno llama a un endpoint que ejecuta un procedimiento almacenado:
    FormPrueba      -> POST /pruebas        -> T1 sp_registrar_descarga
    FormInteraccion -> POST /interacciones  -> T3 sp_registrar_interaccion
    FormPropuesta   -> POST /propuestas     -> INSERT + trigger TR-02
    FormVenta       -> POST /ventas         -> T4 sp_registrar_venta
  Si se pasa prospectoId (desde la ficha), el prospecto queda fijo.
*/

interface Props {
  prospectoId?: number
  onClose: () => void
  onGuardado: (mensaje: string) => void
}

// Hook pequeño para el estado común: error y "guardando"
function useEnvio() {
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const ejecutar = async (accion: () => Promise<void>) => {
    setGuardando(true)
    setError(null)
    try {
      await accion()
    } catch (err: any) {
      setError(err.detail || 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }
  return { error, guardando, ejecutar }
}

const Acciones: React.FC<{ onClose: () => void; guardando: boolean; texto: string; deshabilitado?: boolean }> = ({ onClose, guardando, texto, deshabilitado }) => (
  <div className="modal-actions">
    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
    <button type="submit" className="btn btn-primary" disabled={guardando || deshabilitado}>{guardando ? 'Guardando…' : texto}</button>
  </div>
)

export const FormPrueba: React.FC<Props> = ({ prospectoId, onClose, onGuardado }) => {
  const [prospecto, setProspecto] = useState<number | ''>(prospectoId || '')
  const [producto, setProducto] = useState<number | ''>('')
  const productos = useCarga(() => productoService.listar({ version: 'Gratuita', activo: true }), [])
  const { error, guardando, ejecutar } = useEnvio()

  return (
    <Modal titulo="Registrar descarga de prueba" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); ejecutar(async () => {
        const p = await pruebaService.registrar(Number(prospecto), Number(producto))
        onGuardado(`Prueba de ${p.producto} activa hasta el ${p.fecha_fin}. El prospecto sumó 20 puntos.`)
      }) }}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {!prospectoId && (
          <div className="form-group"><label htmlFor="pr-prospecto">Prospecto</label>
            <SelectorProspecto id="pr-prospecto" valor={prospecto} onChange={setProspecto} excluirEstados={['Cliente', 'Descartado']} requerido /></div>
        )}
        <div className="form-group"><label htmlFor="pr-producto">Producto gratuito</label>
          <select id="pr-producto" className="input" value={producto} onChange={(e) => setProducto(Number(e.target.value) || '')} required>
            <option value="">Elige un producto</option>
            {productos.datos?.productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.nombre}</option>)}
          </select>
          <p className="field-help">La fecha de fin la calcula la base de datos: inicio + 60 días.</p>
        </div>
        <Acciones onClose={onClose} guardando={guardando} texto="Registrar prueba" deshabilitado={!prospecto || !producto} />
      </form>
    </Modal>
  )
}

export const FormInteraccion: React.FC<Props> = ({ prospectoId, onClose, onGuardado }) => {
  const [form, setForm] = useState({ prospecto_id: prospectoId || ('' as number | ''), tipo: 'Llamada', resultado: 'Positivo', notas: '' })
  const { error, guardando, ejecutar } = useEnvio()

  return (
    <Modal titulo="Registrar interacción" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); ejecutar(async () => {
        const r = await interaccionService.registrar({ ...form, notas: form.notas || null })
        onGuardado(`Interacción registrada. Puntaje actual del prospecto: ${r.puntaje} (${r.estado_prospecto}).`)
      }) }}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {!prospectoId && (
          <div className="form-group"><label htmlFor="in-prospecto">Prospecto</label>
            <SelectorProspecto id="in-prospecto" valor={form.prospecto_id} onChange={(v) => setForm({ ...form, prospecto_id: v })} requerido /></div>
        )}
        <div className="form-grid-2">
          <div className="form-group"><label htmlFor="in-tipo">Tipo</label>
            <select id="in-tipo" className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option>Llamada</option><option>Correo</option>
            </select></div>
          <div className="form-group"><label htmlFor="in-resultado">Resultado</label>
            <select id="in-resultado" className="input" value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })}>
              <option>Positivo</option><option>Neutro</option><option>Negativo</option><option>Sin respuesta</option>
            </select></div>
        </div>
        <div className="form-group"><label htmlFor="in-notas">Notas <span className="optional">(opcional)</span></label>
          <textarea id="in-notas" className="input" rows={3} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Qué se habló y cuál es el siguiente paso" /></div>
        <p className="field-help">Un resultado Positivo suma 10 puntos al prospecto.</p>
        <Acciones onClose={onClose} guardando={guardando} texto="Registrar" deshabilitado={!form.prospecto_id} />
      </form>
    </Modal>
  )
}

export const FormPropuesta: React.FC<Props> = ({ prospectoId, onClose, onGuardado }) => {
  const [prospecto, setProspecto] = useState<number | ''>(prospectoId || '')
  const [producto, setProducto] = useState<number | ''>('')
  const [licencias, setLicencias] = useState(10)
  const productos = useCarga(() => productoService.listar({ version: 'Comercial', activo: true }), [])
  const { error, guardando, ejecutar } = useEnvio()
  const precio = productos.datos?.productos.find((p) => p.producto_id === producto)?.precio_unitario

  return (
    <Modal titulo="Crear propuesta" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); ejecutar(async () => {
        const p = await propuestaService.crear({ prospecto_id: Number(prospecto), producto_id: Number(producto), num_licencias: licencias })
        onGuardado(`Propuesta ${p.propuesta_id} enviada por ${formatoMoneda(p.valor_total)}.`)
      }) }}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {!prospectoId && (
          <div className="form-group"><label htmlFor="pp-prospecto">Prospecto</label>
            <SelectorProspecto id="pp-prospecto" valor={prospecto} onChange={setProspecto} excluirEstados={['Descartado']} requerido /></div>
        )}
        <div className="form-grid-2">
          <div className="form-group"><label htmlFor="pp-producto">Producto comercial</label>
            <select id="pp-producto" className="input" value={producto} onChange={(e) => setProducto(Number(e.target.value) || '')} required>
              <option value="">Elige un producto</option>
              {productos.datos?.productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.nombre} ({formatoMoneda(p.precio_unitario)})</option>)}
            </select></div>
          <div className="form-group"><label htmlFor="pp-licencias">Licencias</label>
            <input id="pp-licencias" type="number" min={1} className="input" value={licencias} onChange={(e) => setLicencias(Number(e.target.value))} required /></div>
        </div>
        <p className="total-preview">
          Valor estimado: <strong>{precio ? formatoMoneda(precio * licencias) : '—'}</strong>
          <span className="field-help"> El valor definitivo lo calcula el trigger TR-02 en la base de datos.</span>
        </p>
        <Acciones onClose={onClose} guardando={guardando} texto="Enviar propuesta" deshabilitado={!prospecto || !producto || licencias < 1} />
      </form>
    </Modal>
  )
}

export const FormVenta: React.FC<Omit<Props, 'prospectoId'> & { propuestaId?: number }> = ({ propuestaId, onClose, onGuardado }) => {
  const [propuesta, setPropuesta] = useState<number | ''>(propuestaId || '')
  const [forma, setForma] = useState('Transferencia')
  const [monto, setMonto] = useState('')
  // Solo propuestas Aceptadas que todavía no tienen venta
  const opciones = useCarga(() => propuestaService.listar({ estado: 'Aceptada', sin_venta: true }), [])
  const elegida = opciones.datos?.find((p) => p.propuesta_id === propuesta)
  const { error, guardando, ejecutar } = useEnvio()

  return (
    <Modal titulo="Registrar venta" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); ejecutar(async () => {
        const v = await ventaService.registrar({ propuesta_id: Number(propuesta), forma_pago: forma, monto_final: monto ? Number(monto) : null })
        onGuardado(`Venta ${v.venta_id} registrada por ${formatoMoneda(v.monto_final)}. ${v.prospecto} ahora es Cliente.`)
      }) }}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="form-group"><label htmlFor="v-propuesta">Propuesta aceptada</label>
          <select id="v-propuesta" className="input" value={propuesta} onChange={(e) => setPropuesta(Number(e.target.value) || '')} required>
            <option value="">{opciones.cargando ? 'Cargando…' : opciones.datos?.length ? 'Elige una propuesta' : 'No hay propuestas aceptadas sin venta'}</option>
            {opciones.datos?.map((p) => (
              <option key={p.propuesta_id} value={p.propuesta_id}>N.º {p.propuesta_id}: {p.prospecto}, {p.producto} ({formatoMoneda(p.valor_total)})</option>
            ))}
          </select></div>
        <div className="form-grid-2">
          <div className="form-group"><label htmlFor="v-forma">Forma de pago</label>
            <select id="v-forma" className="input" value={forma} onChange={(e) => setForma(e.target.value)}>
              <option>Transferencia</option><option>Tarjeta</option><option>Factura</option><option>Efectivo</option>
            </select></div>
          <div className="form-group"><label htmlFor="v-monto">Monto final <span className="optional">(opcional)</span></label>
            <input id="v-monto" type="number" min={0} step="1" className="input" value={monto} onChange={(e) => setMonto(e.target.value)}
              placeholder={elegida ? String(elegida.valor_total) : ''} /></div>
        </div>
        <p className="field-help">Vacío = valor de la propuesta. Puede ser menor si hubo descuento, nunca mayor.
          En una sola transacción (T4) se crea la venta, el prospecto pasa a Cliente y su prueba a Convertida.</p>
        <Acciones onClose={onClose} guardando={guardando} texto="Registrar venta" deshabilitado={!propuesta} />
      </form>
    </Modal>
  )
}

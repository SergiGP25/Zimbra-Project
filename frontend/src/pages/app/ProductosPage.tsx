import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { useCarga } from '../../lib/useCarga'
import { formatoMoneda } from '../../lib/formato'
import { puede } from '../../lib/roles'
import { productoService } from '../../services/crm/crmService'
import { Producto } from '../../types/crm/crmTypes'
import { Aviso, Cargando, Encabezado, ErrorCarga, Modal, Vacio, Paginacion, usePaginacion } from '../../components/ui/ui'

/* RF-14 a RF-16: catálogo. Los productos no se borran: se desactivan (RN-13). */
export const ProductosPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const admin = puede.gestionarProductos(user?.rol)
  const [version, setVersion] = useState('')
  const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const { datos, cargando, error, recargar } = useCarga(() => productoService.listar({ version }), [version])
  const pag = usePaginacion(datos?.productos)

  const alternar = async (p: Producto) => {
    await productoService.cambiarActivo(p.producto_id, !p.activo)
    setAviso(`${p.nombre} ${p.activo ? 'desactivado' : 'activado'}.`)
    recargar()
  }

  return (
    <div>
      <Encabezado titulo="Productos" descripcion="Versiones Gratuitas para la prueba de 60 días y Comerciales para las propuestas.">
        {admin && <button type="button" className="btn btn-primary" onClick={() => setEditando('nuevo')}>Crear producto</button>}
      </Encabezado>
      <Aviso tipo="success" texto={aviso} onCerrar={() => setAviso(null)} />
      <div className="filter-bar">
        <div className="segmented" role="group" aria-label="Versión">
          {['', 'Gratuita', 'Comercial'].map((v) => (
            <button key={v || 'todas'} type="button" className={version === v ? 'is-on' : ''} onClick={() => setVersion(v)}>{v || 'Todas'}</button>
          ))}
        </div>
      </div>
      {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}
      {cargando && !datos ? <Cargando /> : datos?.productos.length === 0 ? <Vacio texto="No hay productos." /> : (
        <div className="table-wrapper card card-flush">
          <table className="data-table">
            <thead><tr><th>Producto</th><th>Versión</th><th className="num">Precio por licencia</th><th className="num">Pruebas</th><th className="num">Propuestas</th><th>Estado</th>{admin && <th><span className="sr-only">Acciones</span></th>}</tr></thead>
            <tbody>
              {pag.visibles.map((p) => (
                <tr key={p.producto_id} className={p.activo ? '' : 'row-inactive'}>
                  <td className="cell-title">{p.nombre}</td>
                  <td>{p.version}</td>
                  <td className="num">{p.version === 'Gratuita' ? 'Gratis' : formatoMoneda(p.precio_unitario)}</td>
                  <td className="num">{p.pruebas}</td>
                  <td className="num">{p.propuestas}</td>
                  <td>{p.activo ? 'Activo' : 'Inactivo'}</td>
                  {admin && (
                    <td className="actions-cell">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditando(p)}>Editar</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => alternar(p)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginacion estado={pag} nombre="productos" />
      {editando && <FormProducto producto={editando === 'nuevo' ? undefined : editando} onClose={() => setEditando(null)}
        onGuardado={(m) => { setEditando(null); setAviso(m); recargar() }} />}
    </div>
  )
}

const FormProducto: React.FC<{ producto?: Producto; onClose: () => void; onGuardado: (m: string) => void }> = ({ producto, onClose, onGuardado }) => {
  const [nombre, setNombre] = useState(producto?.nombre || '')
  const [version, setVersion] = useState<'Gratuita' | 'Comercial'>(producto?.version || 'Comercial')
  const [precio, setPrecio] = useState(producto ? Number(producto.precio_unitario) : 50000)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const precioFinal = version === 'Gratuita' ? 0 : precio
      if (producto) await productoService.editar(producto.producto_id, { nombre, precio_unitario: precioFinal })
      else await productoService.crear({ nombre, version, precio_unitario: precioFinal })
      onGuardado(producto ? 'Producto actualizado.' : 'Producto creado.')
    } catch (err: any) {
      setError(err.detail || 'No se pudo guardar.')
    }
  }

  return (
    <Modal titulo={producto ? 'Editar producto' : 'Crear producto'} onClose={onClose}>
      <form onSubmit={enviar}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="form-group"><label htmlFor="pr-nombre">Nombre</label>
          <input id="pr-nombre" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} /></div>
        <div className="form-grid-2">
          <div className="form-group"><label htmlFor="pr-version">Versión</label>
            <select id="pr-version" className="input" value={version} disabled={!!producto} onChange={(e) => setVersion(e.target.value as 'Gratuita' | 'Comercial')}>
              <option>Comercial</option><option>Gratuita</option>
            </select></div>
          <div className="form-group"><label htmlFor="pr-precio">Precio por licencia (COP)</label>
            <input id="pr-precio" type="number" min={1} step="1" className="input" value={version === 'Gratuita' ? 0 : precio}
              disabled={version === 'Gratuita'} onChange={(e) => setPrecio(Number(e.target.value))} /></div>
        </div>
        {producto && <p className="field-help">La versión no se cambia: un producto con pruebas o propuestas cambiaría su significado.</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{producto ? 'Guardar cambios' : 'Crear producto'}</button>
        </div>
      </form>
    </Modal>
  )
}

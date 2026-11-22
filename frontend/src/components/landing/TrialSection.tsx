import React, { useEffect, useState } from 'react'
import { publicoService } from '../../services/publico/publicoService'
import { ProductoGratuito, PruebaRegistrada, SolicitudPrueba } from '../../types/publico/publicoTypes'

/*
  Registro público «Prueba gratis 60 días».
  1. Al montar el componente (useEffect con []) pide a la API los productos
     gratuitos activos. Vienen de la tabla producto de MySQL.
  2. El visitante elige un producto y llena sus datos.
  3. POST /publico/prueba-gratis: el backend crea el prospecto y ejecuta la
     transacción T1 (sp_registrar_descarga).
  4. Se muestra la confirmación con la fecha de fin que calculó la columna
     generada fecha_fin (fecha de inicio + 60 días).
*/

const FORM_VACIO: SolicitudPrueba = { nombre: '', empresa: '', email: '', telefono: '', producto_id: 0 }

export const TrialSection: React.FC = () => {
  const [productos, setProductos] = useState<ProductoGratuito[]>([])
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [form, setForm] = useState<SolicitudPrueba>(FORM_VACIO)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<PruebaRegistrada | null>(null)

  useEffect(() => {
    publicoService
      .listarProductosGratuitos()
      .then((lista) => {
        setProductos(lista)
        // Deja elegido el primero para que el formulario quede listo
        if (lista.length > 0) setForm((f) => ({ ...f, producto_id: lista[0].producto_id }))
      })
      .catch(() => setError('No pudimos cargar los productos. Recarga la página para intentarlo de nuevo.'))
      .finally(() => setCargandoProductos(false))
  }, [])

  // Un solo manejador para todos los campos: usa el atributo name del input
  const actualizar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      setResultado(await publicoService.solicitarPrueba(form))
    } catch (err: any) {
      setError(err.detail || 'No se pudo registrar la prueba. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const productoElegido = productos.find((p) => p.producto_id === form.producto_id)

  if (resultado) {
    return (
      <div className="trial-done" role="status">
        <h3>Listo, {form.nombre.split(' ')[0]}.</h3>
        <p>{resultado.mensaje}</p>
        <dl className="trial-dates">
          <div>
            <dt>Producto</dt>
            <dd>{resultado.producto}</dd>
          </div>
          <div>
            <dt>Empieza</dt>
            <dd>{new Date(resultado.fecha_inicio + 'T00:00').toLocaleDateString('es-CO')}</dd>
          </div>
          <div>
            <dt>Termina</dt>
            <dd>{new Date(resultado.fecha_fin + 'T00:00').toLocaleDateString('es-CO')}</dd>
          </div>
        </dl>
        <p className="text-muted">Un asesor te escribirá a {form.email} para ayudarte a empezar.</p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setResultado(null)
            setForm({ ...FORM_VACIO, producto_id: productos[0]?.producto_id ?? 0 })
          }}
        >
          Registrar otra prueba
        </button>
      </div>
    )
  }

  return (
    <form className="trial-form" onSubmit={handleSubmit}>
      <fieldset className="product-picker">
        <legend>¿Qué quieres probar?</legend>
        {cargandoProductos && <p className="text-muted">Cargando productos…</p>}
        {!cargandoProductos && productos.length === 0 && !error && (
          <p className="text-muted">No hay productos disponibles para prueba en este momento.</p>
        )}
        <div className="product-options">
          {productos.map((p) => (
            <label
              key={p.producto_id}
              className={`product-option${form.producto_id === p.producto_id ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name="producto"
                value={p.producto_id}
                checked={form.producto_id === p.producto_id}
                onChange={() => setForm((f) => ({ ...f, producto_id: p.producto_id }))}
              />
              <span>{p.nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="trial-nombre">Nombre completo</label>
          <input id="trial-nombre" name="nombre" className="input" value={form.nombre} onChange={actualizar} required minLength={2} autoComplete="name" />
        </div>
        <div className="form-group">
          <label htmlFor="trial-email">Correo de trabajo</label>
          <input id="trial-email" name="email" type="email" className="input" value={form.email} onChange={actualizar} required autoComplete="email" />
        </div>
        <div className="form-group">
          <label htmlFor="trial-empresa">Empresa <span className="optional">(opcional)</span></label>
          <input id="trial-empresa" name="empresa" className="input" value={form.empresa} onChange={actualizar} autoComplete="organization" />
        </div>
        <div className="form-group">
          <label htmlFor="trial-telefono">Teléfono <span className="optional">(opcional)</span></label>
          <input id="trial-telefono" name="telefono" type="tel" className="input" value={form.telefono} onChange={actualizar} autoComplete="tel" />
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-lg" disabled={enviando || !productoElegido}>
        {enviando ? 'Activando tu prueba…' : 'Activar prueba de 60 días'}
      </button>
      <p className="form-note">Sin tarjeta de crédito. Al terminar los 60 días decides si continúas.</p>
    </form>
  )
}

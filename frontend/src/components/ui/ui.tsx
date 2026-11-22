import React, { useEffect } from 'react'
import { useCarga } from '../../lib/useCarga'
import { prospectoService } from '../../services/crm/crmService'

/*
  Piezas de interfaz que repiten todas las pantallas.
  Tenerlas en un solo lugar hace que la aplicación se vea igual en todas partes
  y que un cambio de diseño se haga una sola vez.
*/

/** Encabezado de cada pantalla: título, descripción y botones a la derecha. */
export const Encabezado: React.FC<{ titulo: string; descripcion?: string; children?: React.ReactNode }> = ({ titulo, descripcion, children }) => (
  <div className="page-header">
    <div>
      <h2>{titulo}</h2>
      {descripcion && <p className="text-muted">{descripcion}</p>}
    </div>
    {children && <div className="page-header-actions">{children}</div>}
  </div>
)

/** Ventana modal. Se cierra con Escape o con clic fuera de la tarjeta. */
export const Modal: React.FC<{ titulo: string; onClose: () => void; children: React.ReactNode; ancho?: number }> = ({ titulo, onClose, children, ancho }) => {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={titulo}
        style={ancho ? { maxWidth: ancho } : undefined} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Etiqueta de color según el estado. El color se define en App.css (.estado-...). */
export const Estado: React.FC<{ valor: string }> = ({ valor }) => (
  <span className={`estado estado-${valor.toLowerCase().replace(/\s+/g, '-')}`}>{valor}</span>
)

export const Cargando: React.FC<{ texto?: string }> = ({ texto = 'Cargando…' }) => (
  <div className="loading-state" role="status"><div className="spinner" /><span>{texto}</span></div>
)

export const Vacio: React.FC<{ texto: string; children?: React.ReactNode }> = ({ texto, children }) => (
  <div className="empty-state"><p>{texto}</p>{children}</div>
)

export const ErrorCarga: React.FC<{ mensaje: string; onReintentar?: () => void }> = ({ mensaje, onReintentar }) => (
  <div className="alert alert-error" role="alert">
    {mensaje} {onReintentar && <button type="button" className="link-button" onClick={onReintentar}>Reintentar</button>}
  </div>
)

/** Aviso que desaparece solo después de unos segundos. */
export const Aviso: React.FC<{ tipo: 'success' | 'error' | 'info'; texto: string | null; onCerrar: () => void }> = ({ tipo, texto, onCerrar }) => {
  useEffect(() => {
    if (!texto) return
    const t = setTimeout(onCerrar, 6000)
    return () => clearTimeout(t)
  }, [texto, onCerrar])
  if (!texto) return null
  return <div className={`alert alert-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>{texto}</div>
}

/** Selector de prospecto. Solo muestra los que el usuario puede ver (RN-12). */
export const SelectorProspecto: React.FC<{
  valor: number | ''
  onChange: (id: number | '') => void
  id?: string
  excluirEstados?: string[]
  requerido?: boolean
}> = ({ valor, onChange, id, excluirEstados = [], requerido }) => {
  const { datos, cargando } = useCarga(() => prospectoService.opciones(), [])
  const opciones = (datos || []).filter((p) => !excluirEstados.includes(p.estado))
  return (
    <select id={id} className="input" value={valor} required={requerido}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}>
      <option value="">{cargando ? 'Cargando prospectos…' : 'Elige un prospecto'}</option>
      {opciones.map((p) => (
        <option key={p.prospecto_id} value={p.prospecto_id}>
          {p.nombre}{p.empresa ? `, ${p.empresa}` : ''} ({p.estado})
        </option>
      ))}
    </select>
  )
}

/** Tarjeta de indicador para el panel y los reportes. */
export const Indicador: React.FC<{ etiqueta: string; valor: React.ReactNode; detalle?: string; destacado?: boolean }> = ({ etiqueta, valor, detalle, destacado }) => (
  <div className={`kpi${destacado ? ' kpi-destacado' : ''}`}>
    <span className="kpi-etiqueta">{etiqueta}</span>
    <span className="kpi-valor">{valor}</span>
    {detalle && <span className="kpi-detalle">{detalle}</span>}
  </div>
)

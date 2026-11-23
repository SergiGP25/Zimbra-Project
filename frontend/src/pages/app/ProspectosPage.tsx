import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace, navegar } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { formatoFecha } from '../../lib/formato'
import { puede } from '../../lib/roles'
import { prospectoService } from '../../services/crm/crmService'
import { Prospecto } from '../../types/crm/crmTypes'
import { Aviso, Cargando, Encabezado, ErrorCarga, Estado, Vacio } from '../../components/ui/ui'
import { AsignarVendedor, CambiarEstado, FormularioProspecto } from '../../components/prospectos/ProspectoModales'

type Ventana = { tipo: 'nuevo' } | { tipo: 'editar' | 'estado' | 'asignar'; prospecto: Prospecto } | null

/*
  RF-06: listado con búsqueda, filtros, orden y paginación.
  Los filtros viven en un solo objeto de estado; cada vez que cambia,
  useCarga vuelve a pedir la página a la API (que hace el filtro en SQL).
*/
export const ProspectosPage: React.FC<{ params: Record<string, string> }> = () => {
  const { user } = useAuth()
  const esVendedor = user?.rol === 'Vendedor'
  const inicial = new URLSearchParams(window.location.search)   // ej. /app/prospectos?estado=Calificado
  const [filtros, setFiltros] = useState({
    q: '', estado: inicial.get('estado') || '', campana_id: inicial.get('campana_id') || '', vendedor_id: '', sin_vendedor: false, orden: 'fecha', pagina: 1,
  })
  const [busqueda, setBusqueda] = useState('')
  const [ventana, setVentana] = useState<Ventana>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const catalogos = useCarga(() => prospectoService.catalogos(), [])
  const lista = useCarga(() => prospectoService.listar({ ...filtros, por_pagina: 20 }), [JSON.stringify(filtros)])

  const filtrar = (campo: string, valor: string | boolean) => setFiltros((f) => ({ ...f, [campo]: valor, pagina: 1 }))
  const guardado = (mensaje: string) => {
    setVentana(null)
    setAviso(mensaje)
    lista.recargar()
  }

  return (
    <div>
      <Encabezado titulo={esVendedor ? 'Mis prospectos' : 'Prospectos'}
        descripcion={esVendedor ? 'Solo ves los prospectos asignados a ti.' : 'Todos los prospectos de la empresa; los más recientes primero.'}>
        <button type="button" className="btn btn-primary" disabled={!catalogos.datos} onClick={() => setVentana({ tipo: 'nuevo' })}>
          Registrar prospecto
        </button>
      </Encabezado>

      <Aviso tipo="success" texto={aviso} onCerrar={() => setAviso(null)} />

      <div className="filter-bar">
        <form className="search-form" onSubmit={(e) => { e.preventDefault(); filtrar('q', busqueda) }}>
          <input className="input" type="search" placeholder="Buscar por nombre, empresa o correo"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar prospectos" />
          <button type="submit" className="btn btn-secondary">Buscar</button>
        </form>
        <select className="input select-filter" value={filtros.estado} onChange={(e) => filtrar('estado', e.target.value)} aria-label="Estado">
          <option value="">Todos los estados</option>
          {catalogos.datos?.estados.map((e) => <option key={e}>{e}</option>)}
        </select>
        <select className="input select-filter" value={filtros.campana_id} onChange={(e) => filtrar('campana_id', e.target.value)} aria-label="Campaña">
          <option value="">Todas las campañas</option>
          {catalogos.datos?.campanas.map((c) => <option key={c.campana_id} value={c.campana_id}>{c.nombre}</option>)}
        </select>
        {!esVendedor && (
          <>
            <select className="input select-filter" value={filtros.vendedor_id} onChange={(e) => filtrar('vendedor_id', e.target.value)} aria-label="Vendedor">
              <option value="">Todos los vendedores</option>
              {catalogos.datos?.vendedores.map((v) => <option key={v.empleado_id} value={v.empleado_id}>{v.nombre}</option>)}
            </select>
            <label className="check">
              <input type="checkbox" checked={filtros.sin_vendedor} onChange={(e) => filtrar('sin_vendedor', e.target.checked)} />
              Sin vendedor
            </label>
          </>
        )}
        <select className="input select-filter" value={filtros.orden} onChange={(e) => filtrar('orden', e.target.value)} aria-label="Ordenar por">
          <option value="fecha">Más recientes</option>
          <option value="puntaje">Mayor puntaje</option>
          <option value="nombre">Nombre</option>
          <option value="empresa">Empresa</option>
        </select>
      </div>

      {lista.error && <ErrorCarga mensaje={lista.error} onReintentar={lista.recargar} />}
      {lista.cargando && !lista.datos ? <Cargando /> : lista.datos && lista.datos.total === 0 ? (
        <Vacio texto="No hay prospectos con esos filtros." />
      ) : lista.datos && (
        <>
          <div className="table-wrapper card card-flush">
            <table className="data-table">
              <thead>
                <tr><th>Prospecto</th><th>Estado</th><th className="num">Puntaje</th><th>Campaña</th>{!esVendedor && <th>Vendedor</th>}<th>Registro</th><th><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody>
                {lista.datos.prospectos.map((p) => (
                  <tr key={p.prospecto_id}>
                    <td>
                      <Enlace to={`/app/prospectos/${p.prospecto_id}`} className="cell-title">{p.nombre}</Enlace>
                      <div className="cell-sub">{p.empresa || p.email}</div>
                    </td>
                    <td><Estado valor={p.estado} /></td>
                    <td className="num"><span className={`score${p.puntaje >= 50 ? ' score-high' : ''}`}>{p.puntaje}</span></td>
                    <td className="cell-sub">{p.campana_nombre}</td>
                    {!esVendedor && <td>{p.vendedor_nombre || <span className="text-muted">Sin asignar</span>}</td>}
                    <td className="cell-sub">{formatoFecha(p.fecha_registro)}</td>
                    <td className="actions-cell">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => navegar(`/app/prospectos/${p.prospecto_id}`)}>Ficha</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVentana({ tipo: 'editar', prospecto: p })}>Editar</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVentana({ tipo: 'estado', prospecto: p })}>Estado</button>
                      {puede.asignarVendedor(user?.rol) && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVentana({ tipo: 'asignar', prospecto: p })}>Asignar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="text-muted">{lista.datos.total} prospectos, página {lista.datos.pagina} de {lista.datos.total_paginas}</span>
            <div>
              <button type="button" className="btn btn-secondary btn-sm" disabled={filtros.pagina <= 1}
                onClick={() => setFiltros((f) => ({ ...f, pagina: f.pagina - 1 }))}>Anterior</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={filtros.pagina >= lista.datos.total_paginas}
                onClick={() => setFiltros((f) => ({ ...f, pagina: f.pagina + 1 }))}>Siguiente</button>
            </div>
          </div>
        </>
      )}

      {ventana && catalogos.datos && ventana.tipo === 'nuevo' && <FormularioProspecto catalogos={catalogos.datos} onClose={() => setVentana(null)} onGuardado={guardado} />}
      {ventana && catalogos.datos && ventana.tipo === 'editar' && <FormularioProspecto catalogos={catalogos.datos} prospecto={ventana.prospecto} onClose={() => setVentana(null)} onGuardado={guardado} />}
      {ventana && ventana.tipo === 'estado' && <CambiarEstado prospecto={ventana.prospecto} onClose={() => setVentana(null)} onGuardado={guardado} />}
      {ventana && catalogos.datos && ventana.tipo === 'asignar' && <AsignarVendedor prospecto={ventana.prospecto} catalogos={catalogos.datos} onClose={() => setVentana(null)} onGuardado={guardado} />}
    </div>
  )
}

import React from 'react'
import { useCarga } from '../../lib/useCarga'
import { formatoMoneda } from '../../lib/formato'
import { request } from '../../services/api'

interface Plan {
  producto_id: number
  nombre: string
  precio_unitario: number
}

/*
  Planes: los productos de versión Comercial con su precio por licencia.
  Vienen de la tabla producto (GET /publico/planes); si el administrador cambia
  un precio en el sistema, aquí se ve el nuevo sin tocar el código.
*/
export const PlanesSection: React.FC = () => {
  const { datos, cargando, error } = useCarga(() => request<Plan[]>('/publico/planes'), [])
  const planes = (datos || []).slice(0, 6)

  if (cargando) return <p className="text-muted">Cargando planes…</p>
  if (error) return <p className="text-muted">No pudimos cargar los planes en este momento.</p>

  return (
    <>
      <div className="plans">
        {planes.map((p, i) => (
          <article key={p.producto_id} className={`plan${i === 1 ? ' plan-featured' : ''}`}>
            <h3>{p.nombre}</h3>
            <p className="plan-price">
              {formatoMoneda(p.precio_unitario)}
              <span> por licencia al mes</span>
            </p>
            <a href="#prueba" className={`btn ${i === 1 ? 'btn-primary' : 'btn-secondary'} btn-block`}>
              Probar antes de comprar
            </a>
          </article>
        ))}
      </div>
      {(datos || []).length > planes.length && (
        <p className="text-muted plans-more">Y {(datos || []).length - planes.length} productos más. Un asesor te ayuda a elegir.</p>
      )}
    </>
  )
}

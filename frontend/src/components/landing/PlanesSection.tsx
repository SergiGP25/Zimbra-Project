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
  Planes: los productos de versión Comercial con su precio por licencia (COP).
  Vienen de la tabla producto (GET /publico/planes); si el administrador cambia
  un precio en el sistema, aquí se ve el nuevo sin tocar el código.

  El catálogo tiene más de 20 productos comerciales porque la entrega exige
  al menos 30 filas por tabla. Para no abrumar al visitante se muestran:
    - Los 3 niveles de la edición principal (Network Edition), como planes.
    - El resto como "complementos": una lista compacta con su precio.
*/
const NIVELES = ['Standard', 'Professional', 'Enterprise']

export const PlanesSection: React.FC = () => {
  const { datos, cargando, error } = useCarga(() => request<Plan[]>('/publico/planes'), [])

  if (cargando) return <p className="text-muted">Cargando planes…</p>
  if (error) return <p className="text-muted">No pudimos cargar los planes en este momento.</p>

  const todos = datos || []
  let planes = NIVELES
    .map((nivel) => todos.find((p) => p.nombre === `ZCS Network Edition ${nivel}`))
    .filter((p): p is Plan => Boolean(p))
  if (planes.length < 3) planes = todos.slice(0, 3) // si cambian los nombres, igual hay 3 planes
  const complementos = todos.filter((p) => !planes.includes(p))

  return (
    <>
      <div className="plans">
        {planes.map((p, i) => (
          <article key={p.producto_id} className={`plan${i === 1 ? ' plan-featured' : ''}`}>
            {i === 1 && <p className="plan-tier">El más elegido</p>}
            <h3>{p.nombre.replace('ZCS Network Edition ', 'Plan ')}</h3>
            <p className="plan-price">
              {formatoMoneda(p.precio_unitario)}
              <span>por usuario al mes</span>
            </p>
            <a href="#prueba" className={`btn ${i === 1 ? 'btn-primary' : 'btn-secondary'} btn-block`}>
              Probar antes de comprar
            </a>
          </article>
        ))}
      </div>

      {complementos.length > 0 && (
        <section className="addons" aria-labelledby="titulo-complementos">
          <h3 id="titulo-complementos">Complementos</h3>
          <p>Se suman a cualquier plan. Tu asesor te ayuda a elegir los que necesitas.</p>
          <ul className="addon-list">
            {complementos.map((p) => (
              <li key={p.producto_id}>
                <span>{p.nombre}</span>
                <span>{formatoMoneda(p.precio_unitario)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

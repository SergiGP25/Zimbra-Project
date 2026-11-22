import React from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { alertaService } from '../../services/crm/crmService'

/*
  Menú lateral. Cada opción declara qué roles la ven (HU-04).
  Es comodidad visual: si alguien escribe la dirección a mano, el backend
  igual responde 403. El orden sigue el proceso comercial.
*/
interface Opcion {
  ruta: string
  texto: string
  roles: string[]
  grupo: string
}

const OPCIONES: Opcion[] = [
  { ruta: '/app', texto: 'Panel', roles: ['Admin', 'Marketing', 'Vendedor'], grupo: 'Inicio' },
  { ruta: '/app/alertas', texto: 'Alertas', roles: ['Admin', 'Marketing', 'Vendedor'], grupo: 'Inicio' },
  { ruta: '/app/prospectos', texto: 'Prospectos', roles: ['Admin', 'Marketing', 'Vendedor'], grupo: 'Captación' },
  { ruta: '/app/campanas', texto: 'Campañas', roles: ['Admin', 'Marketing'], grupo: 'Captación' },
  { ruta: '/app/pruebas', texto: 'Pruebas gratuitas', roles: ['Admin', 'Marketing', 'Vendedor'], grupo: 'Captación' },
  { ruta: '/app/visitas', texto: 'Visitas web', roles: ['Admin', 'Marketing', 'Vendedor'], grupo: 'Captación' },
  { ruta: '/app/interacciones', texto: 'Interacciones', roles: ['Admin', 'Marketing', 'Vendedor'], grupo: 'Ventas' },
  { ruta: '/app/propuestas', texto: 'Propuestas', roles: ['Admin', 'Marketing', 'Vendedor'], grupo: 'Ventas' },
  { ruta: '/app/ventas', texto: 'Ventas', roles: ['Admin', 'Marketing', 'Vendedor'], grupo: 'Ventas' },
  { ruta: '/app/reportes', texto: 'Reportes', roles: ['Admin', 'Marketing'], grupo: 'Análisis' },
  { ruta: '/app/productos', texto: 'Productos', roles: ['Admin', 'Marketing', 'Vendedor'], grupo: 'Administración' },
  { ruta: '/app/empleados', texto: 'Empleados', roles: ['Admin'], grupo: 'Administración' },
]

export const Sidebar: React.FC<{ rutaActual: string }> = ({ rutaActual }) => {
  const { user } = useAuth()
  const rol = user?.rol || ''
  // Se vuelve a pedir cada vez que cambias de pantalla
  const { datos } = useCarga(() => alertaService.pendientes(), [rutaActual])
  const visibles = OPCIONES.filter((o) => o.roles.includes(rol))
  const grupos = Array.from(new Set(visibles.map((o) => o.grupo)))

  // Una opción está activa si la ruta es igual o es una subruta (ej. /app/prospectos/12)
  const activa = (ruta: string) => (ruta === '/app' ? rutaActual === '/app' : rutaActual.startsWith(ruta))

  return (
    <aside className="sidebar">
      <nav aria-label="Módulos">
        {grupos.map((g) => (
          <div key={g} className="sidebar-group">
            <span className="sidebar-heading">{g}</span>
            {visibles.filter((o) => o.grupo === g).map((o) => (
              <Enlace key={o.ruta} to={o.ruta} className={`nav-item${activa(o.ruta) ? ' active' : ''}`}
                aria-current={activa(o.ruta) ? 'page' : undefined}>
                <span>{o.texto}</span>
                {o.ruta === '/app/alertas' && !!datos?.pendientes && <span className="nav-count">{datos.pendientes}</span>}
              </Enlace>
            ))}
          </div>
        ))}
      </nav>
      <div className="role-card">
        <strong>{rol}</strong>
        <p className="role-description">
          {rol === 'Admin' && 'Acceso a todo el sistema y a la administración.'}
          {rol === 'Marketing' && 'Campañas, prospectos, simulador de visitas y reportes.'}
          {rol === 'Vendedor' && 'Solo tus prospectos, alertas, propuestas y ventas (RN-12).'}
        </p>
      </div>
    </aside>
  )
}

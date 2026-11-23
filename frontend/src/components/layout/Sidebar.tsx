import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { Enlace } from '../../router/router'
import { useCarga } from '../../lib/useCarga'
import { alertaService } from '../../services/crm/crmService'
import { Icono } from '../ui/Iconos'
import { ChangePasswordModal } from '../auth/ChangePasswordModal'
import { Logo } from '../ui/Logo'

/*
  Menú lateral. Cada opción declara qué roles la ven (HU-04).
  Es comodidad visual: si alguien escribe la dirección a mano, el backend
  igual responde 403. El orden sigue el proceso comercial.
  Abajo va la tarjeta del usuario con "Cambiar contraseña" y "Cerrar sesión".
*/
interface Opcion {
  ruta: string
  texto: string
  icono: string
  roles: string[]
  grupo: string
}

const TODOS = ['Admin', 'Marketing', 'Vendedor']

const OPCIONES: Opcion[] = [
  { ruta: '/app', texto: 'Panel', icono: 'panel', roles: TODOS, grupo: 'Inicio' },
  { ruta: '/app/alertas', texto: 'Alertas', icono: 'alertas', roles: TODOS, grupo: 'Inicio' },
  { ruta: '/app/prospectos', texto: 'Prospectos', icono: 'prospectos', roles: TODOS, grupo: 'Captación' },
  { ruta: '/app/campanas', texto: 'Campañas', icono: 'campanas', roles: ['Admin', 'Marketing'], grupo: 'Captación' },
  { ruta: '/app/pruebas', texto: 'Pruebas gratuitas', icono: 'pruebas', roles: TODOS, grupo: 'Captación' },
  { ruta: '/app/visitas', texto: 'Visitas web', icono: 'visitas', roles: TODOS, grupo: 'Captación' },
  { ruta: '/app/interacciones', texto: 'Interacciones', icono: 'interacciones', roles: TODOS, grupo: 'Ventas' },
  { ruta: '/app/propuestas', texto: 'Propuestas', icono: 'propuestas', roles: TODOS, grupo: 'Ventas' },
  { ruta: '/app/ventas', texto: 'Ventas', icono: 'ventas', roles: TODOS, grupo: 'Ventas' },
  { ruta: '/app/reportes', texto: 'Reportes', icono: 'reportes', roles: TODOS, grupo: 'Análisis' },
  { ruta: '/app/productos', texto: 'Productos', icono: 'productos', roles: TODOS, grupo: 'Administración' },
  { ruta: '/app/empleados', texto: 'Empleados', icono: 'empleados', roles: ['Admin'], grupo: 'Administración' },
]

const DESCRIPCION_ROL: Record<string, string> = {
  Admin: 'Acceso a todo el sistema',
  Marketing: 'Campañas y captación',
  Vendedor: 'Tus prospectos y ventas',
}

export const Sidebar: React.FC<{ rutaActual: string }> = ({ rutaActual }) => {
  const { user, logout } = useAuth()
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const rol = user?.rol || ''
  // Se vuelve a pedir cada vez que cambias de pantalla
  const { datos } = useCarga(() => alertaService.pendientes(), [rutaActual])
  const visibles = OPCIONES.filter((o) => o.roles.includes(rol))
  const grupos = Array.from(new Set(visibles.map((o) => o.grupo)))

  // Una opción está activa si la ruta es igual o es una subruta (ej. /app/prospectos/12)
  const activa = (ruta: string) => (ruta === '/app' ? rutaActual === '/app' : rutaActual.startsWith(ruta))
  // Iniciales para el avatar: "Camila Rojas" -> "CR"
  const iniciales = (user?.nombre || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  return (
    <aside className="sidebar">
      <Enlace to="/app" className="sidebar-brand" aria-label="Zimbra CRM, ir al panel">
        <Logo tamano={34} className="logo-claro" />
      </Enlace>

      <nav aria-label="Módulos" className="sidebar-nav-scroll">
        {grupos.map((g) => (
          <div key={g} className="sidebar-group">
            <span className="sidebar-heading">{g}</span>
            {visibles.filter((o) => o.grupo === g).map((o) => (
              <Enlace key={o.ruta} to={o.ruta} className={`nav-item${activa(o.ruta) ? ' active' : ''}`}
                aria-current={activa(o.ruta) ? 'page' : undefined}>
                <Icono nombre={o.icono} />
                <span className="nav-texto">{o.texto}</span>
                {o.ruta === '/app/alertas' && !!datos?.pendientes && <span className="nav-count">{datos.pendientes}</span>}
              </Enlace>
            ))}
          </div>
        ))}
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-head">
            <span className="avatar" aria-hidden="true">{iniciales}</span>
            <div className="sidebar-user-text">
              <strong title={user.email}>{user.nombre}</strong>
              <span>{rol}: {(DESCRIPCION_ROL[rol] || '').toLowerCase()}</span>
            </div>
          </div>
          <div className="sidebar-user-actions">
            <button type="button" className="sidebar-action" onClick={() => setCambiandoPassword(true)}>
              <Icono nombre="clave" tamano={17} /> Contraseña
            </button>
            {/* HU-02: botón de cerrar sesión visible */}
            <button id="btn-logout" type="button" className="sidebar-action" onClick={() => logout()}>
              <Icono nombre="salir" tamano={17} /> Salir
            </button>
          </div>
        </div>
      )}
      {cambiandoPassword && <ChangePasswordModal onClose={() => setCambiandoPassword(false)} />}
    </aside>
  )
}

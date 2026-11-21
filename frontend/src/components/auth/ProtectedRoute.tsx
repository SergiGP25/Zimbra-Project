import React from 'react'
import { useAuth } from '../../hooks/auth/useAuth'

interface ProtectedRouteProps {
  allowedRoles?: string[]
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="loading-screen">Verificando sesión...</div>
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="unauthorized-card">
        <h3>Acceso no autenticado</h3>
        <p>Por favor inicia sesión para continuar.</p>
      </div>
    )
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some(
      (r) => r.toLowerCase() === user.rol.toLowerCase()
    )

    if (!hasRole) {
      return (
        <div className="forbidden-box">
          <div className="forbidden-icon">⛔ 403</div>
          <h3>Acceso restringido</h3>
          <p>
            Tu rol actual es <strong>{user.rol}</strong>. Esta sección está restringida
            exclusivamente a usuarios con roles: <strong>{allowedRoles.join(', ')}</strong>.
          </p>
        </div>
      )
    }
  }

  return <>{children}</>
}

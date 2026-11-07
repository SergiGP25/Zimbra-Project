import React from 'react'
import { EmpleadoList } from '../components/empleados/EmpleadoList'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export const EmpleadosPage: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <div className="empleados-page">
        <EmpleadoList />
      </div>
    </ProtectedRoute>
  )
}


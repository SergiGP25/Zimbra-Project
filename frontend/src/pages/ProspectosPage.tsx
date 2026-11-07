import React from 'react'
import { ProspectoList } from '../components/prospectos/ProspectoList'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export const ProspectosPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <div className="prospectos-page">
        <ProspectoList />
      </div>
    </ProtectedRoute>
  )
}


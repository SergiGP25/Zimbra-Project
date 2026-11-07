import { request } from '../api'
import {
  Empleado,
  EmpleadoCreatePayload,
  EmpleadoUpdatePayload,
  EmpleadoListResponse,
} from '../../types/empleados/empleadoTypes'

export const empleadoService = {
  async listEmpleados(params?: {
    rol?: string
    activo?: boolean
    search?: string
  }): Promise<EmpleadoListResponse> {
    const query = new URLSearchParams()
    if (params?.rol) query.append('rol', params.rol)
    if (params?.activo !== undefined) query.append('activo', String(params.activo))
    if (params?.search) query.append('search', params.search)

    const qs = query.toString() ? `?${query.toString()}` : ''
    return request<EmpleadoListResponse>(`/empleados/${qs}`)
  },

  async getEmpleado(id: number): Promise<Empleado> {
    return request<Empleado>(`/empleados/${id}`)
  },

  async createEmpleado(payload: EmpleadoCreatePayload): Promise<Empleado> {
    return request<Empleado>('/empleados/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateEmpleado(id: number, payload: EmpleadoUpdatePayload): Promise<Empleado> {
    return request<Empleado>(`/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async deactivateEmpleado(id: number): Promise<Empleado> {
    return request<Empleado>(`/empleados/${id}/desactivar`, {
      method: 'PATCH',
    })
  },
}


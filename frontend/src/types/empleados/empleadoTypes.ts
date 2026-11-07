export type RolType = 'Admin' | 'Marketing' | 'Vendedor'

export interface Empleado {
  id: number
  nombre: string
  email: string
  rol: RolType
  activo: boolean
  fecha_creacion?: string
}

export interface EmpleadoCreatePayload {
  nombre: string
  email: string
  password: string
  rol: RolType
  activo?: boolean
}

export interface EmpleadoUpdatePayload {
  nombre?: string
  email?: string
  rol?: RolType
  activo?: boolean
  password?: string
}

export interface EmpleadoListResponse {
  total: number
  empleados: Empleado[]
}


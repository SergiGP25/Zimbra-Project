export interface AuthUser {
  id: number
  nombre: string
  email: string
  rol: 'Admin' | 'Marketing' | 'Vendedor' | string
  activo: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
  message: string
}


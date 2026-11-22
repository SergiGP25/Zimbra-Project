import { request } from '../api'
import { AuthUser, CambioPassword, LoginResponse } from '../../types/auth/authTypes'

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async getMe(): Promise<AuthUser> {
    return request<AuthUser>('/auth/me')
  },

  // PUT /auth/password: el backend valida la contraseña actual y las reglas de la nueva
  async cambiarPassword(datos: CambioPassword): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(datos),
    })
  },

  async logout(): Promise<{ status: string; message: string }> {
    return request<{ status: string; message: string }>('/auth/logout', {
      method: 'POST',
    })
  },
}


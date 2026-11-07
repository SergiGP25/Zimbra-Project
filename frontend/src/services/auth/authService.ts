import { request } from '../api'
import { AuthUser, LoginResponse } from '../../types/auth/authTypes'

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

  async logout(): Promise<{ status: string; message: string }> {
    return request<{ status: string; message: string }>('/auth/logout', {
      method: 'POST',
    })
  },
}


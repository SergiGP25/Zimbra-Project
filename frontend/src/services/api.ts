import { HealthResponse, LoginResponse, MailListResponse, SendMailPayload } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api = {
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health`)
    if (!res.ok) {
      throw new Error(`Error ${res.status}: Fallo al conectar con el backend`)
    }
    return res.json()
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
      throw new Error(err.detail || 'Fallo de autenticación')
    }
    return res.json()
  },

  async getInbox(token?: string, limit = 10): Promise<MailListResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE_URL}/mail/inbox?limit=${limit}`, { headers })
    if (!res.ok) {
      throw new Error('Error al obtener bandeja de entrada')
    }
    return res.json()
  },

  async sendMail(payload: SendMailPayload, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE_URL}/mail/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error('Error al enviar el correo')
    }
    return res.json()
  },
}


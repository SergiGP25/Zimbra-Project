const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('zimbra_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // HU-02: Manejo de sesión expirada / no autorizada (401)
  if (response.status === 401) {
    // Si no estamos en el endpoint de login, limpiar sesión y redirigir
    if (!endpoint.includes('/auth/login')) {
      localStorage.removeItem('zimbra_token')
      localStorage.removeItem('zimbra_user')
      window.dispatchEvent(new CustomEvent('session-expired'))
    }
  }

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: ${response.statusText}`
    try {
      const errorJson = await response.json()
      if (errorJson.detail) {
        errorDetail = errorJson.detail
      }
    } catch {
      // Ignorar si el cuerpo no es JSON
    }
    throw new ApiError(response.status, errorDetail)
  }

  return response.json()
}

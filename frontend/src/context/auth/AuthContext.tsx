import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser } from '../../types/auth/authTypes'
import { authService } from '../../services/auth/authService'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionExpiredMessage: string | null
  login: (email: string, password: string) => Promise<void>
  logout: (reason?: string) => Promise<void>
  clearSessionMessage: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('zimbra_token'))
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('zimbra_user')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si el token guardado sigue siendo válido
    const verifySession = async () => {
      if (token) {
        try {
          const freshUser = await authService.getMe()
          setUser(freshUser)
          localStorage.setItem('zimbra_user', JSON.stringify(freshUser))
        } catch {
          // Token inválido o expirado
          logout('Tu sesión anterior ha expirado. Por favor, ingresa de nuevo.')
        }
      }
      setIsLoading(false)
    }

    verifySession()

    // Escuchar evento de expiración disparado por el cliente HTTP
    const handleSessionExpired = () => {
      logout('Tu sesión ha expirado por inactividad (30 min) o autenticación inválida.')
    }

    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password)
    setToken(res.access_token)
    setUser(res.user)
    setSessionExpiredMessage(null)
    localStorage.setItem('zimbra_token', res.access_token)
    localStorage.setItem('zimbra_user', JSON.stringify(res.user))
  }

  const logout = async (reason?: string) => {
    try {
      if (token) {
        await authService.logout().catch(() => {})
      }
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('zimbra_token')
      localStorage.removeItem('zimbra_user')
      if (reason) {
        setSessionExpiredMessage(reason)
      }
    }
  }

  const clearSessionMessage = () => setSessionExpiredMessage(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        sessionExpiredMessage,
        login,
        logout,
        clearSessionMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider')
  }
  return context
}


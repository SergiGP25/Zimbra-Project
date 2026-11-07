import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos según HU-02

export const useInactivityTimer = () => {
  const { isAuthenticated, logout } = useAuth()
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const resetTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }

      timerRef.current = window.setTimeout(() => {
        logout('Tu sesión ha expirado automáticamente por 30 minutos de inactividad.')
      }, INACTIVITY_TIMEOUT_MS)
    }

    // Eventos que reinician el temporizador de actividad
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    // Iniciar temporizador inicial
    resetTimer()

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [isAuthenticated, logout])
}


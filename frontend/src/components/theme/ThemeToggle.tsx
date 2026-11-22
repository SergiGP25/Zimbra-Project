import React from 'react'
import { useTheme } from '../../context/theme/ThemeContext'

/*
  Botón para cambiar entre tema claro y oscuro.
  aria-label y aria-pressed le dicen a un lector de pantalla qué hace el
  botón y en qué estado está, porque visualmente solo hay un ícono.
*/
export const ThemeToggle: React.FC = () => {
  const { tema, alternarTema } = useTheme()
  const esOscuro = tema === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={alternarTema}
      aria-pressed={esOscuro}
      aria-label={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={esOscuro ? 'Tema claro' : 'Tema oscuro'}
    >
      {esOscuro ? (
        // Sol: se muestra en oscuro porque es a lo que vas a cambiar
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </g>
        </svg>
      ) : (
        // Luna
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />
        </svg>
      )}
    </button>
  )
}

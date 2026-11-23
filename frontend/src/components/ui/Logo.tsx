import React, { useId } from 'react'

/*
  Logo de Zimbra CRM dibujado como vector (SVG): se ve nítido a cualquier
  tamaño y en los dos temas.
    - El gancho superior usa currentColor: oscuro en tema claro, crema en oscuro.
    - El lazo va en degradado orquídea -> violeta -> índigo.
    - La pata va en ámbar.
  variante "completo" agrega el nombre y la frase; "simple" solo el nombre.
*/
export const LogoMarca: React.FC<{ tamano?: number; monocromo?: boolean }> = ({ tamano = 36, monocromo }) => {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 64 56" width={tamano} height={(tamano * 56) / 64} aria-hidden="true" className="logo-marca">
      <defs>
        <linearGradient id={`lz${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#A678B9" />
          <stop offset="0.55" stopColor="#6A5ACD" />
          <stop offset="1" stopColor="#2D2B55" />
        </linearGradient>
        <linearGradient id={`pt${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F7BD5E" />
          <stop offset="1" stopColor="#F4A62A" />
        </linearGradient>
      </defs>
      <path d="M5 19 C 9 9, 21 7, 29 15" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <path d="M29 15 C 37 5, 58 6, 55 19 C 52 31, 33 30, 26 31 C 14 33, 9 44, 15 49 C 21 54, 29 46, 31 38"
        fill="none" stroke={monocromo ? 'currentColor' : `url(#lz${id})`} strokeWidth="7.5" strokeLinecap="round" />
      <path d="M31 32 C 37 39, 42 45, 47 50" fill="none" stroke={monocromo ? 'currentColor' : `url(#pt${id})`}
        strokeWidth="7.5" strokeLinecap="round" />
    </svg>
  )
}

export const Logo: React.FC<{ variante?: 'simple' | 'completo'; tamano?: number; className?: string }> = ({
  variante = 'simple', tamano = 36, className = '',
}) => (
  <span className={`logo logo-${variante} ${className}`}>
    <LogoMarca tamano={tamano} />
    <span className="logo-texto">
      <span className="logo-nombre">Zimbra <span className="logo-crm">CRM</span></span>
      {variante === 'completo' && <span className="logo-frase">Collaborative Customer Engagement</span>}
    </span>
  </span>
)

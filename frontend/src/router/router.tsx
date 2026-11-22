import React, { useEffect, useState } from 'react'

/*
  ENRUTADOR MÍNIMO
  ----------------
  Una "ruta" es la parte de la dirección después del dominio: /login,
  /app/prospectos... Un enrutador hace dos cosas:
  1. Leer la ruta actual y decidir qué página mostrar.
  2. Cambiar la ruta SIN recargar la página (history.pushState).

  Librerías como react-router hacen lo mismo con más funciones. Este archivo
  muestra la idea en pocas líneas.
*/

const EVENTO = 'cambio-de-ruta'

/** Cambia la dirección del navegador sin recargar y avisa a la app. */
export function navegar(ruta: string, opciones: { reemplazar?: boolean } = {}) {
  if (opciones.reemplazar) window.history.replaceState(null, '', ruta)
  else window.history.pushState(null, '', ruta)
  window.dispatchEvent(new Event(EVENTO))
  window.scrollTo(0, 0)
}

/** Devuelve la ruta actual y se actualiza cuando cambia (también con Atrás/Adelante). */
export function useRuta(): string {
  const [ruta, setRuta] = useState(window.location.pathname)
  useEffect(() => {
    const actualizar = () => setRuta(window.location.pathname)
    window.addEventListener(EVENTO, actualizar)
    window.addEventListener('popstate', actualizar) // botones Atrás / Adelante
    return () => {
      window.removeEventListener(EVENTO, actualizar)
      window.removeEventListener('popstate', actualizar)
    }
  }, [])
  return ruta
}

/**
 * Compara una ruta con un patrón. "/app/prospectos/:id" contra
 * "/app/prospectos/12" devuelve { id: "12" }; si no coincide, null.
 */
export function coincide(patron: string, ruta: string): Record<string, string> | null {
  const partesPatron = patron.split('/').filter(Boolean)
  const partesRuta = ruta.split('/').filter(Boolean)
  if (partesPatron.length !== partesRuta.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < partesPatron.length; i++) {
    if (partesPatron[i].startsWith(':')) params[partesPatron[i].slice(1)] = decodeURIComponent(partesRuta[i])
    else if (partesPatron[i] !== partesRuta[i]) return null
  }
  return params
}

/** Enlace que navega sin recargar. Ctrl+clic sigue abriendo otra pestaña. */
export const Enlace: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }> = ({ to, onClick, ...resto }) => (
  <a
    href={to}
    onClick={(e) => {
      onClick?.(e)
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return
      e.preventDefault()
      navegar(to)
    }}
    {...resto}
  />
)

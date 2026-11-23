import React from 'react'

/*
  Íconos del menú dibujados con SVG de líneas (estilo "outline").
  Son componentes normales: <Icono nombre="ventas" />. Usan currentColor,
  así toman el color del texto que los rodea (y cambian con el tema).
  Se dibujan aquí para no depender de una librería externa.
*/
const TRAZOS: Record<string, React.ReactNode> = {
  panel: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-6h4v6" /></>,
  alertas: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  prospectos: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  campanas: <><path d="M3 10v4h3l7 4V6L6 10Z" /><path d="M17 9a4 4 0 0 1 0 6" /><path d="M6 14l1.5 5h2.5l-1-5" /></>,
  pruebas: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13" /><path d="M3 12h18" /><path d="M12 8c-2-4-6-4-6-1.5S10 8 12 8Zm0 0c2-4 6-4 6-1.5S14 8 12 8Z" /></>,
  visitas: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></>,
  interacciones: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  propuestas: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6" /><path d="M8 13h8M8 17h5" /></>,
  ventas: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /><path d="M6.5 15h4" /></>,
  reportes: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  productos: <><path d="M12 2.5 21 7v10l-9 4.5L3 17V7Z" /><path d="M3 7l9 4.5L21 7" /><path d="M12 11.5v10" /></>,
  empleados: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="11" r="2.5" /><path d="M5.5 17a3.5 3.5 0 0 1 7 0" /><path d="M15 10h3M15 14h3" /></>,
  clave: <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M14 9l2 2" /></>,
  salir: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 8l-4 4 4 4" /><path d="M6 12h10" /></>,
  correo: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M8 14h2M14 14h2M8 17.5h2" /></>,
  codigo: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></>,
  sube: <path d="M7 17 17 7M9 7h8v8" />,
  baja: <path d="M7 7l10 10M17 9v8H9" />,
}

export type NombreIcono = keyof typeof TRAZOS

export const Icono: React.FC<{ nombre: string; tamano?: number; className?: string }> = ({ nombre, tamano = 20, className }) => (
  <svg viewBox="0 0 24 24" width={tamano} height={tamano} className={className} aria-hidden="true"
    fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {TRAZOS[nombre] ?? null}
  </svg>
)

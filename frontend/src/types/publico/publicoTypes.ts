export interface ProductoGratuito {
  producto_id: number
  nombre: string
  descripcion: string | null // qué es y para qué sirve
  version: string
}

export interface SolicitudPrueba {
  nombre: string
  empresa: string
  email: string
  telefono: string
  producto_id: number
}

export interface PruebaRegistrada {
  prospecto_id: number
  descarga_id: number
  producto: string
  fecha_inicio: string // la API envía las fechas como texto "2026-11-19"
  fecha_fin: string
  mensaje: string
}

// Portal "Mi prueba" del visitante (enlace personal del correo)
export interface PruebaPortal {
  producto: string
  descripcion: string | null
  fecha_inicio: string
  fecha_fin: string
  estado: 'Activa' | 'Vencida' | 'Convertida'
  dias_restantes: number
}

export interface PortalPrueba {
  nombre: string
  empresa: string | null
  asesor: string | null
  asesor_email: string | null
  pruebas: PruebaPortal[]
}

export type SeccionPortal = '/precios' | '/caracteristicas' | '/soporte'

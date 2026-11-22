export interface ProductoGratuito {
  producto_id: number
  nombre: string
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

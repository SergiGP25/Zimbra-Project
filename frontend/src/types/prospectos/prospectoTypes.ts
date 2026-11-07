export interface Prospecto {
  id: number
  nombre: string
  empresa?: string | null
  email: string
  telefono?: string | null
  estado: string
  puntaje: number
  id_campana: number
  id_vendedor?: number | null
  vendedor_nombre?: string | null
  fecha_registro?: string
}

export interface ProspectoListResponse {
  total: number
  rol_consultante: string
  mensaje_filtro: string
  prospectos: Prospecto[]
}


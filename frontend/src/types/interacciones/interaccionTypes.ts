export interface InteraccionCreate {
  prospecto_id: number
  tipo: 'Llamada' | 'Correo'
  resultado: 'Positivo' | 'Neutro' | 'Negativo' | 'Sin respuesta'
  notas?: string
  campana_id?: number
}

export interface Interaccion {
  id: number
  prospecto_id: number
  prospecto_nombre: string
  empleado_id: number
  empleado_nombre: string
  campana_id?: number
  tipo: string
  fecha_hora: string
  resultado: string
  notas?: string
}

export interface InteraccionListResponse {
  total: number
  interacciones: Interaccion[]
}

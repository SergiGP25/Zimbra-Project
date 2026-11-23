// Formas de los datos que devuelve la API. Coinciden con los SELECT del backend.
// Los montos llegan como número o como texto (DECIMAL de MySQL); se formatean al mostrar.

export type EstadoProspecto = 'Nuevo' | 'En prueba' | 'Calificado' | 'Cliente' | 'Descartado'

export interface Producto {
  producto_id: number
  nombre: string
  descripcion: string | null
  version: 'Gratuita' | 'Comercial'
  precio_unitario: number
  activo: boolean
  pruebas: number
  propuestas: number
}

export interface Campana {
  campana_id: number
  nombre: string
  canal: 'Email' | 'Web' | 'Referido'
  fecha_inicio: string
  fecha_fin: string | null
  presupuesto: number
  vigente: boolean
  prospectos: number
  pruebas: number
  ventas: number
  monto_vendido: number
}

export interface Prospecto {
  prospecto_id: number
  nombre: string
  empresa: string | null
  email: string
  telefono: string | null
  estado: EstadoProspecto
  puntaje: number
  fecha_registro: string | null
  campana_id: number
  campana_nombre: string | null
  empleado_id: number | null
  vendedor_nombre: string | null
  fecha_asignacion: string | null
  transiciones_permitidas: EstadoProspecto[]
}

export interface ProspectoLista {
  total: number
  pagina: number
  por_pagina: number
  total_paginas: number
  prospectos: Prospecto[]
}

export interface ProspectoOpcion {
  prospecto_id: number
  nombre: string
  empresa: string | null
  estado: EstadoProspecto
  empleado_id: number | null
}

export interface Catalogos {
  campanas: { campana_id: number; nombre: string; canal: string }[]
  vendedores: { empleado_id: number; nombre: string }[]
  estados: EstadoProspecto[]
}

export interface Prueba {
  descarga_id: number
  prospecto_id: number
  prospecto: string
  empresa: string | null
  producto_id: number
  producto: string
  fecha_inicio: string
  fecha_fin: string
  estado: 'Activa' | 'Vencida' | 'Convertida'
  dias_restantes: number
  vendedor: string | null
}

export interface Visita {
  visita_id: number
  prospecto_id: number
  prospecto: string
  fecha_hora: string
  pagina_visitada: string
  duracion_segundos: number
  puntos: number
}

export interface Alerta {
  alerta_id: number
  prospecto_id: number
  prospecto: string
  empresa: string | null
  estado_prospecto: EstadoProspecto
  puntaje: number
  vendedor: string
  fecha_hora: string
  motivo: 'Visita al sitio' | 'Prueba por vencer'
  atendida: boolean | number
}

export interface Interaccion {
  interaccion_id: number
  prospecto_id: number
  prospecto: string
  empresa: string | null
  empleado: string
  tipo: 'Llamada' | 'Correo'
  fecha_hora: string
  resultado: 'Positivo' | 'Neutro' | 'Negativo' | 'Sin respuesta'
  notas: string | null
  campana: string | null
}

export interface Propuesta {
  propuesta_id: number
  prospecto_id: number
  prospecto: string
  empresa: string | null
  empleado_id: number
  vendedor: string
  producto_id: number
  producto: string
  precio_unitario: number
  num_licencias: number
  valor_total: number
  fecha_emision: string
  estado: 'Enviada' | 'Aceptada' | 'Rechazada'
  venta_id: number | null
}

export interface Venta {
  venta_id: number
  propuesta_id: number
  prospecto_id: number
  prospecto: string
  empresa: string | null
  vendedor: string
  producto: string
  num_licencias: number
  valor_total: number
  monto_final: number
  fecha_venta: string
  forma_pago: string
  estado: 'Pendiente' | 'Pagada'
  fecha_pago: string | null
}

export interface Ficha {
  prospecto: Prospecto
  desglose_puntaje: { pruebas: number; visitas: number; interacciones: number; total_calculado: number }
  pruebas: Prueba[]
  visitas: Visita[]
  alertas: Alerta[]
  interacciones: Interaccion[]
  propuestas: Propuesta[]
  ventas: Venta[]
}

export interface Panel {
  rol: string
  prospectos_por_estado: Partial<Record<EstadoProspecto, number>>
  alertas_pendientes: number
  pruebas_por_vencer: number
  propuestas_enviadas: number
  ventas_mes: number
  monto_mes: number
  ventas_pendientes_pago: number
}

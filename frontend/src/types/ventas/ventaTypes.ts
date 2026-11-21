export interface VentaCreate {
  propuesta_id: number
  forma_pago: 'Tarjeta' | 'Transferencia' | 'Factura' | 'Efectivo'
  monto?: number
}

export interface Venta {
  id: number
  propuesta_id: number
  prospecto_id: number
  prospecto_nombre: string
  vendedor_id: number
  vendedor_nombre: string
  fecha_venta: string
  monto_final: number
  forma_pago: string
  estado: string
  fecha_pago?: string
}

export interface VentaListResponse {
  total: number
  ventas: Venta[]
}

export interface PropuestaAceptada {
  id: number
  prospecto_id: number
  prospecto_nombre: string
  vendedor_id: number
  vendedor_nombre: string
  producto_id: number
  producto_nombre: string
  num_licencias: number
  valor_total: number
}

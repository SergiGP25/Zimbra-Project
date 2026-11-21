import { request } from '../api'
import {
  VentaCreate,
  Venta,
  VentaListResponse,
  PropuestaAceptada,
} from '../../types/ventas/ventaTypes'

export const ventaService = {
  list(fechaDesde?: string, fechaHasta?: string): Promise<VentaListResponse> {
    const params = new URLSearchParams()
    if (fechaDesde) params.set('fecha_desde', fechaDesde)
    if (fechaHasta) params.set('fecha_hasta', fechaHasta)
    const query = params.toString() ? `?${params}` : ''
    return request<VentaListResponse>(`/ventas/${query}`)
  },
  acceptedProposals(): Promise<PropuestaAceptada[]> {
    return request<PropuestaAceptada[]>('/ventas/propuestas-aceptadas')
  },
  create(payload: VentaCreate): Promise<Venta> {
    return request<Venta>('/ventas/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

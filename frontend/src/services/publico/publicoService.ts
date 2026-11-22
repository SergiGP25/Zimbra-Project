import { request } from '../api'
import { ProductoGratuito, PruebaRegistrada, SolicitudPrueba } from '../../types/publico/publicoTypes'

// Llamadas del sitio público. No necesitan sesión: el backend no pide token.
export const publicoService = {
  async listarProductosGratuitos(): Promise<ProductoGratuito[]> {
    return request<ProductoGratuito[]>('/publico/productos-gratuitos')
  },

  async solicitarPrueba(datos: SolicitudPrueba): Promise<PruebaRegistrada> {
    return request<PruebaRegistrada>('/publico/prueba-gratis', {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  },
}

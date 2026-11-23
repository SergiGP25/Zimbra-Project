import { request } from '../api'
import {
  PortalPrueba,
  ProductoGratuito,
  PruebaRegistrada,
  SeccionPortal,
  SolicitudPrueba,
} from '../../types/publico/publicoTypes'

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

  // "Mi prueba": el token viene en el enlace del correo
  async verMiPrueba(token: string): Promise<PortalPrueba> {
    return request<PortalPrueba>(`/publico/mi-prueba?token=${encodeURIComponent(token)}`)
  },

  // Abrir una sección del portal cuenta como visita web (suma puntaje)
  async visitarSeccion(token: string, pagina: SeccionPortal): Promise<{ registrada: boolean; mensaje: string }> {
    return request('/publico/mi-prueba/visita', {
      method: 'POST',
      body: JSON.stringify({ token, pagina }),
    })
  },
}

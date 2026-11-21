import { request } from '../api'
import {
  InteraccionCreate,
  Interaccion,
  InteraccionListResponse,
} from '../../types/interacciones/interaccionTypes'

export const interaccionService = {
  list(prospectoId?: number): Promise<InteraccionListResponse> {
    const query = prospectoId ? `?prospecto_id=${prospectoId}` : ''
    return request<InteraccionListResponse>(`/interacciones/${query}`)
  },
  create(payload: InteraccionCreate): Promise<Interaccion> {
    return request<Interaccion>('/interacciones/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

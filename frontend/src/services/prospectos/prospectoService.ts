import { request } from '../api'
import { ProspectoListResponse } from '../../types/prospectos/prospectoTypes'

export const prospectoService = {
  async listProspectos(): Promise<ProspectoListResponse> {
    return request<ProspectoListResponse>('/prospectos/')
  },
}


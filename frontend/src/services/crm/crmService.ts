import { request } from '../api'
import { query } from '../../lib/formato'
import {
  Alerta, Campana, Catalogos, Ficha, Interaccion, Panel, Producto, Propuesta, Prospecto,
  ProspectoLista, ProspectoOpcion, Prueba, Venta, Visita,
} from '../../types/crm/crmTypes'

/*
  Una función por endpoint de la API. Las pantallas nunca escriben URLs:
  llaman a estas funciones. Si mañana cambia una ruta, se cambia aquí y solo aquí.
*/
type Params = Record<string, string | number | boolean | null | undefined>
const enviar = (metodo: string, datos?: unknown): RequestInit => ({ method: metodo, body: datos ? JSON.stringify(datos) : undefined })

export const productoService = {
  listar: (p: Params = {}) => request<{ total: number; productos: Producto[] }>(`/productos/${query(p)}`),
  crear: (d: Partial<Producto>) => request<Producto>('/productos/', enviar('POST', d)),
  editar: (id: number, d: Partial<Producto>) => request<Producto>(`/productos/${id}`, enviar('PUT', d)),
  cambiarActivo: (id: number, activo: boolean) => request<Producto>(`/productos/${id}/activo?activo=${activo}`, enviar('PATCH')),
}

export const campanaService = {
  listar: (p: Params = {}) => request<{ total: number; campanas: Campana[] }>(`/campanas/${query(p)}`),
  crear: (d: Partial<Campana>) => request<Campana>('/campanas/', enviar('POST', d)),
  editar: (id: number, d: Partial<Campana>) => request<Campana>(`/campanas/${id}`, enviar('PUT', d)),
}

export const prospectoService = {
  listar: (p: Params = {}) => request<ProspectoLista>(`/prospectos/${query(p)}`),
  opciones: () => request<ProspectoOpcion[]>('/prospectos/opciones'),
  catalogos: () => request<Catalogos>('/prospectos/catalogos'),
  obtener: (id: number) => request<Prospecto>(`/prospectos/${id}`),
  ficha: (id: number) => request<Ficha>(`/prospectos/${id}/ficha`),
  crear: (d: Record<string, unknown>) => request<Prospecto>('/prospectos/', enviar('POST', d)),
  editar: (id: number, d: Record<string, unknown>) => request<Prospecto>(`/prospectos/${id}`, enviar('PUT', d)),
  cambiarEstado: (id: number, estado: string) => request<Prospecto>(`/prospectos/${id}/estado`, enviar('PATCH', { estado })),
  asignar: (id: number, empleado_id: number) =>
    request<{ prospecto: Prospecto; alertas_movidas: number }>(`/prospectos/${id}/asignar`, enviar('PATCH', { empleado_id })),
}

export const pruebaService = {
  listar: (p: Params = {}) => request<Prueba[]>(`/pruebas/${query(p)}`),
  registrar: (prospecto_id: number, producto_id: number) => request<Prueba>('/pruebas/', enviar('POST', { prospecto_id, producto_id })),
  vencer: () => request<{ pruebas_vencidas: number; alertas_creadas: number }>('/pruebas/vencer', enviar('POST')),
}

export const visitaService = {
  listar: (p: Params = {}) => request<Visita[]>(`/visitas/${query(p)}`),
  registrar: (d: { prospecto_id: number; pagina_visitada: string; duracion_segundos: number }) =>
    request<{ visita_id: number; alerta_generada: boolean; puntos: number; estado: string; puntaje: number }>('/visitas/', enviar('POST', d)),
}

export const alertaService = {
  listar: (soloPendientes: boolean) => request<Alerta[]>(`/alertas/?solo_pendientes=${soloPendientes}`),
  pendientes: () => request<{ pendientes: number }>('/alertas/pendientes'),
  atender: (id: number) => request<{ atendida: boolean }>(`/alertas/${id}/atender`, enviar('PATCH')),
}

export const interaccionService = {
  listar: (p: Params = {}) => request<Interaccion[]>(`/interacciones/${query(p)}`),
  registrar: (d: Record<string, unknown>) =>
    request<{ interaccion_id: number; puntaje: number; estado_prospecto: string }>('/interacciones/', enviar('POST', d)),
}

export const propuestaService = {
  listar: (p: Params = {}) => request<Propuesta[]>(`/propuestas/${query(p)}`),
  crear: (d: { prospecto_id: number; producto_id: number; num_licencias: number }) => request<Propuesta>('/propuestas/', enviar('POST', d)),
  cambiarEstado: (id: number, estado: 'Aceptada' | 'Rechazada') => request<Propuesta>(`/propuestas/${id}/estado`, enviar('PATCH', { estado })),
}

export const ventaService = {
  listar: (p: Params = {}) => request<{ total: number; monto_total: number; ventas: Venta[] }>(`/ventas/${query(p)}`),
  registrar: (d: { propuesta_id: number; forma_pago: string; monto_final?: number | null }) => request<Venta>('/ventas/', enviar('POST', d)),
  pagar: (id: number) => request<Venta>(`/ventas/${id}/pagar`, enviar('PATCH')),
}

export const reporteService = {
  panel: () => request<Panel>('/reportes/panel'),
  ventasMensual: (anio: number, mes: number) =>
    request<{ detalle: Record<string, any>[]; total: Record<string, any> }>(`/reportes/ventas-mensual?anio=${anio}&mes=${mes}`),
  resumenAnual: (anio: number) => request<Record<string, any>[]>(`/reportes/resumen-anual?anio=${anio}`),
  conversion: (p: Params) => request<Record<string, any>>(`/reportes/conversion${query(p)}`),
  campanas: (p: Params) => request<Record<string, any>[]>(`/reportes/campanas${query(p)}`),
  embudo: (vendedor_id?: number) => request<Record<string, any>[]>(`/reportes/embudo${query({ vendedor_id })}`),
  tasaCierre: (p: Params) => request<Record<string, any>>(`/reportes/tasa-cierre${query(p)}`),
  vistas: () => request<Record<string, string>>('/reportes/vistas'),
  vista: (nombre: string, limite = 200) => request<Record<string, any>[]>(`/reportes/vistas/${nombre}?limite=${limite}`),
}

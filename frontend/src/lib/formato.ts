// Formatos para mostrar datos. Todos los valores del sistema están en pesos
// colombianos (COP); el peso no usa centavos en la práctica, por eso 0 decimales.
const moneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export const formatoMoneda = (v: number | string | null | undefined) => (v == null ? '—' : moneda.format(Number(v)))

/** La API envía fechas como "2026-11-20"; se agrega la hora para que no cambie de día por la zona horaria. */
export const formatoFecha = (v?: string | null) =>
  v ? new Date(v.length === 10 ? v + 'T00:00' : v).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export const formatoFechaHora = (v?: string | null) =>
  v ? new Date(v).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export const hoyISO = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** Construye "?a=1&b=2" ignorando valores vacíos. */
export const query = (params: Record<string, string | number | boolean | null | undefined>) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) q.append(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** Descarga una lista de objetos como archivo CSV que abre Excel (RF-45). */
export function descargarCSV(nombre: string, filas: Record<string, unknown>[]) {
  if (!filas.length) return
  const columnas = Object.keys(filas[0])
  const celda = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const texto = [columnas.join(';'), ...filas.map((f) => columnas.map((c) => celda(f[c])).join(';'))].join('\r\n')
  // ﻿ (BOM) hace que Excel reconozca las tildes
  const blob = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nombre}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

import React, { useId } from 'react'

/*
  Gráficas del panel dibujadas con SVG, sin librerías.

  Idea común: los datos se convierten en coordenadas. Si el valor máximo es
  100 y la gráfica mide 200 px de alto, un valor de 50 queda a 100 px.
  La línea suave se arma con curvas de Bézier que pasan por cada punto
  (método Catmull-Rom): da la forma ondulada sin inventar datos.

  Colores: el trazo usa el degradado de la paleta (orquídea -> ámbar).
*/

type Punto = [number, number]

/** Convierte puntos en un camino SVG suave que pasa por todos ellos. */
function caminoSuave(puntos: Punto[]): string {
  if (puntos.length === 0) return ''
  if (puntos.length === 1) return `M${puntos[0][0]},${puntos[0][1]}`
  let d = `M${puntos[0][0]},${puntos[0][1]}`
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i - 1] || puntos[i]
    const p1 = puntos[i]
    const p2 = puntos[i + 1]
    const p3 = puntos[i + 2] || p2
    const c1: Punto = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Punto = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  return d
}

/** Degradado de la marca, reutilizable dentro de cada SVG (cada uno con su id). */
const Degradado: React.FC<{ id: string; vertical?: boolean }> = ({ id, vertical }) => (
  <linearGradient id={id} x1="0" y1={vertical ? '1' : '0'} x2={vertical ? '0' : '1'} y2="0">
    <stop offset="0%" stopColor="#A678B9" />
    <stop offset="100%" stopColor="#F4A62A" />
  </linearGradient>
)

/** Mini-gráfica de las tarjetas de indicadores. Sin ejes: solo la forma. */
export const Sparkline: React.FC<{ valores: number[]; ancho?: number; alto?: number }> = ({ valores, ancho = 96, alto = 40 }) => {
  const id = useId().replace(/:/g, '')
  const max = Math.max(...valores, 1)
  const min = Math.min(...valores, 0)
  const paso = valores.length > 1 ? ancho / (valores.length - 1) : ancho
  const puntos: Punto[] = valores.map((v, i) => [i * paso, alto - 4 - ((v - min) / (max - min || 1)) * (alto - 8)])
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} width={ancho} height={alto} className="sparkline" aria-hidden="true">
      <defs><Degradado id={`sp${id}`} /></defs>
      <path d={caminoSuave(puntos)} fill="none" stroke={`url(#sp${id})`} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/**
  Gráfica de línea con ejes. `formato` decide cómo se escriben los valores
  del eje vertical (pesos abreviados, cantidades...).
*/
export const GraficaLinea: React.FC<{
  etiquetas: string[]
  valores: number[]
  formato: (n: number) => string
  descripcion: string
}> = ({ etiquetas, valores, formato, descripcion }) => {
  const id = useId().replace(/:/g, '')
  const W = 640, H = 240, izq = 56, der = 12, arriba = 16, abajo = 28
  const ancho = W - izq - der, alto = H - arriba - abajo
  const max = Math.max(...valores, 1) * 1.15
  const paso = valores.length > 1 ? ancho / (valores.length - 1) : ancho
  const x = (i: number) => izq + i * paso
  const y = (v: number) => arriba + alto - (v / max) * alto
  const puntos: Punto[] = valores.map((v, i) => [x(i), y(v)])
  const linea = caminoSuave(puntos)
  const area = `${linea} L${x(valores.length - 1)},${arriba + alto} L${x(0)},${arriba + alto} Z`
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="grafica" role="img" aria-label={descripcion}>
      <defs>
        <Degradado id={`ln${id}`} />
        <linearGradient id={`ar${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A678B9" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#A678B9" stopOpacity="0" />
        </linearGradient>
        {/* Brillo suave detrás de la línea */}
        <filter id={`gl${id}`} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {marcas.map((m) => (
        <g key={m}>
          <line x1={izq} x2={W - der} y1={y(m)} y2={y(m)} className="grafica-guia" />
          <text x={izq - 10} y={y(m) + 4} textAnchor="end" className="grafica-eje">{formato(m)}</text>
        </g>
      ))}
      <path d={area} fill={`url(#ar${id})`} />
      <path d={linea} fill="none" stroke={`url(#ln${id})`} strokeWidth="6" opacity="0.45" filter={`url(#gl${id})`} />
      <path d={linea} fill="none" stroke={`url(#ln${id})`} strokeWidth="3" strokeLinecap="round" />
      {puntos.map(([px, py], i) => (
        <g key={i}>
          <circle cx={px} cy={py} r="3.5" className="grafica-punto"><title>{`${etiquetas[i]}: ${formato(valores[i])}`}</title></circle>
          <text x={px} y={H - 8} textAnchor="middle" className="grafica-eje">{etiquetas[i]}</text>
        </g>
      ))}
    </svg>
  )
}

/** Barras verticales; la más alta se resalta con el degradado y su porcentaje. */
export const GraficaBarras: React.FC<{
  etiquetas: string[]
  valores: number[]
  descripcion: string
}> = ({ etiquetas, valores, descripcion }) => {
  const id = useId().replace(/:/g, '')
  const W = 320, H = 240, arriba = 34, abajo = 28, lado = 8
  const alto = H - arriba - abajo
  const max = Math.max(...valores, 1)
  const total = valores.reduce((s, v) => s + v, 0) || 1
  const mayor = valores.indexOf(Math.max(...valores))
  const columna = (W - lado * 2) / valores.length
  const anchoBarra = Math.min(26, columna * 0.5)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="grafica" role="img" aria-label={descripcion}>
      <defs>
        <Degradado id={`br${id}`} vertical />
        <linearGradient id={`bn${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2D2B55" />
          <stop offset="100%" stopColor="#6A5ACD" />
        </linearGradient>
      </defs>
      {valores.map((v, i) => {
        const h = Math.max(4, (v / max) * alto)
        const cx = lado + columna * i + columna / 2
        const yBarra = arriba + alto - h
        const resaltada = i === mayor
        const pct = Math.round((v / total) * 100)
        return (
          <g key={i}>
            <rect x={cx - anchoBarra / 2} y={yBarra} width={anchoBarra} height={h} rx="5"
              fill={resaltada ? `url(#br${id})` : `url(#bn${id})`}>
              <title>{`${etiquetas[i]}: ${v} (${pct} %)`}</title>
            </rect>
            {resaltada && (
              <g>
                <rect x={cx - 22} y={yBarra - 30} width="44" height="22" rx="6" className="grafica-globo" />
                <text x={cx} y={yBarra - 15} textAnchor="middle" className="grafica-globo-texto">{pct} %</text>
              </g>
            )}
            <text x={cx} y={H - 8} textAnchor="middle" className="grafica-eje">{etiquetas[i]}</text>
          </g>
        )
      })}
    </svg>
  )
}

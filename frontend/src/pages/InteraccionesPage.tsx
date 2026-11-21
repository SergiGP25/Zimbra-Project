import React, { useEffect, useState } from 'react'
import { interaccionService } from '../services/interacciones/interaccionService'
import { prospectoService } from '../services/prospectos/prospectoService'
import { Interaccion } from '../types/interacciones/interaccionTypes'
import { Prospecto } from '../types/prospectos/prospectoTypes'

export const InteraccionesPage: React.FC = () => {
  const [items, setItems] = useState<Interaccion[]>([])
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [prospectoId, setProspectoId] = useState('')
  const [tipo, setTipo] = useState<'Llamada' | 'Correo'>('Llamada')
  const [resultado, setResultado] = useState<'Positivo' | 'Neutro' | 'Negativo' | 'Sin respuesta'>('Positivo')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')

  const load = async (filter?: number) => {
    try {
      const data = await interaccionService.list(filter)
      setItems(data.interacciones)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar interacciones')
    }
  }

  useEffect(() => {
    load()
    prospectoService.listProspectos()
      .then((data) => setProspectos(data.prospectos))
      .catch((err) => setError(err instanceof Error ? err.message : 'No fue posible cargar prospectos'))
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!prospectoId) {
      setError('Seleccione un prospecto.')
      return
    }
    try {
      await interaccionService.create({
        prospecto_id: Number(prospectoId),
        tipo,
        resultado,
        notas: notas || undefined,
      })
      setNotas('')
      await load(prospectoId ? Number(prospectoId) : undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible registrar la interacción')
    }
  }

  return (
    <section className="entity-page">
      <h1>Interacciones</h1>
      {error && <div className="error-message">{error}</div>}

      <form className="filter-bar" onSubmit={submit}>
        <select value={prospectoId} onChange={(event) => setProspectoId(event.target.value)} required>
          <option value="">Seleccione prospecto</option>
          {prospectos.map((prospecto) => (
            <option key={prospecto.id} value={prospecto.id}>
              {prospecto.nombre}
            </option>
          ))}
        </select>
        <select value={tipo} onChange={(event) => setTipo(event.target.value as 'Llamada' | 'Correo')}>
          <option>Llamada</option>
          <option>Correo</option>
        </select>
        <select value={resultado} onChange={(event) => setResultado(event.target.value as typeof resultado)}>
          <option>Positivo</option>
          <option>Neutro</option>
          <option>Negativo</option>
          <option>Sin respuesta</option>
        </select>
        <input value={notas} onChange={(event) => setNotas(event.target.value)} placeholder="Notas" />
        <button type="submit">Registrar interacción</button>
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Prospecto</th>
              <th>Vendedor</th>
              <th>Tipo</th>
              <th>Resultado</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.fecha_hora).toLocaleString()}</td>
                <td>{item.prospecto_nombre}</td>
                <td>{item.empleado_nombre}</td>
                <td>{item.tipo}</td>
                <td>{item.resultado}</td>
                <td>{item.notas || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

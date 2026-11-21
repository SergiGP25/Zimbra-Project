import React, { useEffect, useState } from 'react'
import { ventaService } from '../services/ventas/ventaService'
import { PropuestaAceptada, Venta } from '../types/ventas/ventaTypes'

export const VentasPage: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [propuestas, setPropuestas] = useState<PropuestaAceptada[]>([])
  const [propuestaId, setPropuestaId] = useState('')
  const [formaPago, setFormaPago] = useState<'Tarjeta' | 'Transferencia' | 'Factura' | 'Efectivo'>('Transferencia')
  const [monto, setMonto] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [ventaData, propuestaData] = await Promise.all([
        ventaService.list(),
        ventaService.acceptedProposals(),
      ])
      setVentas(ventaData.ventas)
      setPropuestas(propuestaData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar ventas')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!propuestaId) {
      setError('Seleccione una propuesta aceptada.')
      return
    }
    try {
      await ventaService.create({
        propuesta_id: Number(propuestaId),
        forma_pago: formaPago,
        monto: monto ? Number(monto) : undefined,
      })
      setPropuestaId('')
      setMonto('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible registrar la venta')
    }
  }

  return (
    <section className="entity-page">
      <h1>Ventas</h1>
      {error && <div className="error-message">{error}</div>}

      <form className="filter-bar" onSubmit={submit}>
        <select value={propuestaId} onChange={(event) => setPropuestaId(event.target.value)} required>
          <option value="">Seleccione propuesta aceptada</option>
          {propuestas.map((propuesta) => (
            <option key={propuesta.id} value={propuesta.id}>
              #{propuesta.id} · {propuesta.prospecto_nombre} · ${propuesta.valor_total}
            </option>
          ))}
        </select>
        <select value={formaPago} onChange={(event) => setFormaPago(event.target.value as typeof formaPago)}>
          <option>Tarjeta</option>
          <option>Transferencia</option>
          <option>Factura</option>
          <option>Efectivo</option>
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          value={monto}
          onChange={(event) => setMonto(event.target.value)}
          placeholder="Monto opcional"
        />
        <button type="submit">Registrar venta</button>
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Prospecto</th>
              <th>Vendedor</th>
              <th>Monto</th>
              <th>Forma de pago</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id}>
                <td>{venta.fecha_venta}</td>
                <td>{venta.prospecto_nombre}</td>
                <td>{venta.vendedor_nombre}</td>
                <td>${venta.monto_final}</td>
                <td>{venta.forma_pago}</td>
                <td>{venta.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

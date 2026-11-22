import { useCallback, useEffect, useState } from 'react'

/*
  Hook para cargar datos de la API.
  Repite el mismo patrón que usan todas las pantallas: estado de carga,
  error y una función para volver a pedir los datos después de guardar.

  const { datos, cargando, error, recargar } = useCarga(() => servicio.listar(), [filtro])
  Cuando cambia algo de la lista de dependencias (el filtro), vuelve a cargar.
*/
export function useCarga<T>(cargar: () => Promise<T>, dependencias: unknown[] = []) {
  const [datos, setDatos] = useState<T | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(cargar, dependencias)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setDatos(await ejecutar())
    } catch (err: any) {
      setError(err?.detail || 'No se pudieron cargar los datos.')
    } finally {
      setCargando(false)
    }
  }, [ejecutar])

  useEffect(() => {
    recargar()
  }, [recargar])

  return { datos, cargando, error, recargar, setDatos }
}

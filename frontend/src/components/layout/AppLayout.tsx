import React from 'react'
import { coincide } from '../../router/router'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { PanelPage } from '../../pages/app/PanelPage'
import { ProspectosPage } from '../../pages/app/ProspectosPage'
import { FichaProspectoPage } from '../../pages/app/FichaProspectoPage'
import { AlertasPage } from '../../pages/app/AlertasPage'
import { PruebasPage } from '../../pages/app/PruebasPage'
import { VisitasPage } from '../../pages/app/VisitasPage'
import { InteraccionesPage } from '../../pages/app/InteraccionesPage'
import { PropuestasPage } from '../../pages/app/PropuestasPage'
import { VentasPage } from '../../pages/app/VentasPage'
import { CampanasPage } from '../../pages/app/CampanasPage'
import { ProductosPage } from '../../pages/app/ProductosPage'
import { ReportesPage } from '../../pages/app/ReportesPage'
import { EmpleadosPage } from '../../pages/EmpleadosPage'

/*
  Tabla de rutas de la zona interna: patrón -> pantalla.
  Para agregar una pantalla nueva: crear el componente y sumar una línea aquí
  y una opción en Sidebar.tsx.
*/
const RUTAS: { patron: string; pagina: React.FC<{ params: Record<string, string> }> }[] = [
  { patron: '/app', pagina: PanelPage },
  { patron: '/app/prospectos', pagina: ProspectosPage },
  { patron: '/app/prospectos/:id', pagina: FichaProspectoPage },
  { patron: '/app/alertas', pagina: AlertasPage },
  { patron: '/app/pruebas', pagina: PruebasPage },
  { patron: '/app/visitas', pagina: VisitasPage },
  { patron: '/app/interacciones', pagina: InteraccionesPage },
  { patron: '/app/propuestas', pagina: PropuestasPage },
  { patron: '/app/ventas', pagina: VentasPage },
  { patron: '/app/campanas', pagina: CampanasPage },
  { patron: '/app/productos', pagina: ProductosPage },
  { patron: '/app/reportes', pagina: ReportesPage },
  { patron: '/app/empleados', pagina: () => <EmpleadosPage /> },
]

export const AppLayout: React.FC<{ ruta: string }> = ({ ruta }) => {
  let contenido: React.ReactNode = <PanelPage params={{}} />
  for (const r of RUTAS) {
    const params = coincide(r.patron, ruta)
    if (params) {
      const Pagina = r.pagina
      // key: si cambias de un prospecto a otro, la pantalla se crea de nuevo
      contenido = <Pagina key={ruta} params={params} />
      break
    }
  }

  return (
    <div className="app-layout">
      <div className="main-content-layout">
        <Sidebar rutaActual={ruta} />
        <main className="page-content">
          <Topbar rutaActual={ruta} />
          {contenido}
        </main>
      </div>
    </div>
  )
}

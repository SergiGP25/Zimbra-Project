// Quién puede hacer qué en la interfaz. Es solo comodidad visual:
// la regla que cuenta la aplica el backend (require_roles) y responde 403.
export type Rol = 'Admin' | 'Marketing' | 'Vendedor'

export const puede = {
  gestionarEmpleados: (r?: string) => r === 'Admin',
  gestionarProductos: (r?: string) => r === 'Admin',
  gestionarCampanas: (r?: string) => r === 'Admin' || r === 'Marketing',
  asignarVendedor: (r?: string) => r === 'Admin' || r === 'Marketing',
  simularVisitas: (r?: string) => r === 'Admin' || r === 'Marketing',
  registrarInteracciones: (r?: string) => r === 'Admin' || r === 'Vendedor',
  gestionarPropuestas: (r?: string) => r === 'Admin' || r === 'Vendedor',
  registrarVentas: (r?: string) => r === 'Admin' || r === 'Vendedor',
  marcarPagada: (r?: string) => r === 'Admin',
  verReportes: (r?: string) => r === 'Admin' || r === 'Marketing',
  vencerPruebas: (r?: string) => r === 'Admin' || r === 'Marketing',
}

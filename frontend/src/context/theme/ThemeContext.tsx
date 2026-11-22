import React, { createContext, useContext, useEffect, useState } from 'react'

/*
  CONTEXTO DEL TEMA
  -----------------
  Un "Context" de React guarda un dato que muchos componentes necesitan
  (aquí: el tema) sin tener que pasarlo de padre a hijo por props.
  Funciona igual que AuthContext: un Provider envuelve la app y cualquier
  componente lo lee con el hook useTheme().
*/

export type Tema = 'light' | 'dark'

interface ThemeContextType {
  tema: Tema
  alternarTema: () => void
}

const CLAVE_STORAGE = 'zimbra_theme'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Valor inicial: el que dejó el script de index.html en <html data-theme>
const temaInicial = (): Tema =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tema, setTema] = useState<Tema>(temaInicial)

  // Cada vez que cambia el tema: actualizar <html> y recordarlo en el navegador
  useEffect(() => {
    document.documentElement.dataset.theme = tema
    try {
      localStorage.setItem(CLAVE_STORAGE, tema)
    } catch {
      // Navegación privada u otro bloqueo: el tema funciona igual, solo no se recuerda
    }
  }, [tema])

  const alternarTema = () => setTema((actual) => (actual === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider')
  }
  return context
}

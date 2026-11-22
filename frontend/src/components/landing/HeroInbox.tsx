import React from 'react'

/*
  Ilustración del encabezado: una bandeja de entrada que cuenta, mensaje a
  mensaje, lo que vive alguien que pide la prueba. Es contenido estático
  (no llama a la API): solo explica el producto con su propio lenguaje.
  Los mensajes "no leídos" llevan el punto mostaza.
*/

interface Mensaje {
  remitente: string
  asunto: string
  vista: string
  hora: string
  noLeido: boolean
}

const MENSAJES: Mensaje[] = [
  {
    remitente: 'Zimbra',
    asunto: 'Tu prueba de 60 días está activa',
    vista: 'Instala el cliente de escritorio y entra con tu correo de siempre.',
    hora: '9:02',
    noLeido: true,
  },
  {
    remitente: 'Camila, asesora',
    asunto: '¿Cómo va la migración de buzones?',
    vista: 'Vi que revisaste los planes. Si quieres, lo vemos en 15 minutos.',
    hora: '11:40',
    noLeido: true,
  },
  {
    remitente: 'Equipo de soporte',
    asunto: 'Calendario compartido configurado',
    vista: 'Tu equipo ya puede ver la agenda de salas desde el navegador.',
    hora: 'Ayer',
    noLeido: false,
  },
  {
    remitente: 'Zimbra',
    asunto: 'Quedan 7 días de tu prueba',
    vista: 'Tus correos y contactos se conservan al pasar a la versión comercial.',
    hora: 'Lun',
    noLeido: false,
  },
]

export const HeroInbox: React.FC = () => (
  <div className="inbox" aria-label="Ejemplo de bandeja de entrada durante la prueba">
    <div className="inbox-bar">
      <span className="inbox-folder">Bandeja de entrada</span>
      <span className="inbox-count">2 sin leer</span>
    </div>
    <ul className="inbox-list">
      {MENSAJES.map((m, i) => (
        // style con una variable CSS: cada mensaje llega un poco después del anterior
        <li
          key={m.asunto}
          className={`inbox-item${m.noLeido ? ' is-unread' : ''}`}
          style={{ '--orden': i } as React.CSSProperties}
        >
          <span className="inbox-dot" aria-label={m.noLeido ? 'No leído' : undefined} />
          <div className="inbox-text">
            <div className="inbox-line">
              <span className="inbox-from">{m.remitente}</span>
              <span className="inbox-time">{m.hora}</span>
            </div>
            <div className="inbox-subject">{m.asunto}</div>
            <div className="inbox-preview">{m.vista}</div>
          </div>
        </li>
      ))}
    </ul>
  </div>
)

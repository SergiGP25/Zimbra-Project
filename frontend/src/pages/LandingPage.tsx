import React from 'react'
import '../styles/landing.css'
import { PublicHeader } from '../components/landing/PublicHeader'
import { HeroInbox } from '../components/landing/HeroInbox'
import { TrialSection } from '../components/landing/TrialSection'
import { PlanesSection } from '../components/landing/PlanesSection'

/*
  Página pública: lo que ve quien NO ha iniciado sesión.
  Reemplaza la antigua LoginPage. El login ahora vive en el encabezado.
  Cada <section> tiene un id para que los enlaces del menú (#producto…)
  lleven directo a ella.
*/

const PASOS = [
  {
    titulo: 'Eliges un producto y dejas tus datos',
    texto: 'La prueba se activa al instante y dura 60 días. No pedimos tarjeta.',
  },
  {
    titulo: 'Lo usas con tu equipo',
    texto: 'Correo, calendario y documentos compartidos, desde el navegador o el escritorio.',
  },
  {
    titulo: 'Un asesor te acompaña',
    texto: 'Cuando lo necesites, alguien del equipo te ayuda a migrar buzones o a elegir un plan.',
  },
]

const PREGUNTAS = [
  {
    p: '¿Necesito tarjeta de crédito para la prueba?',
    r: 'No. Solo tu nombre y un correo de trabajo. La prueba se activa al instante y dura 60 días.',
  },
  {
    p: '¿Qué pasa con mis correos cuando termina la prueba?',
    r: 'Se conservan. Si pasas a un plan comercial, sigues trabajando con los mismos buzones, contactos y calendarios.',
  },
  {
    p: '¿Puedo probar más de un producto?',
    r: 'Sí. Puedes tener una prueba activa por cada producto gratuito al mismo tiempo.',
  },
  {
    p: '¿Quién me ayuda durante la prueba?',
    r: 'Un asesor del equipo comercial. Te escribe cuando ve que exploras los planes o cuando tu prueba está por terminar.',
  },
  {
    p: '¿Dónde quedan mis datos?',
    r: 'Zimbra es de código abierto: puedes instalarlo en tus propios servidores o usarlo en la nube.',
  },
]

const FUNCIONES = [
  { titulo: 'Correo empresarial', texto: 'Tu dominio, filtros, firmas y búsqueda en todos tus buzones.' },
  { titulo: 'Calendario y salas', texto: 'Agenda compartida y reserva de salas sin cruzar correos.' },
  { titulo: 'Contactos y tareas', texto: 'Una libreta de la empresa y listas de pendientes por equipo.' },
  { titulo: 'Código abierto', texto: 'Lo instalas en tus servidores o en la nube, y tus datos siguen siendo tuyos.' },
]

export const LandingPage: React.FC = () => (
  <div className="landing" id="inicio">
    <PublicHeader />

    <main>
      <section className="hero">
        <div className="hero-copy">
          <h1>Correo y colaboración que tu empresa controla.</h1>
          <p className="hero-lead">
            Zimbra reúne correo, calendario y documentos en un solo lugar. Pruébalo 60 días con tu
            equipo antes de decidir.
          </p>
          <div className="hero-actions">
            <a href="#prueba" className="btn btn-primary btn-lg">
              Probar gratis 60 días
            </a>
            <a href="#como-funciona" className="btn btn-ghost btn-lg">
              Ver cómo funciona
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <HeroInbox />
        </div>
      </section>

      <section id="producto" className="band">
        <div className="band-inner">
          <h2>Lo que incluye</h2>
          <dl className="feature-list">
            {FUNCIONES.map((f) => (
              <div key={f.titulo} className="feature">
                <dt>{f.titulo}</dt>
                <dd>{f.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="como-funciona" className="band">
        <div className="band-inner">
          <h2>Cómo funciona la prueba</h2>
          {/* <ol> porque los pasos sí son una secuencia: el número informa el orden */}
          <ol className="steps">
            {PASOS.map((p) => (
              <li key={p.titulo} className="step">
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="planes" className="band">
        <div className="band-inner">
          <h2>Planes comerciales</h2>
          <p className="band-lead">Precios en pesos colombianos por usuario al mes. Empieza con la prueba gratis y elige después.</p>
          <PlanesSection />
        </div>
      </section>

      <section id="prueba" className="band band-trial">
        <div className="band-inner trial-layout">
          <div className="trial-intro">
            <h2>Activa tu prueba</h2>
            <p>
              Tus datos llegan a nuestro equipo comercial para ayudarte durante la prueba. No los
              compartimos con nadie más.
            </p>
          </div>
          <TrialSection />
        </div>
      </section>
      <section id="preguntas" className="band">
        <div className="band-inner faq-layout">
          <h2>Preguntas frecuentes</h2>
          {/* <details> abre y cierra la respuesta sin JavaScript */}
          <div className="faq">
            {PREGUNTAS.map((q) => (
              <details key={q.p}>
                <summary>{q.p}</summary>
                <p>{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>

    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <span className="wordmark wordmark-small">zimbra</span>
          <p>Correo y colaboración de código abierto.</p>
        </div>
        <nav aria-label="Pie de página" className="footer-links">
          <a href="#producto">Producto</a>
          <a href="#planes">Planes</a>
          <a href="#prueba">Prueba gratis</a>
          <a href="/login">Acceso del equipo</a>
        </nav>
      </div>
      <p className="footer-note">
        Proyecto académico del caso Zimbra para Sistemas Transaccionales, Corporación Universitaria Minuto de Dios.
      </p>
    </footer>
  </div>
)

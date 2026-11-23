# Guía del proyecto: CRM Zimbra

Esta guía explica qué pide el caso, cómo está construido el sistema y qué hace cada parte. Léela con el código abierto al lado.

---

## 1. Qué pide el caso

Zimbra vendía correo y colaboración de código abierto. Su problema era que **no sabía cuáles de los miles de usuarios de la prueba gratuita estaban listos para comprar**. Con OneView empezó a seguir lo que hacía cada prospecto, a darle un puntaje y a avisar al vendedor en el momento justo. La tasa de cierre subió del 10 % al 15 %.

El sistema reproduce ese proceso:

```
Campaña ─► Prospecto ─► Prueba 60 días ─► Visitas al sitio ─► Puntaje ≥ 50 = Calificado
                                                                   │
              Venta ◄── Propuesta aceptada ◄── Llamada / correo ◄── Alerta al vendedor
                │
                └─► Reportes: conversión, ventas del mes, campañas, tasa de cierre
```

### Reglas que mueven todo

| Regla | Qué dice | Dónde se cumple |
|---|---|---|
| RN-01 | El correo de un prospecto es único | `UNIQUE (email)` y `prospecto_service.registrar` |
| RN-02 | La prueba dura 60 días | Columna generada `fecha_fin` |
| RN-03 | Una sola prueba activa por producto | Columna `activa_flag` + `UNIQUE` y T1 |
| RN-04 | Puntaje: prueba +20, visita +5, precios +15, llamada positiva +10 | `sp_sumar_puntos` |
| RN-05 | Con 50 puntos, un prospecto En prueba pasa a Calificado | `sp_sumar_puntos` |
| RN-06 | Si un Calificado visita el sitio, se alerta a su vendedor | T2 con SAVEPOINT |
| RN-07 | Las propuestas solo usan productos Comerciales | Trigger TR-02 |
| RN-09 | Solo una propuesta Aceptada se vende, y una sola vez | T4, TR-06 y `UNIQUE (propuesta_id)` |
| RN-10 | Transiciones de estado permitidas; Cliente solo por venta | `TRANSICIONES` en `prospecto_service.py` |
| RN-12 | El vendedor solo ve lo suyo | `obtener_con_permiso` y filtros por `empleado_id` |
| RN-13 | No se borra lo que tiene historial; se desactiva | `ON DELETE RESTRICT` y botones Desactivar |

---

## 2. Arquitectura: tres piezas

```
┌──────────────────────┐   HTTP + JSON   ┌───────────────────────┐   SQL    ┌──────────────────┐
│ FRONTEND             │ ──────────────► │ BACKEND (API REST)    │ ───────► │ MySQL 8          │
│ React + TypeScript   │                 │ Python + FastAPI      │          │ tablas, triggers,│
│ localhost:5174       │ ◄────────────── │ localhost:8000        │ ◄─────── │ procedimientos   │
└──────────────────────┘                 └───────────────────────┘          └──────────────────┘
```

- **Frontend:** dibuja pantallas y envía peticiones. No decide permisos.
- **Backend:** valida datos, aplica permisos por rol y llama a la base. Es el único que habla con MySQL.
- **Base de datos:** guarda los datos y es la última barrera. Las transacciones T1 a T5, los triggers y los reportes viven ahí.

### Cómo viaja una petición (ejemplo: registrar una venta)

1. En **Propuestas**, el vendedor pulsa *Registrar venta*. `FormVenta` llama a `ventaService.registrar()`.
2. `services/api.ts` hace `POST http://localhost:8000/api/v1/ventas/` con el token JWT.
3. En el backend, `venta_router.py` exige el rol Admin o Vendedor y Pydantic valida el JSON (`VentaCreate`).
4. `venta_service.py` comprueba que la propuesta sea de ese vendedor (RN-12).
5. `llamar_transaccion()` ejecuta `CALL sp_registrar_venta(...)` en MySQL.
6. El procedimiento bloquea la propuesta (`FOR UPDATE`), crea la venta, pasa el prospecto a Cliente y la prueba a Convertida, y hace `COMMIT`. Si algo falla, `ROLLBACK`.
7. Si el procedimiento lanza un error con `SIGNAL`, el manejador global de `main.py` lo convierte en un **400** con el mismo mensaje.
8. La pantalla muestra el aviso y recarga la tabla.

---

## 3. Backend: un módulo por tema, cuatro capas por módulo

```
backend/app/
├── api/v1/<modulo>/<modulo>_router.py         1. URL y permisos (require_roles)
├── schemas/<modulo>/<modulo>_schema.py        2. Qué datos se aceptan (Pydantic)
├── services/<modulo>/<modulo>_service.py      3. Reglas de negocio
├── repositories/<modulo>/<modulo>_repository.py  4. Solo SQL
└── core/db_utils.py                           llamar_transaccion, llamar_reporte, errores
```

Cada capa tiene un solo motivo para cambiar: si cambia una regla, se toca el service; si cambia una columna, el repository.

### Endpoints

Todos van bajo `http://localhost:8000/api/v1`. Puedes probarlos en **http://localhost:8000/docs**.

| Módulo | Método y ruta | Qué hace | Requerimiento | Quién |
|---|---|---|---|---|
| Estado | `GET /health` | Comprueba la conexión con MySQL | Evidencia | Todos |
| Público | `GET /publico/productos-gratuitos`, `GET /publico/planes` | Datos para la página de inicio | — | Sin sesión |
| Público | `POST /publico/prueba-gratis` | Registro del visitante + T1 | RF-05, RF-17 | Sin sesión |
| Auth | `POST /auth/login`, `GET /auth/me`, `PUT /auth/password`, `POST /auth/recuperar`, `POST /auth/restablecer` | Sesión, cambio y recuperación de contraseña por correo | RF-01 a RF-03 | Todos (recuperar: sin sesión) |
| Empleados | `GET/POST/PUT /empleados/` | Gestión de usuarios | RF-04 | Admin |
| Campañas | `GET/POST/PUT /campanas/` | Campañas con resultados | RF-12, RF-13 | Admin, Marketing |
| Productos | `GET/POST/PUT /productos/`, `PATCH /{id}/activo` | Catálogo | RF-14 a RF-16 | Admin edita |
| Prospectos | `GET /prospectos/` (filtros y paginación) | Listado | RF-06 | Todos (RN-12) |
| | `POST /prospectos/`, `PUT /{id}` | Registrar y editar | RF-05, RF-07 | Todos |
| | `PATCH /{id}/estado` | Cambiar estado | RF-08 | Todos |
| | `PATCH /{id}/asignar` | Asignar vendedor (T5) | RF-09 | Admin, Marketing |
| | `GET /{id}/ficha` | Todo el historial | RF-10 | Todos |
| Pruebas | `GET /pruebas/`, `POST /pruebas/` (T1), `POST /pruebas/vencer` | Pruebas de 60 días | RF-17 a RF-21 | — |
| Visitas | `GET /visitas/`, `POST /visitas/` (T2) | Simulador de visitas | RF-22 a RF-24 | Admin, Marketing registran |
| Alertas | `GET /alertas/`, `GET /alertas/pendientes`, `PATCH /{id}/atender` | Bandeja | RF-25 a RF-28 | El vendedor ve las suyas |
| Interacciones | `GET /interacciones/`, `POST /interacciones/` (T3) | Llamadas y correos | RF-29 a RF-31 | Admin, Vendedor registran |
| Propuestas | `GET /propuestas/`, `POST /propuestas/`, `PATCH /{id}/estado` | Ofertas | RF-32 a RF-35 | Admin, Vendedor |
| Ventas | `GET /ventas/`, `POST /ventas/` (T4), `PATCH /{id}/pagar` | Cierre y pago | RF-36 a RF-39 | Pagar: Admin |
| Reportes | `GET /reportes/panel` | Indicadores del inicio | RF-46 | Todos |
| | `GET /reportes/ventas-mensual`, `resumen-anual`, `conversion`, `campanas`, `embudo`, `tasa-cierre` | R-01 a R-06 | RF-40 a RF-44 | Admin, Marketing |

### Códigos de respuesta

| Código | Cuándo |
|---|---|
| 200 / 201 | Todo bien (201 = se creó algo) |
| 400 | Una regla de negocio lo impide (el mensaje dice cuál) |
| 401 | Sin sesión o token vencido: el frontend vuelve al login |
| 403 | Tu rol no puede hacer eso |
| 404 | No existe |
| 409 | La base de datos rechazó el dato (CHECK o UNIQUE) |
| 422 | El JSON no cumple el esquema (falta un campo o un formato) |
| 503 | La base de datos no responde |

---

## 4. Frontend

```
frontend/src/
├── App.tsx                    Decide la página según la ruta y la sesión
├── router/router.tsx          Enrutador mínimo: useRuta, navegar, Enlace
├── pages/
│   ├── LandingPage.tsx        /         sitio público
│   ├── LoginPage.tsx          /login    inicio de sesión
│   └── app/*.tsx              /app/...  una pantalla por módulo
├── components/
│   ├── layout/                AppLayout (tabla de rutas), Navbar, Sidebar
│   ├── crm/Formularios.tsx    Formularios de T1, T3, propuesta y T4
│   ├── prospectos/            Ventanas de prospectos
│   └── ui/ui.tsx              Piezas comunes: Modal, Estado, Encabezado…
├── services/crm/crmService.ts Una función por endpoint
├── types/crm/crmTypes.ts      Forma de los datos de la API
├── lib/                       useCarga, formatos, permisos por rol
└── context/                   Sesión (AuthContext) y tema (ThemeContext)
```

### Rutas

| Ruta | Pantalla | Roles |
|---|---|---|
| `/` | Sitio público: producto, planes, prueba gratis, preguntas | Todos |
| `/login` | Inicio de sesión | Sin sesión |
| `/recuperar`, `/restablecer?token=…` | ¿Olvidaste tu contraseña? y contraseña nueva desde el correo | Sin sesión |
| `/app` | Panel con indicadores y embudo | Todos |
| `/app/alertas` | Bandeja de alertas | Todos (vendedor: las suyas) |
| `/app/prospectos` y `/app/prospectos/:id` | Listado y ficha | Todos |
| `/app/campanas` | Campañas | Admin, Marketing |
| `/app/pruebas` | Pruebas gratuitas | Todos |
| `/app/visitas` | Simulador de visitas | Admin y Marketing registran |
| `/app/interacciones`, `/app/propuestas`, `/app/ventas` | Proceso comercial | Todos |
| `/app/reportes` | Reportes R-01 a R-06 con exportación CSV | Admin, Marketing |
| `/app/productos`, `/app/empleados` | Administración | Admin edita |

---

## 5. Cómo levantarlo y probarlo

### Levantar todo

```bash
docker compose down -v          # solo si cambiaron los .sql (borra los datos)
docker compose up --build
```

- Sitio: http://localhost:5174
- API y Swagger: http://localhost:8000/docs
- Conexión con la base: http://localhost:8000/api/v1/health
- Correos enviados (Mailpit): http://localhost:8025

### Correos

El backend envía cuatro correos, siempre en segundo plano (`BackgroundTasks`): la respuesta sale primero y, si el correo falla, la operación ya quedó guardada en la base.

| Evento | Correo | Dónde se programa |
|---|---|---|
| Registro desde el sitio público | Bienvenida | `api/v1/publico/publico_router.py` |
| Prueba activada (sitio o CRM) | Producto, inicio y fin de la prueba | `publico_router.py` y `pruebas/prueba_router.py` |
| ¿Olvidaste tu contraseña? | Enlace firmado que vence en 30 minutos | `auth/auth_router.py` |
| Contraseña cambiada o restablecida | Aviso de seguridad | `auth/auth_router.py` |

El enlace de recuperación es un JWT con `tipo = "restablecer"` y una *huella* del hash de la contraseña. Sirve una sola vez, porque al cambiar la contraseña la huella deja de coincidir, y no abre ninguna ruta protegida, porque `get_current_user` rechaza los tokens con `tipo`. Si el correo no existe, la API responde el mismo mensaje, para que nadie averigüe qué cuentas hay.

Modos de envío (`CORREO_MODO`): `consola` (solo log), `smtp` (Mailpit en local) y `brevo` (API HTTPS, para la nube).

### Moneda

Todos los valores están en pesos colombianos (COP): precios por licencia, presupuestos, propuestas y ventas. El frontend los muestra con `Intl.NumberFormat('es-CO', { currency: 'COP' })` en `lib/formato.ts`. Los datos semilla se convirtieron con una tasa fija de 4.000 COP por dólar, así se conserva la relación valor = licencias × precio.

### Usuarios de prueba (contraseña `Zimbra2026*`)

| Rol | Correo |
|---|---|
| Admin | camila.rojas1@zimbra-demo.com |
| Marketing | valentina.bermudez3@zimbra-demo.com |
| Vendedor | carlos.salazar6@zimbra-demo.com |

### Prueba automática de la API

```bash
docker compose exec backend python scripts/probar_api.py
```

Recorre el proceso completo (prospecto, T1, T2, T3, propuesta, T4, pago) y prueba los errores esperados. Cada línea dice OK o FALLA.

### Recorrido manual sugerido (para la sustentación)

1. Como **Marketing**: crea una campaña y registra un prospecto en ella.
2. En **Pruebas**, registra una prueba para ese prospecto: pasa a *En prueba* con 20 puntos.
3. En **Visitas**, simula dos visitas a `/precios`: llega a 50 y pasa a *Calificado*. La segunda visita alerta al vendedor.
4. Entra como el **Vendedor**: en *Alertas* aparece el aviso. Abre la ficha y registra una llamada positiva.
5. Crea una propuesta: el valor lo calcula el trigger. Acéptala y registra la venta.
6. Como **Admin**: marca la venta como pagada y revisa los **Reportes**.

---

## 6. Qué decir en la sustentación

- **Columnas generadas:** `fecha_fin` la calcula MySQL (`fecha_inicio + 60 días`); nadie la escribe. `activa_flag` vale 1 solo si la prueba está Activa, y con el `UNIQUE` impide dos pruebas activas del mismo producto.
- **Transacción con bloqueo:** `SELECT … FOR UPDATE` en T4 bloquea la propuesta. Si dos vendedores venden a la vez, el segundo espera; cuando sigue, la venta ya existe y falla. El `UNIQUE (propuesta_id)` es la última barrera.
- **Savepoint:** en T2, si falla la alerta se vuelve al punto `sp_antes_alerta` y la visita se confirma igual.
- **Por qué validar en el backend y en la base:** el frontend se puede manipular; el backend aplica permisos y reglas; la base garantiza la integridad aunque el backend falle.

## 7. Límites conocidos

- Las visitas web se simulan con un formulario; no hay rastreo real del sitio.
- En local los correos quedan en Mailpit; para correos reales hay que configurar Brevo (ver `docs/DESPLIEGUE_RAILWAY.md`). Las alertas a vendedores se ven en el CRM, no por correo.
- El formulario público de prueba gratis no tiene captcha.
- El token dura 30 minutos y no se renueva solo.
- Los datos de ejemplo se cargaron directamente, así que algunos puntajes guardados no coinciden con el calculado desde el historial (la ficha lo muestra).

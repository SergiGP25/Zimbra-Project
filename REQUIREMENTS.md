# Requerimientos · Sistema Transaccional Zimbra

> Este documento es la referencia viva de requerimientos del proyecto.
> Cada épica agrupa los requerimientos funcionales (RF) y sus historias de usuario (HU) correspondientes.
> Los requerimientos no funcionales (RNF) y reglas de negocio (RN) se listan al final.

---

## EP-00 · Base Técnica

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| — | Script SQL con las 10 tablas (PK, FK, UNIQUE, NOT NULL, CHECK) y datos de prueba (*seed*). | M |
| — | Repositorio Git con estructura por módulos, ramas por desarrollador y README de instalación. | M |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad |
|----|----------|-----|-----------|
| **HU-T1** | Como equipo, quiero un script SQL con las 10 tablas y datos de ejemplo para trabajar sobre el mismo modelo. | 5 | M |
| **HU-T2** | Como equipo, quiero un repositorio con estructura por módulos y README de instalación para trabajar en paralelo sin conflictos. | 3 | M |

---

## EP-01 · Autenticación y Usuarios

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-01** | Iniciar sesión con correo y contraseña. | M |
| **RF-02** | Cerrar sesión y expirar la sesión por inactividad (30 min). | M |
| **RF-03** | El administrador crea, edita, lista y desactiva empleados con su rol. | M |
| **RF-04** | Restringir las opciones y los datos visibles según el rol. | M |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-01** | Como empleado, quiero iniciar sesión con mi correo y contraseña para acceder al sistema según mi rol. | 3 | M | RF-01 |
| **HU-02** | Como empleado, quiero cerrar sesión y que esta expire por inactividad para proteger la información. | 2 | M | RF-02 |
| **HU-03** | Como administrador, quiero crear, editar, listar y desactivar empleados para controlar quién usa el sistema. | 5 | M | RF-03 |
| **HU-04** | Como administrador, quiero que cada rol vea solo lo que le corresponde para proteger los datos. | 5 | M | RF-04, RN-12 |

> 📄 Especificación completa: [EP-01_Autenticacion_y_Usuarios.md](EP-01_Autenticacion_y_Usuarios.md)

---

## EP-02 · Prospectos

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-05** | Registrar prospecto con nombre, empresa, correo (único), teléfono, campaña de origen y fecha de registro. | M |
| **RF-06** | Listar prospectos con búsqueda por nombre, empresa o correo y filtros por estado, campaña y vendedor. | M |
| **RF-07** | Editar los datos de un prospecto. | M |
| **RF-08** | Cambiar el estado del prospecto validando las transiciones permitidas. | M |
| **RF-09** | Asignar o reasignar un prospecto a un vendedor. | M |
| **RF-10** | Mostrar la ficha completa del prospecto (datos, descargas, visitas, alertas, interacciones, propuestas y venta). | S |
| **RF-11** | Calcular automáticamente el puntaje y pasar a Calificado al superar el umbral (≥ 50). | M |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-05** | Como marketing o vendedor, quiero registrar un prospecto con sus datos y campaña de origen para iniciar su seguimiento. | 3 | M | RF-05, RF-13 |
| **HU-06** | Como vendedor, quiero buscar y filtrar prospectos para encontrar rápido a quien debo contactar. | 5 | M | RF-06 |
| **HU-07** | Como vendedor, quiero editar los datos de un prospecto para mantener su información al día. | 2 | M | RF-07 |
| **HU-08** | Como vendedor, quiero cambiar el estado de un prospecto para reflejar en qué punto del proceso está. | 3 | M | RF-08, RN-10 |
| **HU-09** | Como administrador o marketing, quiero asignar un prospecto a un vendedor para repartir la carga de trabajo. | 3 | M | RF-09 |
| **HU-10** | Como vendedor, quiero ver en una sola pantalla todo el historial del prospecto para prepararme antes de llamarlo. | 5 | S | RF-10 |
| **HU-11** | Como vendedor, quiero que el sistema califique a los prospectos según su actividad para enfocarme en los que más probablemente compren. | 5 | M | RF-11, RN-04, RN-05 |

> 📄 Especificación completa: [EP-02_Prospectos.md](EP-02_Prospectos.md)

---

## EP-03 · Productos

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-15** | Crear, editar y listar productos con nombre, versión (Gratuita o Comercial) y precio unitario. | M |
| **RF-16** | Activar o desactivar productos sin eliminarlos. | S |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-11** | Como administrador, quiero crear, editar y listar productos para mantener el catálogo de versiones. | 3 | M | RF-15 |
| **HU-12** | Como administrador, quiero desactivar productos sin eliminarlos para conservar el historial. | 1 | S | RF-16 |

> 📄 Especificación completa: [EP-03_Productos.md](EP-03_Productos.md)

---

## EP-04 · Campañas

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-12** | Crear, editar, listar y consultar campañas con nombre, canal, fechas y presupuesto. | M |
| **RF-13** | Asociar cada prospecto a una campaña de origen. | M |
| **RF-14** | Mostrar por campaña el número de prospectos, descargas y ventas generadas. | S |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-13** | Como marketing, quiero crear, editar y listar campañas para organizar mis acciones de captación. | 5 | M | RF-12, RN-11 |
| **HU-14** | Como marketing, quiero ver los prospectos que originó una campaña para evaluar su alcance. | 2 | M | RF-13 |
| **HU-15** | Como marketing, quiero ver prospectos, descargas y ventas por campaña para saber cuáles funcionan mejor. | 3 | S | RF-14 |

> 📄 Especificación completa: [EP-04_Campanas.md](EP-04_Campanas.md)

---

## EP-05 · Descargas de Prueba

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-17** | Registrar la descarga de prueba de un prospecto sobre un producto de versión Gratuita. | M |
| **RF-18** | Calcular la fecha de fin como fecha de inicio más 60 días. | M |
| **RF-19** | Marcar como Vencida toda prueba cuya fecha de fin pasó y que no se convirtió. | M |
| **RF-20** | Marcar la prueba como Convertida cuando el prospecto compra. | M |
| **RF-21** | Cambiar el estado del prospecto a En prueba al registrar su primera descarga. | M |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-16** | Como marketing o vendedor, quiero registrar la descarga de prueba de un prospecto para iniciar sus 60 días de prueba. | 5 | M | RF-17, RF-21, T1 |
| **HU-17** | Como vendedor, quiero que el sistema calcule cuándo termina la prueba para saber cuánto tiempo queda. | 2 | M | RF-18, RN-02 |
| **HU-18** | Como vendedor, quiero que las pruebas vencidas se marquen solas para no contactar a prospectos con datos desactualizados. | 3 | M | RF-19 |
| **HU-19** | Como vendedor, quiero ver las pruebas con su estado y días restantes para decidir a quién contactar. | 2 | M | RF-20 |

> 📄 Especificación completa: [EP-05_Descargas_Prueba.md](EP-05_Descargas_Prueba.md)

---

## EP-06 · Visitas Web

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-22** | Registrar una visita con página, fecha y hora y duración (formulario simulador). | M |
| **RF-23** | Consultar el historial de visitas de un prospecto ordenado por fecha. | M |
| **RF-24** | Actualizar el puntaje cada vez que se registra una visita. | M |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-20** | Como marketing, quiero registrar visitas de un prospecto desde una pantalla simuladora para reproducir el rastreo web del caso. | 5 | M | RF-22, T2 |
| **HU-21** | Como vendedor, quiero ver las visitas de un prospecto para saber qué le interesa. | 2 | M | RF-23, RF-24 |

> 📄 Especificación completa: [EP-06_Visitas_Web.md](EP-06_Visitas_Web.md)

---

## EP-07 · Puntaje y Alertas

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-25** | Generar una alerta al vendedor asignado cuando un prospecto Calificado registra una visita. | M |
| **RF-26** | Generar una alerta cuando una prueba esté a 7 días o menos de vencer y el prospecto no haya comprado. | S |
| **RF-27** | Mostrar al vendedor su bandeja de alertas pendientes, de la más reciente a la más antigua. | M |
| **RF-28** | Marcar una alerta como atendida. | M |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-22** | Como vendedor, quiero que el sistema califique a los prospectos según su actividad para enfocarme en los que más probablemente compren. | 5 | M | RF-11, RF-24, RN-04, RN-05 |
| **HU-23** | Como vendedor, quiero recibir una alerta cuando un prospecto calificado visita el sitio para llamarlo en el mejor momento. | 5 | M | RF-25, RN-06 |
| **HU-24** | Como vendedor, quiero que me avisen cuando una prueba esté por vencer para intentar cerrar la venta a tiempo. | 3 | S | RF-26 |
| **HU-25** | Como vendedor, quiero ver mis alertas pendientes para saber a quién contactar primero. | 3 | M | RF-27 |
| **HU-26** | Como vendedor, quiero marcar una alerta como atendida para mantener mi bandeja limpia. | 1 | M | RF-28 |

> 📄 Especificación completa: [EP-07_Puntaje_Alertas.md](EP-07_Puntaje_Alertas.md)

---

## EP-08 · Interacciones

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-29** | Registrar una interacción (Llamada o Correo) con prospecto, vendedor, fecha, resultado, notas y campaña opcional. | M |
| **RF-30** | Consultar el historial de interacciones por prospecto. | M |
| **RF-31** | Actualizar el puntaje cuando la interacción tiene resultado positivo. | S |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-27** | Como vendedor, quiero registrar una llamada o correo con un prospecto para dejar constancia del seguimiento. | 3 | M | RF-29, T3 |
| **HU-28** | Como vendedor, quiero ver el historial de contactos de un prospecto para no repetir mensajes ni llamadas. | 2 | M | RF-30 |
| **HU-29** | Como vendedor, quiero que una interacción positiva suba el puntaje para reflejar el interés del prospecto. | 2 | S | RF-31 |

> 📄 Especificación completa: [EP-08_Interacciones.md](EP-08_Interacciones.md)

---

## EP-09 · Propuestas

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-32** | Crear una propuesta con un producto de versión Comercial y número de licencias. | M |
| **RF-33** | Calcular el valor total como licencias × precio unitario. | M |
| **RF-34** | Cambiar el estado de la propuesta (Enviada, Aceptada, Rechazada). | M |
| **RF-35** | Listar y filtrar propuestas por estado, vendedor y prospecto. | M |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-30** | Como vendedor, quiero crear una propuesta para un prospecto para ofrecerle una versión comercial. | 5 | M | RF-32, RF-33, RN-07, RN-08 |
| **HU-31** | Como vendedor, quiero marcar una propuesta como Aceptada o Rechazada para registrar la respuesta del cliente. | 3 | M | RF-34 |
| **HU-32** | Como vendedor, quiero ver mis propuestas por estado para hacer seguimiento a las pendientes. | 3 | M | RF-35 |

> 📄 Especificación completa: [EP-09_Propuestas.md](EP-09_Propuestas.md)

---

## EP-10 · Ventas

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-36** | Registrar una venta solo a partir de una propuesta Aceptada, y solo una por propuesta. | M |
| **RF-37** | Al registrar la venta, pasar el prospecto a Cliente y la prueba a Convertida en una sola transacción. | M |
| **RF-38** | Consultar ventas con filtros por fecha, vendedor y estado de pago. | M |
| **RF-39** | Actualizar el estado de pago de una venta (Pendiente o Pagada). | S |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-33** | Como vendedor, quiero registrar una venta a partir de una propuesta aceptada para cerrar el proceso comercial. | 8 | M | RF-36, RF-37, RN-09, T4 |
| **HU-34** | Como vendedor o administrador, quiero consultar las ventas para controlar los cierres. | 3 | M | RF-38 |
| **HU-35** | Como administrador, quiero marcar una venta como Pagada para llevar el control de cobros. | 2 | S | RF-39 |

> 📄 Especificación completa: [EP-10_Ventas.md](EP-10_Ventas.md)

---

## EP-11 · Reportes

| RF | Descripción | Prioridad |
|----|-------------|-----------|
| **RF-40** | Reporte de conversión: pruebas descargadas vs ventas cerradas, con porcentaje. | M |
| **RF-41** | Reporte de ventas por vendedor: número y monto en un rango de fechas. | M |
| **RF-42** | Reporte de rendimiento por campaña: prospectos, descargas, ventas y monto. | M |
| **RF-43** | Reporte de embudo: prospectos por estado. | S |
| **RF-44** | Reporte de tasa de cierre sobre prospectos calificados. | S |
| **RF-45** | Exportar reportes a CSV. | C |
| **RF-46** | Panel de inicio con indicadores clave según el rol. | C |

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | RFs |
|----|----------|-----|-----------|-----|
| **HU-36** | Como marketing, quiero ver cuántas pruebas terminan en venta para medir la efectividad del proceso. | 5 | M | RF-40 |
| **HU-37** | Como administrador, quiero ver ventas y montos por vendedor para evaluar el desempeño del equipo. | 3 | M | RF-41 |
| **HU-38** | Como marketing, quiero comparar campañas por prospectos, descargas y ventas para decidir dónde invertir. | 3 | M | RF-42 |
| **HU-39** | Como gerente comercial, quiero ver cuántos prospectos hay en cada estado para detectar cuellos de botella. | 2 | S | RF-43 |
| **HU-40** | Como administrador, quiero ver la tasa de cierre sobre prospectos calificados para compararla con la meta del caso. | 2 | S | RF-44 |
| **HU-41** | Como administrador, quiero exportar los reportes a CSV para analizarlos fuera del sistema. | 3 | C | RF-45 |
| **HU-42** | Como empleado, quiero ver indicadores clave al entrar para tener un resumen de mi día. | 3 | C | RF-46 |

> 📄 Especificación completa: [EP-11_Reportes.md](EP-11_Reportes.md)

---

## EP-12 · Entregables Compartidos (Semana 3)

**Historias de Usuario**

| HU | Historia | Pts | Prioridad | Responsable |
|----|----------|-----|-----------|-------------|
| **HU-43** | Como equipo, queremos probar las 5 transacciones críticas (T1–T5), para demostrar propiedades ACID. | 5 | M | D3 + D2 |
| **HU-44** | Como equipo, queremos probar el flujo completo prospecto→prueba→alerta→interacción→propuesta→venta. | 3 | M | D1 |
| **HU-45** | Como equipo, queremos procedimiento de respaldo y restauración de la base de datos. | 2 | S | D2 |
| **HU-46** | Como equipo, queremos documentación final y manual breve de uso. | 3 | M | D1 |
| **HU-47** | Como equipo, queremos preparar y ensayar la demostración. | 2 | M | Todos |

---

## EP-13 · Historias Técnicas de las Sesiones 2 y 3

Estas historias fueron incorporadas en la segunda entrega y no estaban como HUs independientes en la primera entrega.

| HT | Historia y RF asociado | Pts | Prioridad | Responsable | Estado |
|----|------------------------|-----|-----------|-------------|--------|
| **HT-01** | Como equipo, queremos conectar el back-end a la base de datos para que la API lea y escriba datos reales (RNF-07, RNF-18). | 5 | M | D1 | Implementada |
| **HT-02** | Como usuario, queremos que la interfaz muestre los datos reales de la base y permita iniciar sesión por rol (RF-01, RF-06). | 5 | M | D1 | Parcial |
| **HT-03** | Como auditor, queremos un historial de cambios de estado de prospectos, propuestas y ventas (RNF-17; TR-04, TR-05, TR-08). | 3 | M | D2/D3 | Pendiente de integrar |
| **HT-04** | Como equipo, queremos un prototipo navegable de Login, Panel, Empleados y Prospectos (RNF-01, RNF-02). | 5 | M | D1 | Parcial |

### Criterios de aceptación consolidados

- **HT-01:** `GET /api/v1/health` responde 200 con el estado de la base y carga 30 empleados; al apagar la base responde 503 sin exponer detalles técnicos; todas las consultas parametrizadas usan parámetros con nombre.
- **HT-02:** Camila Rojas inicia sesión con `Zimbra2026*`, recibe `access_token` y la vista de Prospectos carga 60 registros; una contraseña incorrecta muestra «Correo o contraseña incorrectos» y el vendedor solo ve su cartera.
- **HT-03:** Cada cambio de estado genera una fila en `historial_estado` con entidad, estado anterior, estado nuevo, fecha y usuario de la base.
- **HT-04:** Las pantallas de Login, Panel, Empleados y Prospectos están navegables, el menú cambia por rol y el flujo funciona en Chrome, Firefox y Edge.

## Requerimientos No Funcionales

| RNF | Descripción | Prioridad |
|-----|-------------|-----------|
| **RNF-01** | Interfaz simple que no exija programar reglas; tareas frecuentes en pocos clics. | M |
| **RNF-02** | Funcionar en Chrome, Firefox y Edge actualizados. | M |
| **RNF-03** | Consultas y listados en < 3 s con 10 000 prospectos. | M |
| **RNF-04** | Listados paginados (20 registros por página). | M |
| **RNF-05** | Contraseñas almacenadas con hash bcrypt. | M |
| **RNF-06** | Control de acceso por rol en el servidor, no solo en la interfaz. | M |
| **RNF-07** | Consultas parametrizadas contra inyección SQL y validación de entradas. | M |
| **RNF-08** | Datos personales visibles solo para usuarios autorizados. | M |
| **RNF-09** | Operaciones críticas transaccionales con propiedades ACID. | M |
| **RNF-10** | Uso de PK, FK, UNIQUE, NOT NULL y CHECK según el modelo. | M |
| **RNF-11** | No eliminar información con historial; se usa desactivación (soft delete). | M |
| **RNF-12** | Imposible crear dos ventas para la misma propuesta (concurrencia). | M |
| **RNF-13** | Procedimiento documentado de respaldo y restauración. | M |
| **RNF-14** | Código por capas o módulos, con control de versiones en Git. | M |
| **RNF-15** | Instalación y ejecución documentadas en un README. | M |
| **RNF-16** | Agregar usuarios, productos y campañas sin rediseñar el modelo. | M |
| **RNF-17** | Fecha de creación en tablas principales; fecha y responsable en alertas, interacciones y ventas. | M |
| **RNF-18** | Mensajes de error claros sin exponer detalles técnicos. | M |
| **RNF-19** | Ejecución local con MySQL 8.0.16 o superior. | M |
| **RNF-20** | DMR, script SQL, requerimientos, historias de usuario y manual de uso completos como entregables documentales. | M |

---

## Reglas de Negocio (RN)

| RN | Descripción | Implementación |
|----|-------------|----------------|
| **RN-01** | Correo del prospecto y del empleado deben ser únicos. | UNIQUE en DB |
| **RN-02** | La prueba dura 60 días: `fecha_fin = fecha_inicio + 60`. | Columna generada en DB |
| **RN-03** | Solo una prueba **Activa** por producto por prospecto. | UNIQUE con columna generada |
| **RN-04** | Puntaje: +20 descarga, +5 visita, +10 visita a precios, +10 interacción positiva. | Back-end (T1, T2, T3) |
| **RN-05** | Prospecto pasa a **Calificado** cuando puntaje ≥ 50. | Back-end (T2, T3) |
| **RN-06** | Alertas solo para prospectos **Calificados** con vendedor asignado. | Back-end (T2) |
| **RN-07** | Propuestas solo con productos de versión **Comercial**. | Back-end / CHECK |
| **RN-08** | Propuesta con al menos 1 licencia y valor total ≥ 0. | CHECK en DB |
| **RN-09** | Solo una propuesta **Aceptada** se convierte en venta; máximo una venta por propuesta. | UNIQUE + T4 |
| **RN-10** | Transiciones: `Nuevo → En prueba → Calificado → Cliente`; cualquier estado → `Descartado`; `Descartado → Nuevo`. | Back-end |
| **RN-11** | Fecha fin de campaña no puede ser anterior a fecha inicio. | CHECK en DB |
| **RN-12** | El vendedor solo ve sus prospectos; Marketing y Admin ven todos. | Back-end (filtro por rol) |
| **RN-13** | Los empleados con historial no se eliminan; se desactivan. | RESTRICT + campo `activo` |

---

## Transacciones Críticas

| ID | Transacción | Pasos que ocurren juntos |
|----|-------------|--------------------------|
| **T1** | Registrar descarga de prueba | Insertar `DESCARGA_PRUEBA`, sumar 20 pts al prospecto, cambiar su estado a *En prueba*. |
| **T2** | Registrar visita web | Insertar `VISITA_WEB`, actualizar puntaje, cambiar a *Calificado* si supera umbral, generar `ALERTA` cuando aplique. |
| **T3** | Registrar interacción | Insertar `INTERACCION`, sumar 10 pts si resultado es *Positivo*. |
| **T4** | Registrar venta | Bloquear y verificar propuesta *Aceptada*, insertar `VENTA`, cambiar prospecto a *Cliente*, marcar prueba como *Convertida*. |
| **T5** | Reasignar prospecto | Actualizar `id_vendedor` del prospecto y reasignar sus alertas pendientes al nuevo vendedor. |

---

> **Scripts SQL** (triggers, procedimientos almacenados y savepoints) → ver carpeta [`sql/`](sql/)

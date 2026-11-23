# Desplegar el CRM Zimbra en Railway

Railway ejecuta contenedores Docker a partir del repositorio de GitHub. El proyecto queda como **tres servicios** dentro de un mismo proyecto de Railway, igual que en `docker-compose.yml`:

| Servicio | Se construye con | Qué hace |
| --- | --- | --- |
| `mysql` | `despliegue/Dockerfile.mysql` | MySQL 8 con los scripts `DB/01` a `DB/13` (sin `04`, que crea un usuario admin/admin) |
| `backend` | `backend/Dockerfile` | API FastAPI |
| `frontend` | `despliegue/Dockerfile.frontend` | React compilado y servido con nginx |

Mailpit no se despliega: en la nube los correos salen por **Brevo**, porque Railway bloquea el puerto SMTP en los planes Free, Trial y Hobby.

## Costo

- **Trial:** cuenta nueva, 5 USD de crédito por única vez y 30 días, sin tarjeta. Alcanza para la entrega y la sustentación.
- **Después:** el plan Free deja 1 USD al mes y los servicios se duermen cuando no se usan. El plan Hobby cuesta 5 USD al mes e incluye 5 USD de consumo.
- **Brevo:** gratis hasta 300 correos al día.

Revisa los valores vigentes en https://railway.com/pricing antes de empezar.

---

## 1. Antes de empezar

1. Confirma que `main` en GitHub tiene la última versión del proyecto.
2. Crea la cuenta en https://railway.com entrando con tu cuenta de GitHub, y autoriza el acceso al repositorio `SergiGP25/Zimbra-Project`. Si el repositorio es de Sergio, él debe darte acceso o crear el proyecto desde su cuenta.
3. Genera dos claves largas y aleatorias, una para `SECRET_KEY` y otra para la contraseña de MySQL. En PowerShell:
   ```powershell
   -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | % {[char]$_})
   ```

## 2. Servicio `mysql`

1. En Railway: **New Project → Deploy from GitHub repo →** elige el repositorio. Se crea un servicio; renómbralo `mysql` (Settings → Service Name).
2. **Variables** del servicio:
   | Variable | Valor |
   | --- | --- |
   | `RAILWAY_DOCKERFILE_PATH` | `despliegue/Dockerfile.mysql` |
   | `MYSQL_ROOT_PASSWORD` | la clave larga que generaste |
   | `MYSQL_DATABASE` | `crm_zimbra` |
3. **Volumen** (para que los datos sobrevivan a cada reinicio): clic derecho sobre el servicio → **Attach Volume** → ruta de montaje `/var/lib/mysql`.
4. No generes dominio público: la base solo debe ser visible para el backend, por la red privada de Railway.
5. Espera el despliegue y revisa **Deploy Logs**: al final deben aparecer las líneas `running /docker-entrypoint-initdb.d/12_evento_vencimiento.sql` y `ready for connections`.

## 3. Servicio `frontend` (primero se crea, para conocer su dirección)

1. En el proyecto: **New → GitHub Repo →** el mismo repositorio. Renómbralo `frontend`.
2. **Settings → Networking → Generate Domain.** Anota la dirección, por ejemplo `https://zimbra-frontend.up.railway.app`.
3. Las variables se configuran en el paso 5, cuando exista la dirección del backend.

## 4. Servicio `backend`

1. **New → GitHub Repo →** el mismo repositorio. Renómbralo `backend`.
2. **Settings → Root Directory:** `backend`. Así Railway usa `backend/Dockerfile`.
3. **Variables.** Railway reemplaza `${{mysql.X}}` por el valor del servicio `mysql`:
   | Variable | Valor |
   | --- | --- |
   | `DB_HOST` | `${{mysql.RAILWAY_PRIVATE_DOMAIN}}` |
   | `DB_PORT` | `3306` |
   | `DB_USER` | `root` |
   | `DB_PASSWORD` | `${{mysql.MYSQL_ROOT_PASSWORD}}` |
   | `DB_NAME` | `crm_zimbra` |
   | `SECRET_KEY` | la otra clave larga |
   | `BACKEND_CORS_ORIGINS` | `["https://zimbra-frontend.up.railway.app"]` (la dirección del paso 3, entre corchetes y comillas) |
   | `FRONTEND_URL` | `https://zimbra-frontend.up.railway.app` |
   | `TZ` | `America/Bogota` |
   | `CORREO_MODO` | `brevo` |
   | `BREVO_API_KEY` | la clave del paso 6 |
   | `CORREO_REMITENTE` | el correo que verificaste en Brevo |
   | `CORREO_REMITENTE_NOMBRE` | `Zimbra CRM` |
4. **Settings → Networking → Generate Domain**, puerto `8000` si lo pregunta. Anota la dirección, por ejemplo `https://zimbra-backend.up.railway.app`.
5. Comprueba: `https://zimbra-backend.up.railway.app/api/v1/health` debe responder `"database_status": "conectada"`.

## 5. Variables del `frontend`

| Variable | Valor |
| --- | --- |
| `RAILWAY_DOCKERFILE_PATH` | `despliegue/Dockerfile.frontend` |
| `VITE_API_BASE_URL` | `https://zimbra-backend.up.railway.app/api/v1` |

Vite escribe esa dirección dentro del JavaScript al compilar. Si cambia, hay que volver a desplegar el frontend (**Deployments → Redeploy**).

## 6. Correos reales con Brevo

1. Crea una cuenta gratis en https://www.brevo.com.
2. **Senders, domains & dedicated IPs → Senders → Add a sender:** usa tu correo (por ejemplo, un Gmail). Brevo te envía un correo para confirmarlo.
3. **SMTP & API → API Keys → Generate a new API key.** Cópiala en `BREVO_API_KEY` del backend.
4. Pon ese mismo correo en `CORREO_REMITENTE`.

Si el remitente es un Gmail, los correos pueden llegar a *Spam*, porque Gmail no autoriza a Brevo a enviar en su nombre. Para una demostración basta con revisar esa carpeta. Con un dominio propio verificado en Brevo eso se corrige.

## 7. Verificación final

- Abre la dirección del frontend y activa una prueba gratis con tu correo real. Deben llegarte dos correos: bienvenida y prueba activada.
- En `/login`, pulsa **¿Olvidaste tu contraseña?** con un usuario de prueba. Los correos `@zimbra-demo.com` no existen, así que el enlace no llegará a ningún buzón. Para probarlo, cambia el correo de un empleado por el tuyo desde **Empleados** (como Admin).
- Inicia sesión como Admin, Marketing y Vendedor y recorre el flujo completo.
- **Antes de compartir el enlace, cambia las claves de los usuarios de `DB/13_usuarios_equipo.sql`** (Admin123, admin123…): en internet cualquiera podría probarlas. Se cambian desde "Cambiar contraseña" con cada usuario.

## Problemas frecuentes

| Síntoma | Causa probable |
| --- | --- |
| El frontend carga pero el login dice "Failed to fetch" | `VITE_API_BASE_URL` mal escrita, o falta la dirección del frontend en `BACKEND_CORS_ORIGINS` |
| `/health` responde 503 | El backend no llega a MySQL: revisa `DB_HOST` y `DB_PASSWORD`, y que `mysql` esté en verde |
| Las tildes salen mal | El servicio `mysql` no se construyó con `despliegue/Dockerfile.mysql`: revisa `RAILWAY_DOCKERFILE_PATH` |
| No llega ningún correo | `CORREO_MODO` no es `brevo`, la clave es incorrecta o el remitente no está verificado. El error aparece en los logs del backend (`No se pudo enviar el correo…`) |
| Quiero empezar con datos limpios | Borra el volumen del servicio `mysql` y vuelve a desplegarlo: los scripts se ejecutan de nuevo |

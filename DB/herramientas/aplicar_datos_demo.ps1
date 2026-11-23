# Aplica DB/11_datos_demo.sql sobre una base YA creada (volumen existente).
# Es idempotente: si los datos demo ya estan, no hace nada.
# Uso:  .\DB\herramientas\aplicar_datos_demo.ps1
# Esta en una subcarpeta a proposito: Docker ejecuta todo lo que haya en la
# raiz de DB/ al crear la base, y este script no debe correr dentro de MySQL.
# El archivo se lee DENTRO del contenedor (DB/ esta montada en
# /docker-entrypoint-initdb.d), asi PowerShell no toca las tildes.
$ErrorActionPreference = "Stop"
docker exec zimbra_mysql sh -c "mysql -uroot --default-character-set=utf8mb4 crm_zimbra < /docker-entrypoint-initdb.d/11_datos_demo.sql"
Write-Host "Listo. Verifica en http://localhost:8000/api/v1/health o entrando a la app."

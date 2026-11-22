# Aplica DB/11_datos_demo.sql sobre una base YA creada (volumen existente).
# Es idempotente: si los datos demo ya estan, no hace nada.
# Uso:  .\DB\aplicar_datos_demo.ps1
$ErrorActionPreference = "Stop"
$sql = Join-Path $PSScriptRoot "11_datos_demo.sql"
Get-Content $sql -Raw -Encoding UTF8 | docker exec -i zimbra_mysql mysql -uroot --default-character-set=utf8mb4 crm_zimbra
Write-Host "Listo. Verifica en http://localhost:8000/api/v1/health o entrando a la app."

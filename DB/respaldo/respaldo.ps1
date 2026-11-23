# Respaldo de la base crm_zimbra (RNF-13, HU-45). Requiere docker compose levantado.
# Uso:  .\DB\respaldo\respaldo.ps1
# El respaldo se genera DENTRO del contenedor y se copia con docker cp, para
# que PowerShell no cambie la codificacion (las tildes quedan intactas).
$ErrorActionPreference = "Stop"
$carpeta = Join-Path $PSScriptRoot "copias"
New-Item -ItemType Directory -Force $carpeta | Out-Null
$archivo = Join-Path $carpeta ("crm_zimbra_{0}.sql" -f (Get-Date -Format "yyyyMMdd_HHmmss"))
# --routines y --triggers incluyen procedimientos y triggers;
# --single-transaction da una copia consistente (InnoDB) sin bloquear.
docker exec zimbra_mysql sh -c "mysqldump -uroot --single-transaction --routines --triggers --events --default-character-set=utf8mb4 crm_zimbra > /tmp/respaldo.sql"
docker cp zimbra_mysql:/tmp/respaldo.sql $archivo
docker exec zimbra_mysql rm -f /tmp/respaldo.sql
Write-Host "Respaldo creado: $archivo"

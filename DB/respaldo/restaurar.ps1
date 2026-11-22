# Restauración de la base crm_zimbra desde un respaldo (RNF-13, HU-45).
# Uso:  .\DB\respaldo\restaurar.ps1 -Archivo .\DB\respaldo\copias\crm_zimbra_YYYYMMDD_HHMMSS.sql
param([Parameter(Mandatory = $true)][string]$Archivo)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $Archivo)) { throw "No existe el archivo $Archivo" }
docker exec zimbra_mysql mysql -uroot -e "DROP DATABASE IF EXISTS crm_zimbra; CREATE DATABASE crm_zimbra CHARACTER SET utf8mb4;"
Get-Content $Archivo -Raw -Encoding UTF8 | docker exec -i zimbra_mysql mysql -uroot --default-character-set=utf8mb4 crm_zimbra
Write-Host "Restauración completa. Verifica con GET /api/v1/health o DB/03_verificacion.sql"

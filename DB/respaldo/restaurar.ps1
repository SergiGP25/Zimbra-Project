# Restauración de la base crm_zimbra desde un respaldo (RNF-13, HU-45).
# Uso:  .\DB\respaldo\restaurar.ps1 -Archivo .\DB\respaldo\copias\crm_zimbra_YYYYMMDD_HHMMSS.sql
# El archivo se copia al contenedor con docker cp y se carga alli, para que
# PowerShell no cambie la codificacion (las tildes quedan intactas).
param([Parameter(Mandatory = $true)][string]$Archivo)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $Archivo)) { throw "No existe el archivo $Archivo" }
docker cp $Archivo zimbra_mysql:/tmp/restaurar.sql
docker exec zimbra_mysql mysql -uroot -e "DROP DATABASE IF EXISTS crm_zimbra; CREATE DATABASE crm_zimbra CHARACTER SET utf8mb4;"
docker exec zimbra_mysql sh -c "mysql -uroot --default-character-set=utf8mb4 crm_zimbra < /tmp/restaurar.sql"
docker exec zimbra_mysql rm -f /tmp/restaurar.sql
Write-Host "Restauración completa. Verifica con GET /api/v1/health o DB/03_verificacion.sql"

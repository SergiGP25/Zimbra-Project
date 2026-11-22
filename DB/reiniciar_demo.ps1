# Deja el sistema como recien montado: borra el volumen de MySQL y lo recrea
# ejecutando automaticamente los scripts 01 a 11 de DB/ (tablas, datos, triggers,
# procedimientos, reportes, vistas, indices, roles y datos demo).
# Usar antes de cada demostracion o despues de correr DB/pruebas (modifican datos).
# ATENCION: borra TODOS los datos actuales de la base.
# Uso:  .\DB\reiniciar_demo.ps1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
docker compose down -v
docker compose up -d --build
Write-Host "Esperando a MySQL (la primera carga tarda ~30 s)..."
for ($i = 0; $i -lt 40; $i++) {
    try { $r = Invoke-RestMethod http://localhost:8000/api/v1/health -TimeoutSec 3; if ($r.database_status -eq "conectada") { $r | Format-List; return } } catch {}
    Start-Sleep 3
}
Write-Warning "La API aun no responde: revisa 'docker compose logs db backend'."

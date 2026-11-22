#!/bin/sh
# Aplica DB/11_datos_demo.sql sobre una base ya creada (idempotente).
# Uso: sh DB/aplicar_datos_demo.sh
set -e
docker exec -i zimbra_mysql mysql -uroot --default-character-set=utf8mb4 crm_zimbra < "$(dirname "$0")/11_datos_demo.sql"
echo "Listo."

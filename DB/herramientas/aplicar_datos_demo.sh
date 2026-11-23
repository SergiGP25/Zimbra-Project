#!/bin/sh
# Aplica DB/11_datos_demo.sql sobre una base ya creada (idempotente).
# Uso: sh DB/herramientas/aplicar_datos_demo.sh
set -e
docker exec zimbra_mysql sh -c "mysql -uroot --default-character-set=utf8mb4 crm_zimbra < /docker-entrypoint-initdb.d/11_datos_demo.sql"
echo "Listo."

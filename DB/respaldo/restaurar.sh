#!/bin/sh
# Restaura crm_zimbra. Uso: sh DB/respaldo/restaurar.sh ruta/al/respaldo.sql
set -e
[ -f "$1" ] || { echo "Indica el archivo .sql"; exit 1; }
docker exec zimbra_mysql mysql -uroot -e "DROP DATABASE IF EXISTS crm_zimbra; CREATE DATABASE crm_zimbra CHARACTER SET utf8mb4;"
docker exec -i zimbra_mysql mysql -uroot --default-character-set=utf8mb4 crm_zimbra < "$1"
echo "Restauración completa."

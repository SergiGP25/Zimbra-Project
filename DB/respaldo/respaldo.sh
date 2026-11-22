#!/bin/sh
# Respaldo de crm_zimbra (RNF-13, HU-45). Uso: sh DB/respaldo/respaldo.sh
set -e
DIR="$(dirname "$0")/copias"
mkdir -p "$DIR"
OUT="$DIR/crm_zimbra_$(date +%Y%m%d_%H%M%S).sql"
docker exec zimbra_mysql mysqldump -uroot --single-transaction --routines --triggers --events --default-character-set=utf8mb4 crm_zimbra > "$OUT"
echo "Respaldo creado: $OUT"

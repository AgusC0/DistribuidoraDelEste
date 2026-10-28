#!/usr/bin/env bash
# Actualiza el sitio en el VPS con lo último de GitHub (rama main).
#
#   bash /var/www/distdelestevm/scripts/actualizar.sh
#
# Hace respaldo de la base, baja los cambios, instala, migra, compila y reinicia SOLO
# el proceso "distdelestevm" de PM2. Si la compilación falla, el sitio sigue funcionando
# con la versión anterior (no se reinicia nada). No toca Nginx ni otros proyectos.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/distdelestevm}"
PM2_NAME="${PM2_NAME:-distdelestevm}"
NODE_BIN="${NODE_BIN:-/root/.nvm/versions/node/v24.20.0/bin}"
PORT="${PORT:-3110}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/distdelestevm}"

export PATH="$NODE_BIN:$PATH"
cd "$APP_DIR"
paso() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

paso "Respaldo de la base de datos"
mkdir -p "$BACKUP_DIR"
DB_URL="$(grep -E '^DATABASE_URL=' .env.local | cut -d= -f2-)"
pg_dump -Fc "$DB_URL" -f "$BACKUP_DIR/antes-de-actualizar-$(date +%F-%H%M).dump"
# Conserva los últimos 10 respaldos de actualización.
ls -1t "$BACKUP_DIR"/antes-de-actualizar-*.dump 2>/dev/null | tail -n +11 | xargs -r rm --

paso "Bajando cambios de GitHub"
git fetch --quiet origin main
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] && [ "${FORZAR:-0}" != "1" ]; then
  echo "Ya está en la última versión. (Para recompilar igual: FORZAR=1 bash scripts/actualizar.sh)"
  exit 0
fi
git log --oneline HEAD..origin/main
git merge --ff-only origin/main

paso "Instalando dependencias"
PNPM="pnpm"
$PNPM install --frozen-lockfile

paso "Aplicando cambios en la base de datos"
$PNPM db:migrate

paso "Compilando"
$PNPM build

paso "Reiniciando el sitio"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start "$APP_DIR/node_modules/next/dist/bin/next" --name "$PM2_NAME" --cwd "$APP_DIR" \
    --interpreter "$NODE_BIN/node" -- start -H 127.0.0.1 -p "$PORT"
fi
pm2 save >/dev/null

paso "Comprobando"
for i in $(seq 1 20); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/" || true)"
  [ "$code" = "200" ] && break
  sleep 1
done
if [ "$code" = "200" ]; then
  echo "Listo: el sitio responde 200. Versión $(git log -1 --format='%h %s')"
else
  echo "Atención: el sitio respondió $code. Revisá: pm2 logs $PM2_NAME --lines 50" >&2
  exit 1
fi

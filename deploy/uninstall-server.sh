#!/bin/bash
# =============================================================================
# CRM — Полное удаление с сервера
# Удаляет проект, Nginx-конфиг, останавливает сервисы
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

INSTALL_DIR="/var/www/crm"
NGINX_CONF="/etc/nginx/sites-available/crm"
NGINX_ENABLED="/etc/nginx/sites-enabled/crm"

[[ $EUID -eq 0 ]] || err "Запустите с правами root: sudo $0"

echo ""
warn "Это удалит CRM с сервера:"
echo "  - $INSTALL_DIR"
echo "  - Nginx конфиг $NGINX_CONF"
echo "  - Cron задачу certbot (если была)"
echo ""
read -p "Продолжить? (y/N): " CONFIRM
[[ "$CONFIRM" == "y" || "$CONFIRM" == "Y" ]] || { echo "Отменено."; exit 0; }

# Удаление проекта
if [[ -d "$INSTALL_DIR" ]]; then
  log "Удаление $INSTALL_DIR..."
  rm -rf "$INSTALL_DIR"
  log "Проект удалён"
else
  warn "Директория $INSTALL_DIR не найдена"
fi

# Удаление Nginx конфига
if [[ -f "$NGINX_CONF" ]]; then
  log "Удаление Nginx конфига..."
  rm -f "$NGINX_ENABLED"
  rm -f "$NGINX_CONF"
  nginx -t 2>/dev/null && systemctl reload nginx || true
  log "Nginx конфиг удалён"
fi

# Восстановить default site если пусто
if [[ ! -L /etc/nginx/sites-enabled/default ]] && [[ ! -f /etc/nginx/sites-enabled/default ]]; then
  if [[ -f /etc/nginx/sites-available/default ]]; then
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
  fi
fi

# Удалить certbot cron для этого домена (полностью убрать нельзя — может быть другие сайты)
# Оставляем certbot renew как есть

log "Удаление завершено."
echo ""

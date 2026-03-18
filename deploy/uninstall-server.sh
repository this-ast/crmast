#!/bin/bash
# Удаление CRM с сервера

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

[[ $EUID -eq 0 ]] || err "Запустите с правами root: sudo $0"

INSTALL_DIR="/var/www/crm"
NGINX_CONF="/etc/nginx/sites-available/crm"
NGINX_ENABLED="/etc/nginx/sites-enabled/crm"

read -p "Вы уверены? Это удалит $INSTALL_DIR и конфиг Nginx (y/N): " -r
[[ $REPLY =~ ^[Yy]$ ]] || { echo "Отменено"; exit 0; }

log "Остановка Nginx..."
systemctl stop nginx || true

log "Удаление файлов..."
rm -rf "$INSTALL_DIR"
rm -f "$NGINX_CONF" "$NGINX_ENABLED"

log "Удаление SSL сертификата..."
DOMAIN=$(grep -m1 "server_name" /etc/nginx/sites-available/* 2>/dev/null | head -1 | awk '{print $2}' | tr -d ';' || echo "")
if [[ -n "$DOMAIN" ]]; then
  certbot delete --cert-name "$DOMAIN" --non-interactive 2>/dev/null || true
fi

log "Перезагрузка Nginx..."
systemctl start nginx

log "Удаление завершено"

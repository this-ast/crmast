#!/bin/bash
# =============================================================================
# CRM — Автоматическая установка и настройка на Ubuntu 18
# Домен, SSL, Nginx, Node.js, сборка проекта, обновление из GitHub
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

# --- Режим только обновления ---
UPDATE_ONLY=false
[[ "$1" == "--update-only" ]] && UPDATE_ONLY=true

# --- Путь установки ---
INSTALL_DIR="/var/www/crm"
NGINX_CONF="/etc/nginx/sites-available/crm"
NGINX_ENABLED="/etc/nginx/sites-enabled/crm"

# --- Проверка root ---
[[ $EUID -eq 0 ]] || err "Запустите скрипт с правами root: sudo $0"

if [[ "$UPDATE_ONLY" == true ]]; then
  log "Режим: только обновление проекта"
  cd "$INSTALL_DIR" || err "Директория $INSTALL_DIR не найдена"
  [[ -d .git ]] || err "Не найден git-репозиторий в $INSTALL_DIR"
  read -p "Ветка для обновления (пусто = текущая): " GITHUB_BRANCH
  [[ -n "$GITHUB_BRANCH" ]] && git checkout "$GITHUB_BRANCH" && git pull origin "$GITHUB_BRANCH" || git pull
  log "Сборка проекта..."
  npm install && npm run build
  systemctl reload nginx
  log "Обновление завершено. Сайт: $(grep -m1 server_name $NGINX_CONF 2>/dev/null | awk '{print $2}' | tr -d ';')"
  exit 0
fi

# --- Ввод домена ---
echo ""
read -p "Введите домен (например: crm.example.com): " DOMAIN
[[ -z "$DOMAIN" ]] && err "Домен не указан"

# --- Репозиторий GitHub (опционально) ---
read -p "URL репозитория GitHub (пусто = текущая папка): " GITHUB_REPO
read -p "Ветка (пусто = main): " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}

log "Домен: $DOMAIN"
log "Путь: $INSTALL_DIR"
[[ -n "$GITHUB_REPO" ]] && log "GitHub: $GITHUB_REPO ($GITHUB_BRANCH)"

# --- Обновление системы ---
log "Обновление пакетов..."
apt-get update -qq
apt-get upgrade -y -qq

# --- Установка зависимостей ---
log "Установка зависимостей..."
apt-get install -y -qq \
  curl wget git unzip \
  nginx \
  certbot python3-certbot-nginx \
  build-essential

# --- Node.js 20 (NodeSource) ---
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  log "Установка Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
log "Node.js: $(node -v) | npm: $(npm -v)"

# --- Создание директории ---
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# --- Клонирование / обновление из GitHub ---
if [[ -n "$GITHUB_REPO" ]]; then
  if [[ -d .git ]]; then
    log "Обновление из GitHub..."
    git fetch origin
    git checkout "$GITHUB_BRANCH"
    git pull origin "$GITHUB_BRANCH"
  else
    log "Клонирование из GitHub..."
    git clone -b "$GITHUB_BRANCH" "$GITHUB_REPO" .
  fi
else
  warn "GitHub не указан. Скопируйте проект в $INSTALL_DIR вручную и запустите скрипт снова с --update-only"
  if [[ ! -f package.json ]]; then
    err "package.json не найден в $INSTALL_DIR. Укажите GitHub или скопируйте проект."
  fi
fi

# --- Переменные окружения (Supabase) ---
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
  warn "Файл .env не найден. Нужны ключи Supabase для сборки."
  read -p "VITE_SUPABASE_URL (https://xxx.supabase.co): " SUPABASE_URL
  read -p "VITE_SUPABASE_ANON_KEY: " SUPABASE_ANON
  cat > "$INSTALL_DIR/.env" << ENV
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON
ENV
  log "Создан .env"
fi

# --- Сборка проекта ---
log "Установка зависимостей npm..."
cd "$INSTALL_DIR"
npm ci 2>/dev/null || npm install

log "Сборка проекта..."
npm run build

# --- Nginx: временная конфигурация (HTTP) для certbot ---
log "Настройка Nginx..."
cat > "$NGINX_CONF" << NGX
server {
    listen 80;
    server_name $DOMAIN;
    root $INSTALL_DIR/dist;
    index index.html;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGX

# Удаляем default site, включаем наш
rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

nginx -t && systemctl reload nginx

# --- SSL сертификат (Let's Encrypt) ---
log "Получение SSL сертификата..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null || {
  warn "Certbot не смог получить сертификат. Проверьте:"
  echo "  - DNS: домен $DOMAIN указывает на IP этого сервера"
  echo "  - Порт 80 открыт в firewall"
  echo "  - Запустите вручную: certbot --nginx -d $DOMAIN"
}

# --- Финальная конфигурация Nginx (с SSL) ---
cat > "$NGINX_CONF" << NGX
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    root $INSTALL_DIR/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGX

# Применяем только если certbot успешно создал сертификаты
[[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]] && nginx -t && systemctl reload nginx

# --- Автообновление SSL ---
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# --- Firewall (если ufw установлен) ---
if command -v ufw &>/dev/null; then
  ufw allow 80/tcp 2>/dev/null
  ufw allow 443/tcp 2>/dev/null
  ufw --force enable 2>/dev/null || true
fi

# --- Итог ---
echo ""
log "Установка завершена."
echo ""
echo "  Сайт: https://$DOMAIN"
echo "  Путь: $INSTALL_DIR"
echo ""
echo "  Обновить проект из GitHub:"
echo "    cd $INSTALL_DIR && git pull && npm run build && systemctl reload nginx"
echo ""
echo "  Или запустить скрипт с --update-only для автоматического обновления."
echo ""

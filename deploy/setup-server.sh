#!/bin/bash
# =============================================================================
# CRM — Установка и обновление на Ubuntu 18+
# Один скрипт: при первом запуске — полная установка, при повторном — обновление с GitHub
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

# --- Пути ---
INSTALL_DIR="/var/www/crm"
NGINX_CONF="/etc/nginx/sites-available/crm"
NGINX_ENABLED="/etc/nginx/sites-enabled/crm"

# --- Проверка root ---
[[ $EUID -eq 0 ]] || err "Запустите с правами root: sudo $0"

# --- Определение режима: установка или обновление ---
IS_UPDATE=false
if [[ -d "$INSTALL_DIR" && -d "$INSTALL_DIR/.git" && -f "$INSTALL_DIR/package.json" ]]; then
  IS_UPDATE=true
  log "Обнаружена существующая установка → режим ОБНОВЛЕНИЯ"
else
  log "Первичная установка"
fi

# =============================================================================
# РЕЖИМ ОБНОВЛЕНИЯ
# =============================================================================
if [[ "$IS_UPDATE" == true ]]; then
  cd "$INSTALL_DIR" || err "Не удалось перейти в $INSTALL_DIR"

  # Проверка .env
  if [[ ! -f .env ]]; then
    warn "Файл .env отсутствует. Нужны ключи Supabase для сборки."
    read -p "VITE_SUPABASE_URL (https://xxx.supabase.co): " SUPABASE_URL
    read -p "VITE_SUPABASE_ANON_KEY: " SUPABASE_ANON
    cat > .env << ENV
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON
ENV
    log "Создан .env"
  fi

  log "Обновление из GitHub..."
  git fetch origin
  git pull origin "$(git branch --show-current)"

  log "Установка npm-зависимостей..."
  npm install

  log "Сборка проекта..."
  npm run build

  log "Перезагрузка Nginx..."
  systemctl reload nginx

  DOMAIN=$(grep -m1 "server_name" "$NGINX_CONF" 2>/dev/null | awk '{print $2}' | tr -d ';' || echo "—")
  log "Обновление завершено. Сайт: https://$DOMAIN"
  exit 0
fi

# =============================================================================
# РЕЖИМ ПЕРВИЧНОЙ УСТАНОВКИ
# =============================================================================
echo ""
echo "=== Первичная установка CRM ==="
echo ""

# --- 1. Домен ---
read -p "Домен (например: crm.example.com): " DOMAIN
[[ -z "$DOMAIN" ]] && err "Домен не указан"

# --- 2. GitHub ---
read -p "URL репозитория GitHub (например: https://github.com/this-ast/crmast.git): " GITHUB_REPO
[[ -z "$GITHUB_REPO" ]] && err "URL репозитория обязателен"

read -p "Ветка (пусто = main): " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}

# --- 3. Supabase ---
echo ""
echo "Ключи Supabase (Supabase Dashboard → Settings → API):"
read -p "VITE_SUPABASE_URL (https://xxx.supabase.co): " SUPABASE_URL
[[ -z "$SUPABASE_URL" ]] && err "Supabase URL обязателен"

read -p "VITE_SUPABASE_ANON_KEY: " SUPABASE_ANON
[[ -z "$SUPABASE_ANON" ]] && err "Supabase Anon Key обязателен"

# --- Обновление системы ---
mkdir -p "$INSTALL_DIR"
log "Обновление пакетов..."
apt-get update -qq
apt-get upgrade -y -qq

# --- Системные зависимости ---
log "Установка зависимостей..."
apt-get install -y -qq \
  curl wget git unzip \
  nginx \
  certbot python3-certbot-nginx \
  build-essential

# --- Node.js 20 ---
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  log "Установка Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
log "Node.js: $(node -v) | npm: $(npm -v)"

# --- Клонирование ---
log "Клонирование из GitHub..."
cd "$INSTALL_DIR"
git clone -b "$GITHUB_BRANCH" "$GITHUB_REPO" .

# --- .env ---
log "Создание .env..."
cat > .env << ENV
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON
ENV
chmod 600 .env

# --- Сборка ---
log "Установка npm-зависимостей..."
npm install

log "Сборка проекта..."
npm run build

# --- Nginx (HTTP для certbot) ---
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

rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
nginx -t && systemctl reload nginx

# --- SSL ---
log "Получение SSL сертификата..."
if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null; then
  log "SSL сертификат получен"
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
  nginx -t && systemctl reload nginx
  (crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
else
  warn "Certbot не смог получить сертификат. Проверьте DNS и порт 80."
  echo "  Запустите вручную: certbot --nginx -d $DOMAIN"
fi

# --- Firewall ---
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
echo "  Обновление (запустите этот же скрипт снова):"
echo "    sudo $0"
echo ""

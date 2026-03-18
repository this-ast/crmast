#!/bin/bash
# =============================================================================
# CRM — Установка и обновление на Ubuntu 18+
# Один скрипт: при первом запуске — полная установка, при повторном — обновление с GitHub
# =============================================================================

set -e

# При запуске через curl|bash stdin занят — скачиваем в файл и перезапускаем с терминалом
if [[ ! -t 0 ]]; then
  echo "Скачивание скрипта..."
  curl -sL "https://raw.githubusercontent.com/this-ast/crmast/main/deploy/setup-server.sh" -o /tmp/setup-server.sh
  exec bash /tmp/setup-server.sh < /dev/tty
fi

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
    read -p "VITE_SUPABASE_URL (https://xxx.supabase.co): " SUPABASE_URL < /dev/tty
    read -p "VITE_SUPABASE_ANON_KEY: " SUPABASE_ANON < /dev/tty
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

# --- Чтение с терминала (при curl|bash stdin занят) ---
read_tty() { read -p "$1" "$2" < /dev/tty; }

# --- 1. Домен ---
read_tty "Домен (например: crm.example.com): " DOMAIN
[[ -z "$DOMAIN" ]] && err "Домен не указан"

# --- 2. GitHub ---
read_tty "URL репозитория GitHub (Enter = https://github.com/this-ast/crmast.git): " GITHUB_REPO
GITHUB_REPO=${GITHUB_REPO:-https://github.com/this-ast/crmast.git}

read_tty "Ветка (пусто = main): " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}

# --- 3. Supabase ---
echo ""
echo "Ключи Supabase (Supabase Dashboard → Settings → API):"
read_tty "VITE_SUPABASE_URL (https://xxx.supabase.co): " SUPABASE_URL
[[ -z "$SUPABASE_URL" ]] && err "Supabase URL обязателен"

read_tty "VITE_SUPABASE_ANON_KEY: " SUPABASE_ANON
[[ -z "$SUPABASE_ANON" ]] && err "Supabase Anon Key обязателен"

# --- Обновление системы ---
mkdir -p "$INSTALL_DIR"
export DEBIAN_FRONTEND=noninteractive
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

# --- Node.js 18 LTS (совместим с Ubuntu 18.04) ---
install_node() {
  if command -v node &>/dev/null && [[ $(node -v 2>/dev/null | cut -d. -f1 | tr -d 'v') -ge 18 ]]; then
    log "Node.js уже установлен: $(node -v)"
    return
  fi
  log "Установка Node.js 18 LTS..."

  # Используем NodeSource для Ubuntu 18.04
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash - || {
    err "Не удалось добавить репозиторий NodeSource. Проверьте интернет-соединение."
  }

  apt-get install -y -qq nodejs || {
    err "Не удалось установить Node.js. Попробуйте обновить систему: sudo apt update && sudo apt upgrade"
  }

  log "Node.js установлен: $(node -v) | npm: $(npm -v)"
}

install_node

# --- Клонирование ---
log "Клонирование из GitHub..."
cd "$INSTALL_DIR"
git clone -b "$GITHUB_BRANCH" "$GITHUB_REPO" . 2>/dev/null || {
  err "Не удалось клонировать репозиторий. Проверьте URL и доступ в интернет."
}

# --- .env ---
log "Создание .env..."
cat > .env << ENV
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON
ENV
chmod 600 .env

# --- Сборка ---
log "Установка npm-зависимостей..."
npm install --legacy-peer-deps 2>&1 | grep -v "npm warn" || true

log "Сборка проекта..."
npm run build || {
  err "Ошибка при сборке. Проверьте логи выше."
}

# --- Nginx (HTTP для certbot) ---
log "Настройка Nginx..."
cat > "$NGINX_CONF" << 'NGX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    root INSTALL_DIR_PLACEHOLDER/dist;
    index index.html;

    # Прокси для Supabase (обход блокировок в РФ)
    location /supabase-proxy/ {
        proxy_pass https://mtigcxqcymxvqjjqfyts.supabase.co/;
        proxy_ssl_server_name on;
        proxy_ssl_name mtigcxqcymxvqjjqfyts.supabase.co;

        proxy_set_header Host mtigcxqcymxvqjjqfyts.supabase.co;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_pass_request_headers on;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 10s;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
NGX

# Замена плейсхолдеров
sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" "$NGINX_CONF"
sed -i "s|INSTALL_DIR_PLACEHOLDER|$INSTALL_DIR|g" "$NGINX_CONF"

rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
nginx -t && systemctl reload nginx

# --- SSL ---
log "Получение SSL сертификата..."
if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null; then
  log "SSL сертификат получен"

  # Обновляем конфиг с HTTPS
  cat > "$NGINX_CONF" << 'NGX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;
    root INSTALL_DIR_PLACEHOLDER/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Прокси для Supabase (обход блокировок в РФ)
    location /supabase-proxy/ {
        proxy_pass https://mtigcxqcymxvqjjqfyts.supabase.co/;
        proxy_ssl_server_name on;
        proxy_ssl_name mtigcxqcymxvqjjqfyts.supabase.co;

        proxy_set_header Host mtigcxqcymxvqjjqfyts.supabase.co;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_pass_request_headers on;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 10s;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
NGX

  sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" "$NGINX_CONF"
  sed -i "s|INSTALL_DIR_PLACEHOLDER|$INSTALL_DIR|g" "$NGINX_CONF"

  nginx -t && systemctl reload nginx
  (crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
else
  warn "Certbot не смог получить сертификат. Проверьте DNS и порт 80."
  echo "  Запустите вручную: certbot --nginx -d $DOMAIN"
fi

# --- Firewall ---
if command -v ufw &>/dev/null; then
  log "Настройка firewall (UFW)..."
  # КРИТИЧНО: SSH должен быть разрешен ДО включения firewall
  ufw allow 22/tcp 2>/dev/null || true
  ufw allow OpenSSH 2>/dev/null || true
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
  ufw --force enable 2>/dev/null || true
  log "Firewall настроен: SSH (22), HTTP (80), HTTPS (443)"
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

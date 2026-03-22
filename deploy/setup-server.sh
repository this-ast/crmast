#!/bin/bash
# =============================================================================
# CRM — Установка и обновление на Ubuntu 18+
# Один скрипт: при первом запуске — полная установка, при повторном — обновление с GitHub
# =============================================================================

set -e

# При запуске через curl|bash stdin занят.
# Режим обновления не требует TTY — запускаем напрямую.
# Первичная установка требует TTY для ввода домена и ключей — скачиваем и перезапускаем.
if [[ ! -t 0 ]]; then
  INSTALL_DIR_CHECK="/var/www/crm"
  if [[ -d "$INSTALL_DIR_CHECK/.git" && -f "$INSTALL_DIR_CHECK/package.json" ]]; then
    : # режим обновления — TTY не нужен, продолжаем
  else
    echo "Скачивание скрипта..."
    curl -sL "https://raw.githubusercontent.com/this-ast/crmast/main/deploy/setup-server.sh" -o /tmp/setup-server.sh
    exec bash /tmp/setup-server.sh < /dev/tty
  fi
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
BOT_DIR="$INSTALL_DIR/telegram-bot"
BOT_ENV="$BOT_DIR/.env"
BOT_SERVICE="crm-tgbot"

# ---------------------------------------------------------------------------
# Функции для Telegram-бота
# ---------------------------------------------------------------------------

install_python() {
  # Определяем версию Python (например: 3.12)
  local pyver=""
  if command -v python3 &>/dev/null && python3 -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" 2>/dev/null; then
    pyver=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    log "Python $pyver уже установлен"
  else
    log "Установка Python 3.11..."
    add-apt-repository -y ppa:deadsnakes/ppa 2>/dev/null || true
    apt-get update -qq
    apt-get install -y -qq python3.11 python3.11-distutils curl
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
    pyver="3.11"
  fi

  # Устанавливаем venv для конкретной версии Python
  log "Установка python${pyver}-venv..."
  apt-get install -y "python${pyver}-venv"
  log "Python готов: $(python3 --version)"
}

setup_bot_env() {
  if [[ -f "$BOT_ENV" ]]; then
    log "Файл $BOT_ENV уже существует, пропускаем."
    return
  fi

  # Пробуем взять значение из .env.example (уже содержит все ключи)
  local example="$BOT_DIR/.env.example"
  if [[ -f "$example" ]]; then
    cp "$example" "$BOT_ENV"
    chmod 600 "$BOT_ENV"
    log "Файл $BOT_ENV создан из .env.example"
    return
  fi

  # Fallback: ручной ввод
  echo ""
  echo "=== Настройка Telegram-бота ==="
  read -p "TELEGRAM_BOT_TOKEN: " TG_TOKEN < /dev/tty
  [[ -z "$TG_TOKEN" ]] && err "Токен бота обязателен"
  read -p "Ваш Telegram User ID (числовой): " TG_USER_ID < /dev/tty
  [[ -z "$TG_USER_ID" ]] && err "User ID обязателен"

  cat > "$BOT_ENV" << BOTENV
TELEGRAM_BOT_TOKEN=$TG_TOKEN
ALLOWED_USER_IDS=$TG_USER_ID
POLZA_API_KEY=pza_yj1niHvxJC-A9Kh6-cRzaYBJ3PZF28Jm
POLZA_BASE_URL=https://polza.ai/api/v1
AI_MODEL=google/gemini-2.5-flash-lite-preview-09-2025
SUPABASE_URL=https://mtigcxqcymxvqjjqfyts.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aWdjeHFjeW14dnFqanFmeXRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcyMDA5NiwiZXhwIjoyMDg4Mjk2MDk2fQ.xVzANZk08H59sUJsTzcDd6s3sfDs8zMZ-DKHnZCH_nM
BOTENV
  chmod 600 "$BOT_ENV"
  log "Файл $BOT_ENV создан"
}

install_tor() {
  if systemctl is-active --quiet tor 2>/dev/null; then
    log "Tor уже запущен"
    return
  fi
  log "Установка Tor (SOCKS5-прокси для обхода блокировки Telegram)..."
  apt-get install -y -qq tor
  systemctl enable tor
  systemctl start tor
  # Ждём пока Tor поднимется
  local i=0
  while ! ss -tlnp | grep -q ':9050' && (( i < 15 )); do
    sleep 1; (( i++ ))
  done
  if ss -tlnp | grep -q ':9050'; then
    log "Tor запущен на localhost:9050"
  else
    warn "Tor не запустился вовремя, но продолжаем"
  fi
}

install_bot_deps() {
  # Удаляем сломанное venv если есть
  if [[ -d "$BOT_DIR/.venv" && ! -x "$BOT_DIR/.venv/bin/pip" ]]; then
    log "Удаление сломанного .venv..."
    rm -rf "$BOT_DIR/.venv"
  fi
  log "Создание виртуального окружения Python..."
  python3 -m venv "$BOT_DIR/.venv"
  log "Установка зависимостей бота..."
  "$BOT_DIR/.venv/bin/pip" install --quiet --upgrade pip
  "$BOT_DIR/.venv/bin/pip" install --quiet -r "$BOT_DIR/requirements.txt"
  log "Зависимости установлены"
}

create_bot_service() {
  log "Создание systemd-службы $BOT_SERVICE..."
  cat > "/etc/systemd/system/$BOT_SERVICE.service" << SERVICE
[Unit]
Description=CRM Telegram Bot
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$BOT_DIR
EnvironmentFile=$BOT_ENV
ExecStart=$BOT_DIR/.venv/bin/python3 $BOT_DIR/bot.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$BOT_SERVICE

[Install]
WantedBy=multi-user.target
SERVICE

  systemctl daemon-reload
  systemctl enable "$BOT_SERVICE"
  systemctl restart "$BOT_SERVICE"
  sleep 2
  if systemctl is-active --quiet "$BOT_SERVICE"; then
    log "Бот запущен (служба $BOT_SERVICE)"
  else
    warn "Бот не запустился. Проверьте: journalctl -u $BOT_SERVICE -n 50"
  fi
}

update_telegram_bot() {
  if [[ ! -d "$BOT_DIR" ]]; then
    warn "Директория бота не найдена ($BOT_DIR), пропускаем."
    return
  fi
  # Если бот ещё ни разу не устанавливался — запускаем полную установку
  if [[ ! -f "$BOT_ENV" || ! -x "$BOT_DIR/.venv/bin/pip" ]]; then
    log "Бот не настроен — запускаем первоначальную установку..."
    install_python
    install_tor
    setup_bot_env
    if [[ -f "$BOT_ENV" ]]; then
      install_bot_deps
      create_bot_service
    fi
    return
  fi
  log "Обновление зависимостей бота..."
  "$BOT_DIR/.venv/bin/pip" install --quiet --upgrade -r "$BOT_DIR/requirements.txt"
  log "Перезапуск службы бота..."
  systemctl restart "$BOT_SERVICE" || warn "Не удалось перезапустить $BOT_SERVICE"
  log "Бот обновлён."
}

setup_telegram_bot() {
  if [[ ! -d "$BOT_DIR" ]]; then
    warn "Папка telegram-bot не найдена в репозитории ($BOT_DIR)"
    return
  fi
  install_python
  install_tor
  setup_bot_env
  if [[ -f "$BOT_ENV" ]]; then
    install_bot_deps
    create_bot_service
  fi
}

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
  git fetch origin main
  git reset --hard FETCH_HEAD

  log "Установка npm-зависимостей..."
  npm install

  log "Сборка проекта..."
  npm run build

  log "Перезагрузка Nginx..."
  systemctl reload nginx

  # --- Обновление Telegram-бота ---
  update_telegram_bot

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

# --- Telegram-бот ---
setup_telegram_bot

# --- Итог ---
echo ""
log "Установка завершена."
echo ""
echo "  Сайт: https://$DOMAIN"
echo "  Путь: $INSTALL_DIR"
echo ""
if systemctl is-active --quiet "$BOT_SERVICE" 2>/dev/null; then
  echo "  Telegram-бот: запущен (служба $BOT_SERVICE)"
  echo "    Логи: journalctl -u $BOT_SERVICE -f"
else
  echo "  Telegram-бот: не настроен (запустите setup_telegram_bot вручную)"
fi
echo ""
echo "  Обновление (запустите этот же скрипт снова):"
echo "    sudo $0"
echo ""

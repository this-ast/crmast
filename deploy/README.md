# Развёртывание CRM на Ubuntu 18

## Быстрый старт

1. Скопируйте скрипт на сервер:
   ```bash
   scp deploy/setup-server.sh user@your-server:/tmp/
   ```

2. Подключитесь и запустите:
   ```bash
   ssh user@your-server
   sudo bash /tmp/setup-server.sh
   ```

3. Ответьте на вопросы:
   - **Домен** — например `crm.example.com` (DNS должен указывать на IP сервера)
   - **GitHub** — URL репозитория, например `https://github.com/username/crm.git`
   - **Ветка** — `main` или другая

4. При первом запуске введите ключи Supabase (если `.env` ещё не создан):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Обновление проекта

```bash
sudo bash /tmp/setup-server.sh --update-only
```

Или вручную:
```bash
cd /var/www/crm
git pull
npm install && npm run build
sudo systemctl reload nginx
```

## Требования

- Ubuntu 18.04+
- Root или sudo
- Домен с DNS, указывающим на IP сервера
- Открытые порты 80 и 443

## Что устанавливает скрипт

- Node.js 20 (NodeSource)
- Nginx
- Certbot (Let's Encrypt SSL)
- Клонирует проект из GitHub
- Собирает production-сборку
- Настраивает автообновление SSL (cron)

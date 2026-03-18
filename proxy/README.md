# Supabase proxy для РФ

Простой Node.js прокси-сервер для обхода блокировок Supabase в России.

## Локальный запуск

```bash
npm install
SUPABASE_TARGET_URL=https://xxx.supabase.co npm start
```

Прокси будет доступен на `http://localhost:3001`

## Развёртывание на Railway

1. Форкните репозиторий или создайте новый проект на Railway
2. Подключите этот репозиторий
3. Добавьте переменную окружения:
   - `SUPABASE_TARGET_URL` = ваш Supabase URL (https://xxx.supabase.co)
4. Railway автоматически запустит `npm start`

## Использование в CRM

В `.env` на сервере:
```
VITE_SUPABASE_PROXY_URL=https://your-railway-app.railway.app
```

Или используйте встроенный Nginx прокси (рекомендуется для РФ).

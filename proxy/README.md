# Прокси для Supabase (обход блокировок в РФ)

Прокси-сервер перенаправляет запросы к Supabase через сервер за пределами РФ.

## Быстрый деплой на Railway (бесплатно)

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub** (или **Empty Project**)
3. Если Empty Project: нажмите **Add Service** → **GitHub Repo** → выберите репозиторий CRM
4. В настройках сервиса:
   - **Root Directory**: `proxy`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Variables** → добавьте:
   ```
   SUPABASE_TARGET_URL=https://mtigcxqcymxvqjjqfyts.supabase.co
   ```
6. **Deploy** → после деплоя скопируйте URL (например `https://xxx.railway.app`)

## Деплой на Render

1. [render.com](https://render.com) → **New** → **Web Service**
2. Подключите репозиторий
3. **Root Directory**: `proxy`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Environment Variables**:
   - `SUPABASE_TARGET_URL` = `https://mtigcxqcymxvqjjqfyts.supabase.co`
7. **Create Web Service**

## Настройка CRM

В `.env` проекта CRM добавьте (или замените `VITE_SUPABASE_URL`):

```
VITE_SUPABASE_PROXY_URL=https://ваш-прокси.railway.app
VITE_SUPABASE_ANON_KEY=ваш-anon-key
```

Приоритет: если задан `VITE_SUPABASE_PROXY_URL`, он используется вместо `VITE_SUPABASE_URL`.

## Локальный запуск (для тестов)

Если у вас есть VPN:

```bash
cd proxy
npm install
SUPABASE_TARGET_URL=https://mtigcxqcymxvqjjqfyts.supabase.co npm start
```

В `.env` CRM:
```
VITE_SUPABASE_PROXY_URL=http://localhost:3001
```

# Деплой на Vercel (с прокси для РФ)

Приложение настроено на автоматическое использование прокси при деплое на Vercel — запросы к Supabase идут через тот же домен, обходя блокировки.

## Одним кликом

**[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fthis-ast%2Fcrmast)** — импортируйте репозиторий и добавьте `VITE_SUPABASE_ANON_KEY` в Environment Variables.

## Быстрый деплой

1. Зайдите на [vercel.com](https://vercel.com) и войдите через GitHub
2. **Add New** → **Project** → выберите репозиторий `crmast`
3. **Environment Variables** — добавьте:
   - `VITE_SUPABASE_ANON_KEY` = ваш anon key из Supabase
4. **Deploy**

После деплоя приложение будет доступно по адресу `https://ваш-проект.vercel.app` и будет работать в РФ без VPN.

## Локальная разработка в РФ

Для `npm run dev` на localhost Supabase по-прежнему может быть недоступен. Варианты:

1. **Использовать деплой** — разрабатывать на `https://ваш-проект.vercel.app`
2. **Развернуть proxy отдельно** на Railway (см. `proxy/README.md`) и добавить в `.env`:
   ```
   VITE_SUPABASE_PROXY_URL=https://ваш-прокси.railway.app
   ```

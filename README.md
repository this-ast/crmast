# CRM для риэлторов

Веб-приложение для управления недвижимостью, клиентами и сделками.

## Быстрый старт

### Локально

```bash
cp .env.example .env
# Заполнить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm install --legacy-peer-deps
npm run dev
```

### На сервере (Ubuntu 18+)

```bash
curl -sL https://raw.githubusercontent.com/this-ast/crmast/main/deploy/setup-server.sh | sudo bash
```

## Технологический стек

- **Frontend**: React 18 + TypeScript + Vite
- **Стили**: Tailwind CSS
- **БД**: Supabase (PostgreSQL)
- **Сервер**: Nginx + Node.js 18 LTS
- **ОС**: Ubuntu 18.04+

## Особенности

- ✅ Полная поддержка РФ (прокси для Supabase)
- ✅ Совместимость с Ubuntu 18.04
- ✅ Автоматическое развёртывание
- ✅ SSL сертификаты (Let's Encrypt)
- ✅ SPA с маршрутизацией

## Документация

- [DEPLOY.md](./DEPLOY.md) — развёртывание на сервере

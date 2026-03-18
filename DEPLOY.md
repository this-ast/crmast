# Инструкция по развёртыванию CRM на Ubuntu 18+

## Требования

- Ubuntu 18.04 или новее
- Root или sudo доступ
- Домен с DNS, указывающим на IP сервера
- Открытые порты 80 и 443

## Быстрая установка (одна команда)

```bash
ssh user@IP_СЕРВЕРА
curl -sL https://raw.githubusercontent.com/this-ast/crmast/main/deploy/setup-server.sh | sudo bash
```

Скрипт автоматически:
1. Установит Node.js 18 LTS (совместим с Ubuntu 18.04)
2. Установит Nginx и Certbot
3. Клонирует проект с GitHub
4. Соберёт приложение
5. Настроит Nginx с прокси для Supabase (для РФ)
6. Получит SSL сертификат

## Что вводить при установке

| Вопрос | Пример |
|--------|--------|
| Домен | crm.example.com |
| URL репозитория GitHub | https://github.com/this-ast/crmast.git |
| Ветка | main |
| VITE_SUPABASE_URL | https://xxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | eyJhbGc... (из Supabase → Settings → API) |

## Обновление на сервере

Запустите тот же скрипт снова — он определит, что проект уже установлен, и обновит его:

```bash
sudo bash /tmp/setup-server.sh
```

Или вручную:
```bash
cd /var/www/crm
git pull
npm install --legacy-peer-deps
npm run build
sudo systemctl reload nginx
```

## Локальная разработка

```bash
# Копировать .env.example в .env
cp .env.example .env

# Заполнить ключи Supabase в .env
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=your-key

# Установка и запуск
npm install --legacy-peer-deps
npm run dev
```

Приложение будет доступно на http://localhost:5173

## Особенности для РФ

Проект автоматически использует прокси для Supabase при доступе с сервера:
- На локальной машине: прямое подключение к Supabase
- На сервере: подключение через `/supabase-proxy` (Nginx прокси)

Это позволяет обойти возможные блокировки Supabase в РФ.

## Совместимость

- **Node.js**: 18+ (LTS, совместим с Ubuntu 18.04)
- **React**: 18.2.0 (стабильная версия)
- **Vite**: 5.0.0 (быстрая сборка)
- **Supabase**: 2.38.0 (стабильная версия)

## Решение проблем

### Ошибка при установке Node.js на Ubuntu 18.04

Если NodeSource не работает, обновите систему:
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y build-essential
```

Затем повторите установку.

### Nginx не перезагружается

```bash
sudo nginx -t  # Проверить конфиг
sudo systemctl restart nginx
```

### Сертификат не получен

Проверьте, что:
1. Домен правильно указан в DNS
2. Порт 80 открыт
3. Firewall не блокирует

Получить сертификат вручную:
```bash
sudo certbot --nginx -d your-domain.com
```

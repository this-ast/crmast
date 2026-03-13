# Инструкция по развёртыванию CRM

## 1. Создание репозитория на GitHub

1. Откройте [github.com/new](https://github.com/new)
2. **Repository name:** `crm`
3. **Description:** CRM для риэлторов и агентств недвижимости
4. Выберите **Public**
5. **НЕ** добавляйте README, .gitignore, license — проект уже содержит их
6. Нажмите **Create repository**

## 2. Первый push в репозиторий

Проект уже инициализирован и закоммичен. Осталось:

```bash
cd "/Users/bigboy/Documents/CRM "

# Push (при запросе пароля используйте Personal Access Token)
git push -u origin main
```

При запросе пароля используйте **Personal Access Token** вместо пароля от GitHub.

## 3. Развёртывание на Ubuntu-сервере

### Шаг 1: Скопируйте скрипт на сервер

```bash
scp deploy/setup-server.sh user@IP_СЕРВЕРА:/tmp/
```

### Шаг 2: Запустите установку

```bash
ssh user@IP_СЕРВЕРА
sudo bash /tmp/setup-server.sh
```

### Шаг 3: Ответьте на вопросы

| Вопрос | Пример |
|--------|--------|
| Домен | crm.example.com |
| URL репозитория GitHub | https://github.com/this-ast/crm.git |
| Ветка | main |

### Шаг 4: Ключи Supabase

При первом запуске скрипт запросит:
- `VITE_SUPABASE_URL` — из панели Supabase → Settings → API
- `VITE_SUPABASE_ANON_KEY` — тот же раздел

## 4. Обновление на сервере

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

## 5. Требования к серверу

- Ubuntu 18.04 или новее
- Root или sudo
- Домен с DNS, указывающим на IP сервера
- Открытые порты 80 и 443

## 6. Локальная разработка

```bash
# Копировать .env.example в .env и заполнить ключи Supabase
cp .env.example .env

# Установка и запуск
npm install
npm run dev
```

Приложение будет доступно на http://localhost:5173

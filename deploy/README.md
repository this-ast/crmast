# Развёртывание CRM на Ubuntu

## Один скрипт для всего

Скрипт сам определяет режим:
- **Первая установка** — спрашивает домен, GitHub, Supabase, ставит всё
- **Обновление** — подтягивает код с GitHub, пересобирает, перезагружает Nginx

## Первая установка

На сервере (скрипт скачивается с GitHub):

```bash
curl -sL https://raw.githubusercontent.com/this-ast/crmast/main/deploy/setup-server.sh | sudo bash
```

Или по шагам:
```bash
wget https://raw.githubusercontent.com/this-ast/crmast/main/deploy/setup-server.sh -O /tmp/setup-server.sh
sudo bash /tmp/setup-server.sh
```

Скрипт запросит:
| Параметр | Пример |
|----------|--------|
| Домен | crm.example.com |
| URL репозитория | https://github.com/this-ast/crmast.git |
| Ветка | main |
| VITE_SUPABASE_URL | https://xxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | eyJhbG... |

## Обновление

Скачайте и запустите скрипт снова:

```bash
curl -sL https://raw.githubusercontent.com/this-ast/crmast/main/deploy/setup-server.sh | sudo bash
```

Скрипт:
- подтянет изменения с GitHub
- пересоберёт проект
- перезагрузит Nginx

Ключи Supabase берутся из существующего `.env`. Если `.env` удалён — скрипт запросит ключи заново.

## Требования

- Ubuntu 18.04+
- Root или sudo
- Домен с DNS на IP сервера
- Порты 80 и 443 открыты

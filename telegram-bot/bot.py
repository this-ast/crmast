#!/usr/bin/env python3
"""
CRM Риэлтора — Telegram-бот с AI-агентом (Gemini 2.5 Flash + Supabase)
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime

from aiogram import Bot, Dispatcher, F
from aiogram.client.session.aiohttp import AiohttpSession
from aiohttp import ClientTimeout
from aiogram.enums import ParseMode, ChatAction
from aiogram.filters import CommandStart, Command
from aiogram.types import Message
from openai import AsyncOpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Конфигурация
# ---------------------------------------------------------------------------
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
POLZA_API_KEY      = os.environ["POLZA_API_KEY"]
POLZA_BASE_URL     = os.environ.get("POLZA_BASE_URL", "https://polza.ai/api/v1")
AI_MODEL           = os.environ.get("AI_MODEL", "google/gemini-2.5-flash-lite-preview-09-2025")
SUPABASE_URL       = os.environ["SUPABASE_URL"]
SUPABASE_KEY       = os.environ["SUPABASE_KEY"]
# Telegram User ID владельца (через запятую для нескольких)
ALLOWED_USER_IDS   = set(
    int(x.strip())
    for x in os.environ.get("ALLOWED_USER_IDS", "0").split(",")
    if x.strip().isdigit()
)
BOT_PROXY          = os.environ.get("BOT_PROXY")  # e.g. socks5://127.0.0.1:9050

# ---------------------------------------------------------------------------
# Клиенты
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

ai_client = AsyncOpenAI(api_key=POLZA_API_KEY, base_url=POLZA_BASE_URL)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

_timeout = ClientTimeout(total=120, connect=120, sock_connect=120, sock_read=60)
_session = AiohttpSession(proxy=BOT_PROXY, timeout=_timeout) if BOT_PROXY else AiohttpSession()
bot = Bot(token=TELEGRAM_BOT_TOKEN, session=_session)
dp  = Dispatcher()

# История сообщений (in-memory, только для одного пользователя — владельца)
conversation_history: list[dict] = []

# ---------------------------------------------------------------------------
# Схема базы данных (для системного промпта)
# ---------------------------------------------------------------------------
DB_SCHEMA = """
База данных PostgreSQL через Supabase. Доступные таблицы:

**clients** — клиенты риэлтора
  Колонки: id (uuid), client_number (int), name (text), phone (text), email (text),
           notes (text), request (text, запрос клиента), budget (text),
           contact_date (date), status (text), priority (text),
           last_contact (date), next_contact (date), next_step (text),
           client_type (text: buyer|seller|both), created_at, updated_at

**properties** — объекты недвижимости
  Колонки: id (uuid), article (text, артикул), type (text: apartment|house|land|commercial),
           status (text: active|sold|reserved|withdrawn), price (numeric),
           area (numeric, м²), rooms (int), floor (int), total_floors (int),
           address (text), complex_name (text), description (text),
           deal_type (text: sale|rent), market_type (text: secondary|new_build),
           has_mortgage (bool), has_installment (bool), has_trade_in (bool),
           has_maternal_cap (bool), has_military_mort (bool),
           owner_id (uuid → clients), area_sotki (numeric),
           created_at, updated_at

**deals** — сделки
  Колонки: id (uuid), deal_number (serial), title (text), deal_date (date),
           buyer_id (uuid → clients), seller_id (uuid → clients),
           property_id (uuid → properties), payment_method (text),
           deal_price (bigint), commission (bigint), commission_split (text),
           status (text: active|completed|cancelled), notes (text),
           created_at, updated_at

**tasks** — задачи
  Колонки: id (uuid), title (text), description (text),
           priority (text: high|medium|low), deadline (date),
           status (text: pending|done|cancelled),
           linked_type (text: client|property|deal), linked_id (uuid),
           profit_potential (numeric), created_at, updated_at

**complexes** — жилые комплексы
  Колонки: id (uuid), name (text), description (text), developer (text),
           completion_date (text), purchase_conditions (text),
           developer_phones (text[]), manager_names (text[]), manager_phones (text[]),
           created_at, updated_at
"""

# ---------------------------------------------------------------------------
# Системный промпт
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = f"""Ты — персональный AI-ассистент риэлтора. Работаешь с CRM-системой через базу данных Supabase.

Текущая дата: {{date}}

{DB_SCHEMA}

Твои возможности:
- Искать и просматривать клиентов, объекты, сделки, задачи, ЖК
- Добавлять новые записи (клиентов, задачи, объекты)
- Обновлять данные (статус, контакты, заметки и т.д.)
- Проводить аналитику (считать, суммировать, фильтровать)
- Удалять записи (только по явному подтверждению)

Правила:
1. Всегда используй инструменты (tools) для работы с базой — не выдумывай данные.
2. При поиске клиента по имени — ищи через ilike (частичное совпадение).
3. Перед удалением — переспроси подтверждение, если не было явной команды "удали".
4. Отвечай кратко и по существу. Используй эмодзи для читаемости.
5. Числа форматируй: цены в ₽ с разделителями (1 500 000 ₽), площади в м².
6. Если запрос неоднозначен — уточни.
7. При изменениях — подтверди что именно изменил.

Язык ответов: русский.
"""


def get_system_prompt() -> str:
    return SYSTEM_PROMPT.format(date=datetime.now().strftime("%d.%m.%Y"))


# ---------------------------------------------------------------------------
# Инструменты (Tools) для AI
# ---------------------------------------------------------------------------
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "db_select",
            "description": (
                "Читать данные из таблицы. "
                "Поддерживаются фильтры: обычные (точное совпадение), __ilike (частичное), "
                "__gte/__lte/__gt/__lt (сравнение), __neq (не равно), __in (список значений через запятую)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "table": {
                        "type": "string",
                        "description": "Имя таблицы: clients, properties, deals, tasks, complexes",
                    },
                    "select": {
                        "type": "string",
                        "description": "Колонки через запятую или '*'. Пример: 'id,name,phone,status'",
                        "default": "*",
                    },
                    "filters": {
                        "type": "object",
                        "description": (
                            "Фильтры. Примеры: "
                            '{"status": "active"}, '
                            '{"name__ilike": "%Ахмед%"}, '
                            '{"price__gte": 1000000}, '
                            '{"priority__in": "high,medium"}'
                        ),
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Максимальное количество строк (по умолчанию 50)",
                        "default": 50,
                    },
                    "order_by": {
                        "type": "string",
                        "description": "Сортировка. Пример: 'created_at.desc' или 'price.asc'",
                    },
                },
                "required": ["table"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "db_count",
            "description": "Подсчитать количество записей в таблице с опциональными фильтрами.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table": {"type": "string"},
                    "filters": {
                        "type": "object",
                        "description": "Те же фильтры что и в db_select",
                    },
                },
                "required": ["table"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "db_insert",
            "description": "Создать новую запись в таблице.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table": {"type": "string"},
                    "data": {
                        "type": "object",
                        "description": "Данные новой записи. Пример: {\"name\": \"Иван\", \"phone\": \"+79001234567\"}",
                    },
                },
                "required": ["table", "data"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "db_update",
            "description": "Обновить записи в таблице по фильтрам.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table": {"type": "string"},
                    "filters": {
                        "type": "object",
                        "description": "Условия для выбора записей. Обязательно! Пример: {\"id\": \"uuid...\"}",
                    },
                    "data": {
                        "type": "object",
                        "description": "Поля для обновления. Пример: {\"status\": \"sold\", \"notes\": \"Сделка закрыта\"}",
                    },
                },
                "required": ["table", "filters", "data"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "db_delete",
            "description": "Удалить записи из таблицы по фильтрам.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table": {"type": "string"},
                    "filters": {
                        "type": "object",
                        "description": "Условия для удаления. Пример: {\"id\": \"uuid...\"}",
                    },
                },
                "required": ["table", "filters"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "db_rpc",
            "description": "Выполнить произвольный SQL-запрос через Supabase RPC (только SELECT). Использовать когда стандартные инструменты не подходят.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "SQL SELECT запрос. Пример: 'SELECT COUNT(*) FROM clients WHERE created_at > NOW() - INTERVAL '7 days''",
                    },
                },
                "required": ["sql"],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Supabase-обёртка
# ---------------------------------------------------------------------------
def _apply_filters(query, filters: dict):
    """Применяет фильтры к запросу Supabase PostgREST."""
    if not filters:
        return query

    for key, value in filters.items():
        if "__ilike" in key:
            col = key.replace("__ilike", "")
            query = query.ilike(col, str(value))
        elif "__gte" in key:
            col = key.replace("__gte", "")
            query = query.gte(col, value)
        elif "__lte" in key:
            col = key.replace("__lte", "")
            query = query.lte(col, value)
        elif "__gt" in key:
            col = key.replace("__gt", "")
            query = query.gt(col, value)
        elif "__lt" in key:
            col = key.replace("__lt", "")
            query = query.lt(col, value)
        elif "__neq" in key:
            col = key.replace("__neq", "")
            query = query.neq(col, value)
        elif "__in" in key:
            col = key.replace("__in", "")
            values = [v.strip() for v in str(value).split(",")]
            query = query.in_(col, values)
        elif "__is" in key:
            col = key.replace("__is", "")
            query = query.is_(col, value)
        else:
            query = query.eq(key, value)

    return query


def execute_db_select(table: str, select: str = "*", filters: dict = None,
                      limit: int = 50, order_by: str = None) -> dict:
    try:
        query = supabase.table(table).select(select)
        query = _apply_filters(query, filters or {})
        if order_by:
            col, *direction = order_by.split(".")
            desc = direction and direction[0] == "desc"
            query = query.order(col, desc=desc)
        query = query.limit(limit)
        result = query.execute()
        return {"success": True, "data": result.data, "count": len(result.data)}
    except Exception as e:
        logger.error(f"db_select error: {e}")
        return {"success": False, "error": str(e)}


def execute_db_count(table: str, filters: dict = None) -> dict:
    try:
        query = supabase.table(table).select("*", count="exact", head=True)
        query = _apply_filters(query, filters or {})
        result = query.execute()
        return {"success": True, "count": result.count}
    except Exception as e:
        logger.error(f"db_count error: {e}")
        return {"success": False, "error": str(e)}


def execute_db_insert(table: str, data: dict) -> dict:
    try:
        result = supabase.table(table).insert(data).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        logger.error(f"db_insert error: {e}")
        return {"success": False, "error": str(e)}


def execute_db_update(table: str, filters: dict, data: dict) -> dict:
    try:
        if not filters:
            return {"success": False, "error": "Фильтры обязательны для обновления"}
        query = supabase.table(table).update(data)
        query = _apply_filters(query, filters)
        result = query.execute()
        return {"success": True, "data": result.data, "updated": len(result.data)}
    except Exception as e:
        logger.error(f"db_update error: {e}")
        return {"success": False, "error": str(e)}


def execute_db_delete(table: str, filters: dict) -> dict:
    try:
        if not filters:
            return {"success": False, "error": "Фильтры обязательны для удаления"}
        query = supabase.table(table).delete()
        query = _apply_filters(query, filters)
        result = query.execute()
        return {"success": True, "data": result.data, "deleted": len(result.data)}
    except Exception as e:
        logger.error(f"db_delete error: {e}")
        return {"success": False, "error": str(e)}


def execute_db_rpc(sql: str) -> dict:
    """Выполняет SQL через Supabase RPC (только SELECT-запросы для безопасности)."""
    sql_upper = sql.strip().upper()
    if not sql_upper.startswith("SELECT"):
        return {"success": False, "error": "RPC разрешён только для SELECT-запросов"}
    try:
        result = supabase.rpc("execute_sql", {"query": sql}).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        # Fallback: пробуем через прямой запрос
        logger.error(f"db_rpc error: {e}")
        return {"success": False, "error": str(e)}


def call_tool(name: str, args: dict) -> str:
    """Диспетчер вызовов инструментов."""
    logger.info(f"Tool call: {name}({json.dumps(args, ensure_ascii=False)[:200]})")

    if name == "db_select":
        result = execute_db_select(
            table=args["table"],
            select=args.get("select", "*"),
            filters=args.get("filters"),
            limit=args.get("limit", 50),
            order_by=args.get("order_by"),
        )
    elif name == "db_count":
        result = execute_db_count(
            table=args["table"],
            filters=args.get("filters"),
        )
    elif name == "db_insert":
        result = execute_db_insert(
            table=args["table"],
            data=args["data"],
        )
    elif name == "db_update":
        result = execute_db_update(
            table=args["table"],
            filters=args["filters"],
            data=args["data"],
        )
    elif name == "db_delete":
        result = execute_db_delete(
            table=args["table"],
            filters=args["filters"],
        )
    elif name == "db_rpc":
        result = execute_db_rpc(sql=args["sql"])
    else:
        result = {"success": False, "error": f"Неизвестный инструмент: {name}"}

    return json.dumps(result, ensure_ascii=False, default=str)


# ---------------------------------------------------------------------------
# AI-агент: цикл с function calling
# ---------------------------------------------------------------------------
async def run_agent(user_message: str) -> str:
    """Запускает агента, выполняет цепочку function calls, возвращает финальный ответ."""
    global conversation_history

    conversation_history.append({"role": "user", "content": user_message})

    messages = [{"role": "system", "content": get_system_prompt()}] + conversation_history

    max_iterations = 8  # защита от бесконечного цикла

    for iteration in range(max_iterations):
        response = await ai_client.chat.completions.create(
            model=AI_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.2,
            max_tokens=4096,
        )

        choice = response.choices[0]
        msg = choice.message

        # Добавляем ответ модели в контекст
        messages.append(msg.model_dump(exclude_none=True))

        # Если модель закончила — возвращаем текст
        if choice.finish_reason == "stop" or not msg.tool_calls:
            final_text = msg.content or "Готово."
            # Сохраняем ответ в историю
            conversation_history.append({"role": "assistant", "content": final_text})
            # Ограничиваем историю последними 20 сообщениями
            if len(conversation_history) > 40:
                conversation_history = conversation_history[-40:]
            return final_text

        # Обрабатываем вызовы инструментов
        if msg.tool_calls:
            for tool_call in msg.tool_calls:
                tool_name = tool_call.function.name
                try:
                    tool_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    tool_args = {}

                tool_result = call_tool(tool_name, tool_args)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result,
                })

    return "Достигнут лимит итераций. Попробуйте переформулировать запрос."


# ---------------------------------------------------------------------------
# Telegram-хэндлеры
# ---------------------------------------------------------------------------
def is_allowed(user_id: int) -> bool:
    if ALLOWED_USER_IDS == {0}:
        logger.warning("ALLOWED_USER_IDS не настроены! Установите переменную окружения.")
        return False
    return user_id in ALLOWED_USER_IDS


@dp.message(CommandStart())
async def cmd_start(message: Message):
    if not is_allowed(message.from_user.id):
        await message.answer("⛔ Доступ запрещён.")
        return
    await message.answer(
        "👋 Привет! Я твой AI-ассистент для CRM.\n\n"
        "Могу:\n"
        "• Искать клиентов и объекты\n"
        "• Обновлять данные\n"
        "• Считать статистику\n"
        "• Добавлять записи\n\n"
        "Просто напиши что нужно. Например:\n"
        "_«Найди клиентов с бюджетом до 2 млн»_\n"
        "_«Сколько активных объектов?»_\n"
        "_«Обнови статус клиента №15 на активный»_",
        parse_mode=ParseMode.MARKDOWN,
    )


@dp.message(Command("clear"))
async def cmd_clear(message: Message):
    if not is_allowed(message.from_user.id):
        return
    global conversation_history
    conversation_history = []
    await message.answer("🗑 История диалога очищена.")


@dp.message(Command("id"))
async def cmd_id(message: Message):
    """Показывает Telegram User ID (для первоначальной настройки)."""
    await message.answer(f"Твой Telegram User ID: `{message.from_user.id}`", parse_mode=ParseMode.MARKDOWN)


@dp.message(F.text)
async def handle_message(message: Message):
    if not is_allowed(message.from_user.id):
        await message.answer("⛔ Доступ запрещён.")
        return

    # Показываем индикатор "печатает"
    await bot.send_chat_action(message.chat.id, ChatAction.TYPING)

    # Запускаем агента
    try:
        # Для длинных запросов периодически обновляем typing
        typing_task = asyncio.create_task(_keep_typing(message.chat.id))
        try:
            answer = await run_agent(message.text)
        finally:
            typing_task.cancel()

        # Разбиваем длинные ответы (лимит Telegram — 4096 символов)
        for chunk in _split_message(answer):
            await message.answer(chunk, parse_mode=ParseMode.MARKDOWN)

    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        await message.answer(f"❌ Ошибка: {e}")


async def _keep_typing(chat_id: int):
    """Периодически отправляет ChatAction.TYPING, пока не будет отменена."""
    try:
        while True:
            await bot.send_chat_action(chat_id, ChatAction.TYPING)
            await asyncio.sleep(4)
    except asyncio.CancelledError:
        pass


def _split_message(text: str, max_len: int = 4000) -> list[str]:
    """Разбивает длинный текст на части для Telegram."""
    if len(text) <= max_len:
        return [text]
    chunks = []
    while text:
        if len(text) <= max_len:
            chunks.append(text)
            break
        # Ищем ближайший перенос строки
        split_at = text.rfind("\n", 0, max_len)
        if split_at == -1:
            split_at = max_len
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")
    return chunks


# ---------------------------------------------------------------------------
# Точка входа
# ---------------------------------------------------------------------------
async def main():
    logger.info("Запуск бота...")
    if ALLOWED_USER_IDS == {0}:
        logger.warning(
            "⚠️  ALLOWED_USER_IDS не задан! Отправьте /id боту чтобы узнать свой ID, "
            "затем установите переменную окружения."
        )
    await dp.start_polling(bot, skip_updates=True)


if __name__ == "__main__":
    asyncio.run(main())

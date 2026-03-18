-- ==============================================
-- Извлечение объектов из записей клиентов-продавцов
-- Клиенты у которых request начинается с "Продает" / "Продаёт"
-- являются продавцами — их записи становятся объектами в CRM
-- ==============================================

INSERT INTO properties (
  article,
  type,
  status,
  price,
  area,
  address,
  complex_name,
  description,
  rooms,
  floor,
  total_floors,
  area_sotki,
  cadastral_number,
  owner_id
)
SELECT
  -- Артикул: префикс по типу + номер клиента
  CASE
    WHEN request ~* 'уч\.|уч\s|участ|сот\.' THEN 'UCH'
    WHEN request ~* '\bдом\b|коттедж|таунхаус' THEN 'DOM'
    WHEN request ~* 'коммерц|помещ|магаз|офис|кафе|пекарн' THEN 'KOM'
    ELSE 'APT'
  END || '-' || LPAD(client_number::text, 3, '0') AS article,

  -- Тип объекта
  CASE
    WHEN request ~* 'уч\.|уч\s|участ|сот\.' THEN 'land'
    WHEN request ~* '\bдом\b|коттедж|таунхаус' THEN 'house'
    WHEN request ~* 'коммерц|помещ|магаз|офис|кафе|пекарн' THEN 'commercial'
    ELSE 'apartment'
  END AS type,

  -- Статус: по умолчанию активный
  'active' AS status,

  -- Цена: парсим из поля budget
  CASE
    -- Диапазон "7-8млн" → берём меньшее × 1 000 000
    WHEN budget ~* '\d+\s*-\s*\d+\s*млн'
      THEN CAST((REGEXP_MATCH(budget, '(\d+)'))[1] AS numeric) * 1000000
    -- "4 млн", "7млн", "5.5 млн"
    WHEN budget ~* '^\s*\d{1,2}[.,]?\d*\s*млн'
      THEN ROUND(CAST(REPLACE((REGEXP_MATCH(budget, '(\d+[.,]?\d*)'))[1], ',', '.') AS numeric) * 1000000)
    -- "3450 на руки", "5400 на руки" — число в тысячах
    WHEN budget ~ '\d{3,}'
      THEN CAST((REGEXP_MATCH(budget, '(\d{3,})'))[1] AS numeric) * 1000
    -- "47тыс за кв" — цена за м² (пропускаем как 0)
    ELSE 0
  END AS price,

  -- Площадь: ищем "41,5м2" "67м²" "35.3м²" "39 кв"
  COALESCE(
    CAST(
      NULLIF(
        REPLACE(
          (REGEXP_MATCH(request, '(\d+[.,]\d+|\d+)\s*(?:м²|кв\.?м|кв\b|м2)', 'i'))[1],
          ',', '.'
        ), ''
      ) AS numeric
    ),
    1.0  -- не удалось распарсить → ставим 1 (поле NOT NULL)
  ) AS area,

  -- Адрес: ищем "ул. ...", "пр. ...", "мкр", иначе используем имя клиента
  COALESCE(
    TRIM((REGEXP_MATCH(request, '(?:ул\.|пр\.|пер\.|бул\.|мкр\.?)\s*[\wА-Яа-яёЁ\-\.]+(?:\s+\d+[А-Яа-яёЁ]?)?'))[1]),
    name || ' — ' || LEFT(COALESCE(request, ''), 60)
  ) AS address,

  -- Название ЖК
  NULLIF(
    TRIM(COALESCE(
      (REGEXP_MATCH(request, '(?:ЖК|жк)\s+([\wА-Яа-яёЁ\s\-]+?)(?:\s*\||\s*[,;]|\s*\d|\s*$)', 'i'))[1],
      (REGEXP_MATCH(request, 'в\s+жк\s+([\wА-Яа-яёЁ\s\-]+?)(?:\s*\||\s*[,;]|\s*$)', 'i'))[1]
    )),
    ''
  ) AS complex_name,

  -- Описание = полный текст запроса
  request AS description,

  -- Количество комнат: "2-к", "1-к", "3-х комн", "2-комн"
  CASE
    WHEN request ~ '(\d)-к\b'
      THEN CAST((REGEXP_MATCH(request, '(\d)-к'))[1] AS int)
    WHEN request ~* '(\d)-комн'
      THEN CAST((REGEXP_MATCH(request, '(\d)-комн', 'i'))[1] AS int)
    WHEN request ~* '(\d)-х\s*комн'
      THEN CAST((REGEXP_MATCH(request, '(\d)-х', 'i'))[1] AS int)
    ELSE NULL
  END AS rooms,

  -- Этаж (числитель "2/10 эт")
  CASE
    WHEN request ~ '(\d+)/(\d+)\s*эт'
      THEN CAST((REGEXP_MATCH(request, '(\d+)/(\d+)\s*эт'))[1] AS int)
    WHEN request ~* '(\d+)\s*этаж'
      THEN CAST((REGEXP_MATCH(request, '(\d+)\s*этаж', 'i'))[1] AS int)
    ELSE NULL
  END AS floor,

  -- Всего этажей (знаменатель)
  CASE
    WHEN request ~ '(\d+)/(\d+)\s*эт'
      THEN CAST((REGEXP_MATCH(request, '(\d+)/(\d+)\s*эт'))[2] AS int)
    ELSE NULL
  END AS total_floors,

  -- Соток (для участков)
  CASE
    WHEN request ~* 'уч\.|уч\s|участ|сот\.'
      THEN CAST(NULLIF((REGEXP_MATCH(request, '(\d+)\s*сот', 'i'))[1], '') AS numeric)
    ELSE NULL
  END AS area_sotki,

  -- Кадастровый номер
  (REGEXP_MATCH(request, '\d{2}:\d{2}:\d+:\d+'))[1] AS cadastral_number,

  -- Собственник = сам клиент
  id AS owner_id

FROM clients
WHERE
  (request ILIKE 'Продает%' OR request ILIKE 'Продаёт%')
  AND request IS NOT NULL

ON CONFLICT (article) DO UPDATE SET
  description = EXCLUDED.description,
  price       = EXCLUDED.price,
  area        = EXCLUDED.area,
  address     = EXCLUDED.address,
  complex_name= EXCLUDED.complex_name;

-- Итог
SELECT
  type,
  count(*) as количество
FROM properties
GROUP BY type
ORDER BY type;

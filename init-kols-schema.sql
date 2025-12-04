-- Инициализация схемы kols_schema для KOLS агента
-- Этот скрипт создает отдельную схему внутри базы neondb

-- Подключаемся к базе neondb
\c neondb

-- Создаем схему для KOLS агента
CREATE SCHEMA IF NOT EXISTS kols_schema;

-- Даем права на схему
GRANT ALL ON SCHEMA kols_schema TO neondb_owner;
GRANT ALL ON SCHEMA kols_schema TO PUBLIC;

-- Создаем таблицы будут автоматически при первом запуске KOLS
-- (через миграции @elizaos/plugin-sql)

-- Готово! KOLS сможет использовать схему kols_schema

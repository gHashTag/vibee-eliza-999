# История Успешных Решений

## Исправление проблем с PGLite DEFAULT значениями для createdAt/updatedAt

**Дата:** 2025-01-26  
**Ветка:** `version/001`  
**Статус:** ✅ Рабочая версия без ошибок

### Проблема
PGLite не корректно обрабатывает DEFAULT значения для timestamp полей (`createdAt`, `updatedAt`) при использовании Drizzle ORM `.values()`. Это приводило к ошибкам:
- `null value in column "created_at" violates not-null constraint`
- `Failed query: insert into "participants" ... values (default, $1, ...)`

### Решение
Все методы INSERT в `packages/plugin-sql/src/base.ts`, использующие поля с DEFAULT значениями, были переписаны на использование `sql.raw()` с явным указанием `NOW()` или `CURRENT_TIMESTAMP`:

**Исправленные методы:**
1. `createEntities` - использует `sql.raw()` с `NOW()` и правильным форматированием PostgreSQL массивов
2. `createRooms` - использует `sql.raw()` с `NOW()`
3. `addParticipant` - использует `sql.raw()` с `NOW()`
4. `addParticipantsRoom` - использует `sql.raw()` с `NOW()`
5. `createComponent` - использует `sql.raw()` с `NOW()`
6. `createLog` - использует `sql.raw()` с `NOW()`
7. `createMemory` - использует `sql.raw()` с `NOW()` (включая embedding)
8. `createRelationship` - использует `sql.raw()` с `NOW()`
9. `createWorld` - использует `sql.raw()` с `NOW()`
10. `createTask` - использует `sql.raw()` с `NOW()` для `createdAt` и `updatedAt`
11. `createMessageServer` - использует `sql.raw()` с `CURRENT_TIMESTAMP`
12. `createChannel` - использует `sql.raw()` с `CURRENT_TIMESTAMP`
13. `createMessage` - использует `sql.raw()` с `CURRENT_TIMESTAMP`
14. `updateMemory` (embedding insert) - использует `sql.raw()` с `NOW()`

**Дополнительные исправления:**
- Исправлена инициализация `MessageBusService` в `packages/server/src/index.ts` - раскомментированы вызовы `setGlobalElizaOS()` и `setGlobalAgentServer()`

### Ключевые паттерны
1. **Использование `sql.raw()` вместо Drizzle ORM `.values()`** для всех INSERT операций с timestamp полями
2. **Явное указание `NOW()` или `CURRENT_TIMESTAMP`** вместо передачи `new Date()` как параметра
3. **Правильное форматирование PostgreSQL массивов** в формате `{value1,value2}` для `text[]` колонок
4. **Экранирование JSONB данных** через `replace(/'/g, "''")` перед вставкой

### Результат
- ✅ Все ошибки с `createdAt`/`updatedAt` исправлены
- ✅ Приложение успешно запускается без ошибок базы данных
- ✅ Все методы работают корректно с PGLite
- ✅ `MessageBusService` инициализируется корректно

### Коммит
*   **Коммит:** `26bbffc0ca10aba9f21988019ff91dc03cea8434` (Ветка: `version/001`)


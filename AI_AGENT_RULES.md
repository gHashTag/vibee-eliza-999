# AI AGENT RULES - ОБЯЗАТЕЛЬНО ПРОЧИТАТЬ!

## 🚨🚨🚨 ПРАВИЛО #1: ГДЕ API КЛЮЧИ? 🚨🚨🚨

**ВСЕ 50+ API КЛЮЧЕЙ ХРАНЯТСЯ В INFISICAL CLOUD!**

Ключи загружаются АВТОМАТИЧЕСКИ при старте через `bun dev`.

НЕ ищи ключи в:
- .env файле (там только конфиг Infisical)
- Коде
- Git истории

## 🚨🚨🚨 ПРАВИЛО #2: КАК ЗАПУСКАТЬ? 🚨🚨🚨

```bash
# ✅ ПРАВИЛЬНО
bun dev

# ❌ НЕПРАВИЛЬНО - секреты не загрузятся!
elizaos dev
node dist/entrypoint.js
```

## Что в .env файле?

**ТОЛЬКО 5 переменных для подключения к Infisical:**

```
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_PROJECT_ID=...
INFISICAL_ENVIRONMENT=dev
NODE_ENV=development
```

## Как работает загрузка секретов?

1. `bun dev` запускает сервер
2. Сервер вызывает `packages/server/src/services/infisicalSecretLoader.ts`
3. Этот сервис подключается к Infisical Cloud
4. Загружает все 50+ секретов
5. Устанавливает их в `process.env`
6. После этого все ключи доступны

## Какие ключи загружаются?

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_ID`
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `OPENROUTER_API_KEY`
- `FAL_KEY`
- `POSTGRES_URL`
- И ещё 40+ других

## Если секреты не загружаются

1. Проверь .env - там должны быть 5 переменных INFISICAL_*
2. Проверь логи - там должно быть "Loaded X secrets from Infisical"
3. Если ошибка - проверь INFISICAL_CLIENT_SECRET

## Ссылки

- Cursor правило: `.cursor/rules/infisical_secrets_centralized.mdc`
- Загрузчик секретов: `packages/server/src/services/infisicalSecretLoader.ts`
- Entrypoint: `packages/server/dist/entrypoint.js`

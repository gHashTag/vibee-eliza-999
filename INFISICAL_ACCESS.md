# 🔐 ДОСТУП К СЕКРЕТАМ ИЗ INFISICAL

## ⚠️ ПРОБЛЕМА

Infisical CLI требует интерактивного логина, который невозможно выполнить автоматически.

## 💡 РЕШЕНИЯ

### Решение 1: Логин в Infisical CLI (рекомендуется)

```bash
# 1. Логин в Infisical
infisical login

# 2. После логина, загрузка секретов
infisical export --env=dev > secrets.env
source secrets.env

# 3. Добавление в .env
cat secrets.env >> .env
```

### Решение 2: Веб-интерфейс Infisical

1. Перейдите на https://app.infisical.com
2. Войдите в аккаунт
3. Выберите проект: fd763fa3-35d5-4045-93bd-1795c5f00fc3
4. Перейдите в Secrets
5. Скопируйте нужные секреты:
   - TELEGRAM_BOT_TOKEN
   - FAL_KEY
   - REPLICATE_API_KEY
   - OPENROUTER_API_KEY

### Решение 3: Интерактивный скрипт

```bash
./load-infisical-secrets.sh
```

Этот скрипт поможет добавить токены в .env файл вручную.

## 📋 ТРЕБУЕМЫЕ СЕКРЕТЫ

| Секрет | Где получить | Формат |
|--------|--------------|--------|
| TELEGRAM_BOT_TOKEN | https://t.me/BotFather | 1234567890:ABC... |
| FAL_KEY | https://fal.ai | fal_key_xxx... |
| REPLICATE_API_KEY | https://replicate.com | r8_xxx... |
| OPENROUTER_API_KEY | https://openrouter.ai | sk-or-v1-xxx... |

## 🚀 ПОСЛЕ ДОБАВЛЕНИЯ СЕКРЕТОВ

```bash
pkill -f 'elizaos'
./start-agents.sh
./view-logs-simple.sh
```

## ⚡ БЫСТРЫЙ СПОСОБ

Если у вас есть токены, просто отредактируйте .env файл:

```bash
nano .env
```

Раскомментируйте строки 23-37 и добавьте токены:

```bash
TELEGRAM_BOT_TOKEN=ваш_токен
FAL_KEY=ваш_токен
REPLICATE_API_KEY=ваш_токен
```

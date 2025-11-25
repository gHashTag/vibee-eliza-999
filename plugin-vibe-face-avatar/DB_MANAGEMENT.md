# Database Management Guide

## Управление моделями через БД

### Просмотр всех моделей

```bash
cd /Users/playra/vibee-agent/plugin-vibe-face-avatar
sqlite3 data/avatar-face.db "SELECT * FROM user_models;"
```

### Обновление trigger word

```bash
# Установить NEURO_SAGE для всех моделей
sqlite3 data/avatar-face.db "UPDATE user_models SET trigger_word='NEURO_SAGE';"

# Или для конкретной модели
sqlite3 data/avatar-face.db "UPDATE user_models SET trigger_word='NEURO_SAGE' WHERE id='model-id-here';"
```

### Добавление новой модели

```bash
sqlite3 data/avatar-face.db <<EOF
INSERT INTO user_models (
  telegram_id,
  bot_name,
  model_name,
  model_url,
  trigger_word,
  status,
  is_active,
  metadata
) VALUES (
  123456,
  'neuro_face_bot',
  'My Custom LoRA',
  'https://v3b.fal.media/files/.../model.safetensors',
  'NEURO_SAGE',
  'completed',
  1,
  '{"description": "Custom model"}'
);
EOF
```

### Деактивация модели

```bash
# Скрыть модель (не удаляя)
sqlite3 data avatar-face.db "UPDATE user_models SET is_active=0 WHERE id='model-id';"

# Показать снова
sqlite3 data/avatar-face.db "UPDATE user_models SET is_active=1 WHERE id='model-id';"
```

### Удаление модели

```bash
sqlite3 data/avatar-face.db "DELETE FROM user_models WHERE id='model-id';"
```

### Проверка API

```bash
# Получить список моделей через API
curl "http://localhost:3001/api/models?telegram_id=123456" | jq .

# Только названия и trigger words
curl "http://localhost:3001/api/models?telegram_id=123456" 2>/dev/null | jq '.models[] | {name, trigger_word}'
```

---

## Текущее состояние БД

Обновлено trigger word на `NEURO_SAGE` для всех моделей:

```
Cyberpunk Warrior LoRA - NEURO_SAGE
Elephant LoRA (Fal.ai) - NEURO_SAGE
```

---

## Автоматическое обновление фронтенда

После изменения БД:
1. API автоматически вернет обновленные данные
2. Фронтенд перезагрузит список моделей при рефреше страницы
3. Новый trigger word будет использоваться в generation

**Перезагрузи страницу** чтобы увидеть изменения!

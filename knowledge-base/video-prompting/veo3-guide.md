# Veo 3 Prompting Guide

> Официальный гайд по созданию промптов для Google Veo 3 (2025)
> Источники: [Google DeepMind](https://deepmind.google/models/veo/prompt-guide/), [Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)

## Структура промпта (Формула)

```
[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]
```

---

## Уникальные возможности Veo 3

### 1. Нативная генерация звука
Veo 3 умеет генерировать звук! Это главное отличие от Sora 2.

**Типы аудио:**
- **Ambient sounds** - фоновые звуки окружения
- **Sound effects (SFX)** - звуковые эффекты
- **Dialogue** - речь персонажей
- **Music** - фоновая музыка

### 2. Формат диалога
**Важно:** В Veo 3 диалог пишется через двоеточие, не в кавычках!

```
He says: Your usual?
She responds: Yes, thank you.
```

### 3. Убрать субтитры
Добавляй `(no subtitles)` после диалога, чтобы убрать авто-субтитры:

```
He says: Your usual? (no subtitles)
```

### 4. Описание амбиента
Отдельным блоком описывай фоновые звуки:

```
Ambient: coffee machine hissing, soft jazz in background, distant chatter
```

---

## Движения камеры

| Тип | Описание |
|-----|----------|
| Dolly shot | Плавное движение на рельсах |
| Tracking shot | Следование за объектом |
| Crane shot | Подъём/спуск камеры |
| Aerial view | Вид сверху (дрон) |
| Slow pan | Медленное панорамирование |
| POV shot | От первого лица |

**Примеры:**
- "Slow dolly push toward the subject"
- "Tracking shot following from camera left"
- "Crane shot rising to reveal the cityscape"
- "POV shot, handheld movement"

---

## Композиция кадра

| Тип | Описание |
|-----|----------|
| Wide shot | Общий план |
| Medium shot | Средний план |
| Close-up | Крупный план |
| Extreme close-up | Детальный план |
| Two-shot | Два персонажа в кадре |
| Over-the-shoulder | Через плечо |
| Low angle | Снизу вверх |

---

## Линза и фокус

| Термин | Эффект |
|--------|--------|
| Shallow depth of field | Размытый фон, фокус на объекте |
| Deep focus | Всё в фокусе |
| Wide-angle lens | Широкий угол обзора |
| Soft focus | Мягкий фокус |
| Macro lens | Макросъёмка |
| Anamorphic | Кинематографичный широкий формат |

---

## Timestamp Prompting

Для сложных сцен можно использовать тайминг по секундам:

```
[0-3s] Close-up of hands typing on keyboard
[3-6s] Pull back to reveal office environment
[6-10s] Character turns, walks toward window
```

---

## Примеры промптов

### Кафе сцена с диалогом (6 секунд)
```
Medium shot, tracking right. A barista in a vintage apron prepares
espresso in a cozy cafe. Steam rises from the machine. Soft window
light, film grain.

He says: Your usual? (no subtitles)

Ambient: coffee machine hissing, soft jazz in background. 6 seconds.
```

### Интервью в офисе (8 секунд)
```
Medium close-up, static shot, shallow depth of field. A tech entrepreneur
in a casual blazer sits in a modern office, glass walls behind her blurred.
Natural window light from camera right, subtle fill.

She says: We're building the future, one line of code at a time. (no subtitles)

Ambient: quiet office hum, distant keyboard clicks. 8 seconds.
```

### Городской пейзаж (5 секунд)
```
Aerial view, slow descending crane shot. A modern city skyline at
golden hour. Skyscrapers reflect warm sunlight. Traffic moves below
like tiny lights. Warm oranges and soft purples in the sky.

Ambient: distant traffic, wind at altitude. 5 seconds.
```

---

## Лучшие практики

### Описывай действия конкретно
| Плохо | Хорошо |
|-------|--------|
| "Person moves quickly" | "Cyclist pedals three times, brakes, stops" |
| "Someone talks" | "He leans forward, says: Tell me more" |
| "Camera moves" | "Slow dolly push toward subject" |

### Якорные элементы
Используй конкретные детали вместо общих описаний:
- Цвета: "teal and orange", "cyan and magenta"
- Текстуры: "film grain", "wet asphalt"
- Свет: "golden hour", "neon glow"

### Длительность
- **5-8 секунд** - оптимально для качества
- **10-15 секунд** - максимум
- Короткие клипы = лучше качество

### Диалог
- **6-12 слов** на 8-секундный клип
- Простые фразы работают лучше
- Всегда добавляй `(no subtitles)` если не нужны субтитры

---

## Отличия от Sora 2

| Аспект | Sora 2 | Veo 3 |
|--------|--------|-------|
| Аудио | Отдельный блок Dialogue | Встроенная генерация |
| Формат диалога | `[Speaker]: "[line]"` | `He says: line` |
| Субтитры | Нет авто-субтитров | Есть, убирай `(no subtitles)` |
| Физика | Сильнее в реализме | Сильнее в аудио |
| Макс. длина | 12 секунд | 15 секунд |

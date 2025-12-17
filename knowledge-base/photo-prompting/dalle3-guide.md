# DALL-E 3 Prompting Guide

> Руководство по созданию промптов для OpenAI DALL-E 3 (2025)
> Источник: OpenAI Documentation

## Философия DALL-E 3

DALL-E 3 использует **естественный язык** - пиши как объясняешь другу.
Модель автоматически улучшает промпты, поэтому сложные параметры не нужны.

---

## Структура промпта

```
[Detailed Description] + [Style] + [Mood] + [Composition]
```

**Ключевое отличие:** DALL-E 3 понимает контекст и связи между объектами.

---

## Ключевые принципы

### 1. Описательность > Ключевые слова
| Плохо | Хорошо |
|-------|--------|
| "cat, cute, fluffy, 4k" | "A fluffy orange cat sleeping on a sunlit windowsill, soft afternoon light streaming through lace curtains" |
| "portrait, woman, beautiful" | "Close-up portrait of a woman in her 30s with warm brown eyes and a gentle smile, soft studio lighting creating subtle shadows" |

### 2. Конкретные детали
Вместо общих слов используй точные описания:
- **Возраст:** "in her 40s" вместо "middle-aged"
- **Эмоции:** "contemplative expression" вместо "thoughtful"
- **Освещение:** "golden hour sunlight" вместо "nice lighting"
- **Материалы:** "weathered oak table" вместо "wooden table"

### 3. Пространственные отношения
DALL-E 3 хорошо понимает:
- "in the foreground" / "in the background"
- "to the left of" / "to the right of"
- "above" / "below" / "behind"
- "reflected in" / "casting shadow on"

---

## Стилевые направления

### Фотография
```
"professional photograph"
"editorial photography style"
"fashion photography"
"documentary style"
"macro photography"
"long exposure photography"
"street photography"
```

### Искусство
```
"oil painting in the style of impressionism"
"digital illustration"
"watercolor artwork"
"pencil sketch"
"mixed media collage"
"vector art illustration"
"concept art style"
```

### 3D и рендеры
```
"3D render"
"isometric illustration"
"low poly 3D"
"octane render"
"unreal engine style"
"clay render"
```

---

## Работа с текстом

DALL-E 3 умеет генерировать текст в изображениях:

```
A vintage coffee shop sign that reads "Morning Brew"
in elegant gold lettering on a dark green background,
art deco style, illuminated from below
```

**Советы:**
- Указывай текст в кавычках
- Описывай шрифт: "bold sans-serif", "elegant script"
- Указывай цвет и размер текста
- Ограничивай количество слов (2-4 работают лучше)

---

## Примеры промптов

### Портрет
```
A candid portrait of a jazz musician in his 60s,
wearing a classic fedora and holding a saxophone.
He's standing in a dimly lit jazz club,
warm amber light from a single spotlight
creates dramatic shadows on his weathered face.
Shot on medium format film, shallow depth of field,
intimate atmosphere.
```

### Пейзаж
```
A serene Japanese garden in autumn,
with a traditional wooden bridge arching
over a koi pond filled with orange and white fish.
Red maple leaves float on the water's surface,
creating perfect reflections.
Early morning mist rises from the pond,
soft diffused light, tranquil atmosphere.
```

### Продуктовое фото
```
A minimalist product photograph of a luxury watch
on a smooth black marble surface.
The watch has a rose gold case and dark blue dial,
with subtle reflections showing its premium materials.
Professional studio lighting with soft shadows,
high-end advertising style.
```

### Концепт-арт
```
A floating city in the clouds at sunset,
with art nouveau architecture featuring
curved brass structures and glass domes.
Airships dock at ornate platforms,
while birds fly between the towering spires.
Warm golden light bathes the scene,
creating long shadows and lens flares.
```

---

## Чего НЕ делать

### Негативные промпты не работают
DALL-E 3 **не поддерживает** негативные инструкции:
- ❌ "no people in the background"
- ❌ "without text"
- ❌ "don't include animals"

**Вместо этого:** описывай то, что ХОЧЕШЬ видеть.

### Избегай
- Упоминания реальных людей (celebrities)
- Копирайтных персонажей без контекста
- Слишком коротких промптов
- Противоречивых описаний

---

## Aspect Ratios

DALL-E 3 поддерживает:
- **1024x1024** - квадрат (default)
- **1792x1024** - горизонтальный (landscape)
- **1024x1792** - вертикальный (portrait)

---

## Система улучшения промптов

DALL-E 3 автоматически расширяет короткие промпты.

**Твой промпт:**
```
a cat sitting
```

**Расширенный промпт (примерно):**
```
A fluffy tabby cat sitting gracefully on a wooden floor,
soft natural light coming from a nearby window,
warm and cozy interior setting,
photorealistic style with detailed fur texture
```

**Совет:** Чтобы сохранить контроль, пиши детальные промпты сам.

---

## Лучшие практики

### Структурируй описание
1. **Главный объект** - кто/что в центре
2. **Действие/поза** - что происходит
3. **Окружение** - где это происходит
4. **Освещение** - какой свет
5. **Настроение** - какая атмосфера
6. **Стиль** - фото/арт/3D

### Оптимальная длина
- **Минимум:** 15-20 слов
- **Оптимум:** 40-75 слов
- **Максимум:** ~400 символов эффективно обрабатываются

### Итерация
DALL-E 3 генерирует хорошие результаты с первой попытки, но:
- Пробуй разные формулировки
- Добавляй/убирай детали
- Меняй стиль или освещение

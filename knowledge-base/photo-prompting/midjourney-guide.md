# Midjourney Prompting Guide

> Руководство по созданию промптов для Midjourney v6/v7 (2025)
> Источник: Официальная документация Midjourney

## Формула промпта

```
[Subject] + [Details] + [Style] + [Lighting] + [Mood] + [Parameters]
```

---

## 4W1H Техника

| Вопрос | Описание | Пример |
|--------|----------|--------|
| **Who** | Кто в кадре | "a young woman with red hair" |
| **What** | Что делает | "reading a book" |
| **Where** | Где происходит | "in a cozy library" |
| **When** | Время суток/года | "golden hour, autumn" |
| **How** | Стиль/техника | "oil painting style, soft lighting" |

---

## Параметры Midjourney

### Aspect Ratio (--ar)
```
--ar 1:1    # Квадрат (default)
--ar 16:9   # Широкий экран
--ar 9:16   # Вертикальный (истории)
--ar 4:3    # Классический
--ar 3:2    # Фото формат
--ar 21:9   # Ультраширокий
```

### Stylize (--s)
Контролирует силу стиля Midjourney:
```
--s 0       # Минимум стиля, максимум точности
--s 100     # Default
--s 250     # Средний стиль
--s 750     # Сильный стиль, меньше точности
--s 1000    # Максимум художественности
```

### Chaos (--c)
Вариативность результатов:
```
--c 0       # Похожие результаты (default)
--c 50      # Средняя вариативность
--c 100     # Максимум разнообразия
```

### Version (--v)
```
--v 6       # Версия 6 (стабильная)
--v 6.1     # Версия 6.1
--v 7       # Версия 7 (новейшая)
```

### Quality (--q)
```
--q .25     # Быстро, низкое качество
--q .5      # Быстро, среднее качество
--q 1       # Default
--q 2       # Медленно, высокое качество
```

### Другие параметры
```
--no [text]     # Исключить элементы
--seed [number] # Фиксированный seed
--tile          # Бесшовная текстура
--weird [0-3000] # Экспериментальность
```

---

## Multi-Prompts (::)

Разделяй части промпта для контроля веса:

```
hot dog          # Собака или еда? Непонятно
hot:: dog        # HOT отдельно от DOG
hot::2 dog::1    # HOT важнее в 2 раза
```

**Примеры:**
```
space:: ship     # Космос + корабль отдельно
space ship       # Космический корабль
```

---

## Стилевые ключевые слова

### Фотография
- **portrait photography** - портретная съёмка
- **studio lighting** - студийный свет
- **natural light** - естественный свет
- **golden hour** - золотой час
- **blue hour** - синий час
- **backlit** - контровой свет
- **soft focus** - мягкий фокус
- **bokeh** - боке
- **35mm film** - плёночная эстетика
- **hasselblad** - среднеформатная камера
- **DSLR** - зеркальная камера

### Художественные стили
- **oil painting** - масляная живопись
- **watercolor** - акварель
- **digital art** - цифровое искусство
- **concept art** - концепт-арт
- **anime style** - аниме стиль
- **3D render** - 3D рендер
- **photorealistic** - фотореализм
- **hyperrealistic** - гиперреализм
- **surrealist** - сюрреализм
- **minimalist** - минимализм

### Освещение
- **dramatic lighting** - драматичное освещение
- **soft lighting** - мягкое освещение
- **rim light** - контровой свет
- **volumetric light** - объёмный свет
- **neon lights** - неоновое освещение
- **candlelight** - свечное освещение
- **moonlight** - лунный свет

### Настроение
- **moody** - атмосферный
- **ethereal** - эфемерный
- **cozy** - уютный
- **mysterious** - загадочный
- **peaceful** - спокойный
- **energetic** - энергичный
- **melancholic** - меланхоличный

---

## Примеры промптов

### Портрет (Photorealistic)
```
portrait of a young woman with freckles and green eyes,
natural light from window, soft smile,
hasselblad medium format, 85mm lens, f/1.8,
shallow depth of field, warm color palette
--ar 3:4 --s 150 --v 6.1
```

### Пейзаж (Cinematic)
```
vast mountain landscape at sunrise,
misty valleys, snow-capped peaks,
dramatic lighting, cinematic composition,
epic scale, anamorphic lens flare
--ar 21:9 --s 500 --v 6.1
```

### Концепт-арт
```
futuristic cyberpunk city at night,
neon signs in Japanese, flying vehicles,
rain-soaked streets, holographic advertisements,
blade runner style, highly detailed
--ar 16:9 --s 750 --c 20 --v 6.1
```

### Продуктовое фото
```
luxury perfume bottle on marble surface,
golden liquid inside, dramatic studio lighting,
soft shadows, product photography,
high-end advertising style
--ar 4:5 --s 100 --v 6.1
```

---

## Лучшие практики

### Делай
- Будь конкретным в описаниях
- Используй параметры для контроля результата
- Экспериментируй с --s и --c
- Указывай стиль камеры/объектива для фото
- Используй :: для разделения концептов

### Избегай
- Слишком длинных промптов (>75 слов)
- Противоречивых инструкций
- Негативных формулировок в основном промпте
- Слишком абстрактных описаний
- Перегрузки ключевыми словами

---

## Отличия версий

| Аспект | v6 | v7 |
|--------|-----|-----|
| Реализм | Высокий | Очень высокий |
| Текст | Поддерживается | Улучшенный |
| Руки | Хорошо | Отлично |
| Скорость | Быстрая | Средняя |
| Детализация | Высокая | Очень высокая |

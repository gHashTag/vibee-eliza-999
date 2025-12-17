# Flux Prompting Guide

> Руководство по созданию промптов для Flux (Black Forest Labs) (2025)
> Источники: Официальная документация, Replicate guides

## Особенности Flux

- **Dual Encoder:** T5 (понимание языка) + CLIP (визуальные концепты)
- **Отличная работа с текстом** в изображениях
- **Высокая детализация** и реализм
- **HEX цвета** поддерживаются нативно
- **Версии:** Flux.1 Pro, Flux.1 Dev, Flux.1 Schnell

---

## Структура промпта

```
[Subject] + [Action/Pose] + [Style] + [Context/Environment] + [Details]
```

**Оптимальная длина:** 15-75 слов

---

## Версии Flux

| Версия | Скорость | Качество | Использование |
|--------|----------|----------|---------------|
| **Schnell** | Очень быстро | Хорошее | Быстрые итерации |
| **Dev** | Средняя | Отличное | Разработка |
| **Pro** | Медленная | Лучшее | Финальные изображения |

---

## Работа с цветами

### HEX цвета
Flux уникально поддерживает HEX коды:

```
A woman wearing a dress in #FF6B35 (burnt orange),
standing against a wall painted #2D3047 (dark blue-gray)
```

### Цветовые палитры
```
Color palette: #E63946, #F1FAEE, #A8DADC, #457B9D, #1D3557
```

---

## Генерация текста

Flux отлично генерирует текст в изображениях:

```
A neon sign that reads "OPEN 24/7"
in bright pink (#FF69B4) letters
against a dark brick wall at night
```

**Советы:**
- Используй кавычки для текста
- Указывай цвет текста
- Описывай стиль шрифта
- Не более 3-4 слов для надёжности

---

## Стилевые ключевые слова

### Фотореализм
```
photorealistic
hyperrealistic
ultra-detailed photograph
professional photography
8k resolution
```

### Кинематограф
```
cinematic lighting
film grain
anamorphic lens
movie still
35mm film
```

### Цифровое искусство
```
digital art
concept art
illustration
vector art
flat design
```

### Рендеринг
```
3D render
octane render
unreal engine 5
ray tracing
subsurface scattering
```

---

## Освещение

### Естественный свет
```
golden hour sunlight
soft morning light
harsh midday sun
overcast diffused light
blue hour twilight
```

### Студийное
```
studio lighting setup
three-point lighting
softbox lighting
ring light
beauty dish
```

### Драматичное
```
dramatic side lighting
chiaroscuro
rim lighting
backlit silhouette
volumetric light rays
```

---

## Примеры промптов

### Портрет (Flux Pro)
```
Close-up portrait of a woman with silver hair
and striking blue eyes (#4A90D9),
soft studio lighting with subtle rim light,
wearing a minimalist black turtleneck,
shallow depth of field,
professional fashion photography style,
neutral gray background
```

### Продуктовое фото
```
Luxury skincare bottle on polished marble surface,
the bottle is frosted glass with gold (#D4AF37) accents,
soft directional lighting creating elegant shadows,
water droplets on the surface,
high-end advertising photography,
clean minimal composition
```

### Архитектура
```
Modern minimalist house at golden hour,
floor-to-ceiling windows reflecting sunset colors,
concrete and wood materials,
infinity pool in foreground,
architectural photography style,
warm color palette (#F4A460, #DEB887, #8B4513)
```

### Еда
```
Artisan sourdough bread on rustic wooden board,
steam rising from freshly baked crust,
scattered flour and wheat stalks,
warm morning light from side window,
food photography style,
shallow depth of field,
cozy bakery atmosphere
```

### Концепт персонажа
```
Fantasy warrior princess in ornate silver armor,
long braided auburn hair,
determined expression,
standing on cliff edge overlooking misty valley,
dramatic sunset backlighting,
digital concept art style,
highly detailed, epic composition
```

---

## Параметры генерации

### Guidance Scale
- **1-3:** Креативные, абстрактные результаты
- **3.5-5:** Баланс креативности и точности
- **5-7:** Близко к промпту (рекомендуется)
- **7+:** Очень строгое следование промпту

### Количество шагов
- **Schnell:** 4-8 шагов
- **Dev:** 20-28 шагов
- **Pro:** 25-50 шагов

---

## Aspect Ratios

Flux поддерживает различные соотношения:
```
1:1     # Квадрат
16:9    # Широкий экран
9:16    # Вертикальный
4:3     # Классический
3:2     # Фото формат
21:9    # Ультраширокий
```

---

## Лучшие практики

### Делай
- Начинай с главного объекта
- Указывай стиль конкретно
- Используй HEX для точных цветов
- Описывай освещение детально
- Указывай композицию (close-up, wide shot)

### Избегай
- Негативных промптов в основном тексте
- Слишком абстрактных описаний
- Противоречивых инструкций
- Перегрузки ключевыми словами (>100 слов)

---

## Сравнение с другими моделями

| Аспект | Flux | Midjourney | DALL-E 3 |
|--------|------|------------|----------|
| Текст | Отлично | Хорошо | Отлично |
| Реализм | Отлично | Отлично | Очень хорошо |
| Скорость | Быстро (Schnell) | Средняя | Средняя |
| Контроль цвета | HEX поддержка | Описательный | Описательный |
| Параметры | Guidance, Steps | --ar, --s, --c | Размер |
| Стиль | Фотореалистичный | Художественный | Баланс |

---

## Продвинутые техники

### Weighted prompts
```
(highly detailed face:1.3),
(soft lighting:1.2),
(blurred background:0.8)
```

### Negative prompts (отдельное поле)
```
blurry, low quality, distorted, ugly,
deformed hands, extra fingers,
watermark, text overlay
```

### Seed для консистентности
Используй одинаковый seed для похожих результатов при изменении промпта.

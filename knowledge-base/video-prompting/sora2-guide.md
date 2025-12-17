# Sora 2 Prompting Guide

> Официальный гайд по созданию промптов для OpenAI Sora 2 (декабрь 2024)
> Источник: [OpenAI Cookbook](https://cookbook.openai.com/examples/sora/sora2_prompting_guide)

## Структура промпта (5 слоёв)

### 1. Scene (Сцена)
Описание персонажей, костюмов, окружения, погоды.

**Примеры:**
- "wet asphalt, neon signs reflecting in puddles"
- "a woman in her 30s with short black hair, wearing a red coat"
- "modern office, glass walls, afternoon sunlight"

### 2. Camera (Камера)
Кадр, угол, линза, движение камеры.

**Примеры:**
- "anamorphic 2.0x lens, shallow DOF"
- "dolly left, tracking shot"
- "static wide shot, deep focus"
- "crane shot rising to reveal"

### 3. Lighting (Освещение)
Источники света, направление, цветовая палитра.

**Примеры:**
- "soft window light with warm lamp fill, cool rim light"
- "golden hour sunlight, warm oranges and soft purples"
- "neon glow, cyan and magenta palette"

### 4. Motion (Движение)
Действия по битам/счёту. Конкретный тайминг.

**Примеры:**
- "takes four steps, pauses, pulls curtain in final second"
- "lifts cup, sips slowly, sets down on saucer"
- "cyclist pedals three times, brakes, stops at crosswalk"

### 5. Audio (Аудио)
Диалог в отдельном блоке, diegetic звуки.

**Формат диалога:**
```
Dialogue: [Speaker]: "[line]"
```

**Примеры:**
- "Dialogue: Barista: 'Your usual?'"
- "Ambient: distant traffic, wind"

---

## Ключевые рекомендации

### Правило одного кадра
**Один кадр = одно движение камеры + одно действие**

Плохо: "камера движется по кругу, пока персонаж бежит и говорит по телефону"
Хорошо: "tracking shot following from left. Character walks three steps, pauses, turns"

### Якорные цвета
Используй 3-5 якорных цветов для консистентности палитры.

**Примеры:**
- "teal and orange color palette"
- "cyan and magenta, high contrast"
- "warm oranges, soft purples, golden tones"

### Оптимальная длительность
- **4-8 секунд** - оптимально
- **12 секунд** - максимум
- Чем короче, тем лучше качество

### Что избегать

| Плохо | Хорошо |
|-------|--------|
| "cinematic look" | "anamorphic 2.0x lens, volumetric light" |
| "beautiful street" | "wet asphalt, zebra crosswalk, neon reflections" |
| "person moves" | "takes three steps, pauses, looks back" |
| негативные инструкции ("no", "don't") | описывай что ХОЧЕШЬ видеть |

---

## Примеры промптов

### Городская сцена (6 секунд)
```
Tracking shot following from camera left. A cyclist in a yellow raincoat
pedals through a rain-soaked Tokyo street at night. Neon signs reflect
in puddles on wet asphalt. Cyclist takes three pedal strokes, brakes
gently, stops at zebra crosswalk. Anamorphic 2.0x lens, cyan and magenta
color palette, volumetric rain. 6 seconds.
```

### Портрет на крыше (4 секунды)
```
Slow dolly push. A woman in her 30s stands on a rooftop terrace, wind
gently moving her hair. She watches the sunset over a modern city skyline.
Golden hour lighting, warm oranges and soft purples. She turns toward
camera in final second, slight smile. Anamorphic 2.0x lens, shallow
depth of field. 4 seconds.
```

### Кафе интерьер (8 секунд)
```
Medium shot, static camera. A barista in a vintage apron prepares
espresso behind a marble counter. Steam rises from the machine. Soft
window light from camera left, warm fill light, film grain. Barista
lifts portafilter, locks it, presses button. Cup fills with crema.
35mm lens, shallow depth of field. 8 seconds.
```

---

## Технические термины

### Линзы
- **Anamorphic 2.0x** - широкоэкранный кинематографичный look
- **35mm** - стандартный объектив
- **85mm prime** - портретный объектив
- **Wide-angle** - широкоугольный

### Глубина резкости (DOF)
- **Shallow depth of field** - размытый фон
- **Deep focus** - всё в фокусе
- **Bokeh** - красивое размытие огней на фоне

### Движения камеры
- **Dolly push/pull** - приближение/отдаление
- **Tracking shot** - следование за объектом
- **Crane shot** - подъём/спуск
- **Static/Locked-off** - неподвижная камера
- **Handheld** - ручная съёмка

### Освещение
- **Key light** - основной свет
- **Fill light** - заполняющий свет
- **Rim light** - контровой свет
- **Volumetric light** - объёмный свет (лучи)
- **Practical lights** - источники в кадре (лампы)

# Udio AI Prompting Guide

> Руководство по созданию музыкальных промптов для Udio AI (2025)
> Источники: Udio Help Center, Tom's Guide, AI Music Prompts

## Ключевые особенности Udio

- **Высокое качество аудио** - студийный уровень звука
- **Генерация за 30 секунд** - быстрые результаты
- **Remix функция** - изменение жанра с сохранением мелодии
- **Inpainting** - перегенерация отдельных секций
- **32-секундные сниппеты** - расширяемые в полные треки

---

## Структура промпта

### Формула трёх элементов:
```
[Genre] + [Mood/Energy] + [Instrumentation/Context]
```

### Расширенная формула:
```
[Genre] → [Tempo/Energy] → [Instruments] → [Mood] → [Vocals] → [Section hint]
```

---

## Правила эффективного промпта

### 1. Будь конкретным
| Плохо | Хорошо |
|-------|--------|
| "Happy song" | "Upbeat indie pop with bright guitar riffs and catchy hook" |
| "Sad music" | "Melancholic piano ballad with soft strings, emotional female vocals" |
| "Dance track" | "Energetic house music with driving bass, 128 BPM, festival vibes" |

### 2. Держи компактность
**Оптимально:** до 15 слов
**Максимум:** 30-40 слов

Udio награждает за ясность, а не длину.

### 3. Структура промпта
```
Genre → tempo/energy → instrumentation → mood → vocal role → section hint
```

**Пример:**
```
Upbeat pop, 120 BPM feel, bright guitars and synths,
confident mood, female lead vocals, short intro then big hook
```

---

## Контроль темпа

Udio понимает указания темпа:

```
"around 100 BPM"
"~128 BPM"
"slow 70-75 BPM"
"high energy 140 BPM"
```

---

## Повторение для акцента

Хочешь подчеркнуть что-то? **Повтори ключевые слова:**

```
"Heavy bass, heavy 808s, heavy drums"
"Chill, relaxing, calm, peaceful vibes"
```

---

## Примеры промптов

### Dreamy Ambient
```
Dreamy, ambient piano with soft violin and ocean waves
```

### 80s Rock
```
High-energy 80s rock with electric guitar solos and powerful vocals
```

### Soulful Blues
```
Soulful blues with a slow, smoldering electric guitar solo and husky vocals
```

### Synthwave
```
Futuristic synthwave with deep bass grooves and a neon-lit atmosphere
```

### Gothic Bluegrass
```
Whispers of banjo and fiddle strings, a haunted hoedown where the banshee sings
```

### Afrofuturistic Funk
```
Vibrant, rhythmic exploration of a futuristic African city,
afrobeat grooves with electronic textures
```

---

## Жанровые mashup'ы

Udio отлично справляется с комбинированием жанров:

```
"Jazz meets trap - smooth saxophone over 808 beats"
"Classical piano with lo-fi hip-hop drums"
"Folk acoustic with electronic ambient textures"
"Reggae rhythm with rock guitar energy"
```

---

## Описание атмосферы

Udio хорошо реагирует на описание атмосферы:

```
"A heartfelt acoustic folk song with soft vocals and warm guitar tones,
inspired by the tranquility of nature"

"Dark electronic track with industrial textures,
the sound of a dystopian city at night"

"Bright pop anthem for summer festivals,
euphoric synths and crowd-ready drops"
```

---

## Работа с Remix

Функция Remix позволяет изменить жанр трека, сохранив мелодию:

1. Сгенерируй базовый трек
2. Выбери Remix
3. Укажи новый жанр: "Same melody but as jazz" или "Convert to lo-fi"

---

## Inpainting (редактирование секций)

Если часть трека не нравится:

1. Выдели проблемную секцию
2. Перегенерируй с новым промптом
3. Сохрани то, что работает

---

## Сравнение с Suno

| Аспект | Udio | Suno |
|--------|------|------|
| Качество звука | Студийное | Высокое |
| Скорость | Очень быстро | Быстро |
| Вокал | Реалистичный | Хороший |
| Mashup жанров | Отлично | Очень хорошо |
| Контроль структуры | Базовый | Мета-теги |
| Редактирование | Inpainting | Extend |

---

## Лучшие практики

### Делай
- Описывай жанр конкретно
- Указывай BPM для контроля
- Используй описательные прилагательные
- Комбинируй жанры креативно
- Описывай атмосферу и контекст

### Избегай
- Слишком длинных промптов (>40 слов)
- Противоречивых описаний
- Технических терминов без контекста
- Негативных инструкций

---

## Продвинутые техники

### Эра и декада
```
"80s synth pop style"
"90s grunge rock"
"2000s R&B production"
"Modern trap with vintage soul samples"
```

### Эмоциональная динамика
```
"Starting melancholic, building to triumphant climax"
"Calm intro that explodes into high energy chorus"
"Tension building throughout, release in final section"
```

### Референсы (осторожно)
```
"In the style of modern indie rock"
"Production quality like professional studio recording"
```
**Примечание:** Избегай прямых упоминаний артистов из-за авторских прав.

---

## Типичные ошибки

| Ошибка | Решение |
|--------|---------|
| "Make me a song" | Укажи жанр, настроение, инструменты |
| Слишком абстрактно | Добавь конкретные инструменты |
| Противоречия | "Happy sad song" → выбери одно |
| Перегрузка | Сократи до ключевых элементов |

---

## Quick Start шаблоны

### Для Pop:
```
[Mood] pop, [instruments], [vocal type] vocals, [energy], [BPM] BPM
```

### Для Electronic:
```
[Subgenre] electronic, [synth type] synths, [bass type] bass, [energy], [BPM] BPM
```

### Для Rock:
```
[Subgenre] rock, [guitar type] guitar, [drum style] drums, [vocal type] vocals, [mood]
```

### Для Lo-Fi:
```
Chill lo-fi [subgenre], [instrument 1], [instrument 2], [texture], relaxing, [BPM] BPM
```

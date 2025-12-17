# Suno AI Prompting Guide

> Руководство по созданию музыкальных промптов для Suno AI (2025)
> Источники: Официальная документация, Learn Prompting, Skywork AI

## Структура промпта

```
[Genre & Style] + [Mood & Emotion] + [Instruments] + [Vocals] + [Tempo/BPM]
```

---

## Ключевые компоненты промпта

### 1. Genre & Style (Жанр и стиль)
Указывай жанр конкретно, можно комбинировать:

**Популярные жанры:**
- Pop, Indie Pop, Synth Pop
- Hip-Hop, Trap, Lo-Fi Hip-Hop
- Rock, Indie Rock, Alternative
- Electronic, EDM, House, Techno
- R&B, Soul, Jazz
- Classical, Orchestral, Cinematic
- Folk, Country, Acoustic

**Примеры:**
- "upbeat indie pop with folk influences"
- "dark trap beat with melodic elements"
- "dreamy lo-fi hip-hop with jazz samples"

### 2. Mood & Emotion (Настроение)
Описывай эмоциональную окраску:

- **Позитивные:** happy, uplifting, energetic, triumphant, feel-good
- **Негативные:** melancholic, sad, dark, mysterious, haunting
- **Нейтральные:** calm, relaxing, chill, ambient, dreamy
- **Интенсивные:** aggressive, powerful, epic, dramatic, intense

### 3. Instrumentation (Инструменты)
Указывай конкретные инструменты:

- **Гитары:** acoustic guitar, electric guitar, distorted guitar
- **Клавишные:** piano, synth, organ, rhodes
- **Ударные:** drums, 808s, trap hi-hats, soft drums
- **Басы:** bass, 808 bass, upright bass
- **Оркестр:** strings, brass, choir, orchestra

### 4. Vocals (Вокал)
Описывай характеристики голоса:

- **Пол:** male vocals, female vocals
- **Характер:** soft, powerful, raspy, smooth, autotuned
- **Стиль:** melodic, rap, spoken word, harmonies

### 5. Tempo (Темп)
Указывай BPM для точности:

| Жанр | BPM диапазон |
|------|-------------|
| Lo-Fi | 70-90 |
| R&B | 80-100 |
| Pop | 100-130 |
| Rock | 100-140 |
| Hip-Hop | 80-115 |
| Trap | 130-160 |
| EDM | 120-150 |

---

## Мета-теги структуры песни

Suno поддерживает теги для структурирования песни:

### Основные теги

| Тег | Описание | Пример |
|-----|----------|--------|
| `[Intro]` | Вступление | `[Intro] Soft piano intro` |
| `[Verse]` | Куплет | `[Verse 1] Walking down the street` |
| `[Chorus]` | Припев | `[Chorus] This is where we shine` |
| `[Bridge]` | Бридж | `[Bridge] Slow down, build tension` |
| `[Drop]` | Дроп (для EDM) | `[Drop] Heavy bass drop` |
| `[Outro]` | Концовка | `[Outro] Fade out` |
| `[Break]` | Пауза/затишье | `[Break] Drums only` |

### Структура типичной песни

```
[Intro]
[Verse 1]
[Chorus]
[Verse 2]
[Chorus]
[Bridge]
[Chorus]
[Outro]
```

### Продвинутые теги

```
[Pre-Chorus]     # Подготовка к припеву
[Post-Chorus]    # После припева
[Hook]           # Запоминающийся хук
[Instrumental]   # Инструментальная часть
[Buildup]        # Нарастание (для EDM)
```

---

## Примеры промптов

### Pop песня
```
Upbeat indie pop, bright acoustic guitar, catchy female vocals,
feel-good summer vibes, modern production, 115 BPM

[Verse 1]
Walking through the city lights
Everything feels so right tonight

[Chorus]
We're dancing under stars
Nothing can tear us apart
```

### Trap бит
```
Dark trap beat, heavy 808 bass, rolling hi-hats, ominous synth melody,
male autotuned vocals, aggressive energy, 145 BPM

[Intro]
4 bar 808 pattern

[Verse]
Coming up from nothing
Now we got everything

[Drop]
Bass drop with hard 808
```

### Lo-Fi для учёбы
```
Chill lo-fi hip-hop, soft piano chords, mellow guitar,
vinyl crackle texture, jazzy vibes, relaxing study music, 85 BPM

[Instrumental]
Soft piano loop with gentle drums
```

### Эпическая музыка
```
Epic cinematic orchestral, triumphant brass fanfare, sweeping strings,
powerful choir, building to emotional climax, heroic theme

[Intro]
Quiet strings, building anticipation

[Buildup]
Orchestra grows, drums enter

[Climax]
Full orchestra, choir, triumphant brass
```

---

## Лучшие практики

### Делай
- Будь конкретным в жанре и настроении
- Указывай инструменты явно
- Используй мета-теги для структуры
- Указывай BPM для контроля темпа
- Комбинируй жанры для уникальности

### Избегай
- Слишком общих описаний ("красивая музыка")
- Перегрузки информацией (>100 слов)
- Противоречивых инструкций
- Негативных формулировок

---

## Suno v4.5 (2025)

### Новые возможности:
- Поддержка 1200+ жанров
- Треки до 8 минут
- Улучшенная вокальная экспрессия
- Mashup жанров

### Suno Studio
- Генеративная аудио-станция
- Редактирование секций (inpainting)
- Расширение треков

---

## Частые ошибки

| Ошибка | Исправление |
|--------|-------------|
| "Make a song" | Укажи жанр, настроение, инструменты |
| "Happy music" | "Upbeat pop with bright synths, 120 BPM" |
| Слишком много слов | Держи промпт до 50-75 слов |
| Нет структуры | Используй [Verse], [Chorus] теги |

---

## Жанровые комбинации

Попробуй смешивать жанры:

- **Future Bass + Pop** = "future bass pop with euphoric synths"
- **Lo-Fi + Jazz** = "lo-fi hip-hop with jazz piano samples"
- **Rock + Electronic** = "electronic rock with distorted synths"
- **Folk + Trap** = "trap beat with acoustic folk guitar"
- **Classical + Metal** = "symphonic metal with orchestral strings"

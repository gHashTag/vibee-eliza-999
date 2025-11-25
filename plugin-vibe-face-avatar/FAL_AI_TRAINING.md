# 🎓 Интеграция тренировки LoRA с Fal.ai

## ✅ Что уже реализовано

### Frontend (DigitalBodyPage.tsx)
- ✅ **Поле "Model Name"** - пользователь вводит название модели
- ✅ **Автогенерация trigger word** из названия модели + случайные символы
- ✅ **Загрузка фото** (минимум 5)
- ✅ **API запрос** на `/api/train` с параметрами
- ✅ **Polling статуса** тренировки каждые 5 секунд
- ✅ **Отображение trigger word** после генерации
- ✅ **Кнопка "GO TO NEUROPHOTO"** после завершения

### Backend API Endpoints
- ✅ **POST `/api/train`** - запуск тренировки
  - Принимает: `telegram_id`, `model_name`, `trigger_word`, `photo_urls`, `gender`
  - Создает запись в БД со статусом `training`
  - Возвращает: `model_id`, `status`, `message`
  
- ✅ **GET `/api/train/status/:modelId`** - проверка статуса
  - Возвращает: `status`, `progress`, `trigger_word`, `model_url`

- ✅ **POST `/api/generate`** - генерация с LoRA
  - Автоматически использует `model_url` из БД
  - Добавляет `trigger_word` в промпт

---

## 🔧 Что нужно доделать для реальной тренировки

### 1. Интеграция с Fal.ai LoRA Trainer

**Fal.ai endpoint для тренировки:** `fal-ai/flux-lora-fast-training` или `fal-ai/lora-trainer`

#### Изменения в `src/api/server.ts`:

```typescript
// В POST /api/train после создания записи в БД:

// Импортировать fal-ai client
import { fal } from '@fal-ai/client';

// 2. Start real training via Fal.ai
const trainingResult = await fal.subscribe('fal-ai/flux-lora-fast-training', {
  input: {
    images_data_url: photo_urls.map(url => ({ url })),
    trigger_word,
    steps: 1000, // Количество шагов тренировки
    lora_rank: 16, // Ранг LoRA (меньше = быстрее, но хуже качество)
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === 'IN_PROGRESS') {
      // Обновить progress в БД
      const progress = update.logs?.[0]?.progress || 0;
      db.update(userModels)
        .set({ metadata: JSON.stringify({ progress }) })
        .where(eq(userModels.id, modelId));
    }
  },
});

// 3. Сохранить model_url после завершения
const loraUrl = trainingResult.diffusers_lora_file?.url;
await db.update(userModels)
  .set({
    model_url: loraUrl,
    status: 'completed',
    updated_at: new Date().toISOString(),
  })
  .where(eq(userModels.id, modelId));
```

### 2. Загрузка фото в облако

**Проблема:** Frontend передает локальные `File` объекты, нужно загрузить их в S3/Cloudinary/etc.

**Решение:** Добавить endpoint для upload

```typescript
// POST /api/upload-photos
app.post('/api/upload-photos', upload.array('photos', 20), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  
  const urls = await Promise.all(
    files.map(async (file) => {
      // Option 1: Upload to S3
      const url = await uploadToS3(file);
      
      // Option 2: Convert to base64 data URL (для Fal.ai)
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64}`;
      
      return dataUrl;
    })
  );
  
  res.json({ success: true, urls });
});
```

**Обновить Frontend:**

```typescript
// В startTraining()
const formData = new FormData();
files.forEach(file => formData.append('photos', file));

const uploadRes = await fetch('http://localhost:3001/api/upload-photos', {
  method: 'POST',
  body: formData,
});

const { urls: photoUrls } = await uploadRes.json();

// Затем начать тренировку с photoUrls
```

### 3. Настроить Fal.ai в .env

```bash
# .env
FAL_KEY=fal_xxxxxxxxxx
```

### 4. Обновить генерацию в FalProvider

**Уже реализовано!** FalProvider уже поддерживает динамические LoRA:

```typescript
// src/providers/falProvider.ts
if (options.modelUrl) {
  input.loras.push({
    path: options.modelUrl, // URL с Fal.ai training
    scale: 1.0,
  });
}
```

---

## 📊 Полный Flow

### 1. Пользователь загружает фото в Digital Body

1. Вводит **Model Name**: "My Portrait 2025"
2. Загружает **10+ фото**
3. Trigger word генерируется автоматически: `MY_PORTRAIT_2025_A3F2`

### 2. Frontend отправляет запрос

```javascript
POST /api/upload-photos
→ Возвращает: photo_urls (S3 или data URLs)

POST /api/train
{
  telegram_id: "123456",
  model_name: "My Portrait 2025",
  trigger_word: "MY_PORTRAIT_2025_A3F2",
  photo_urls: [...],
  gender: "person"
}
→ Возвращает: model_id
```

### 3. Backend запускает тренировку

```typescript
// Создает запись в БД: status = "training"
// Вызывает Fal.ai API для тренировки
// Polling Fal.ai для получения progress
```

### 4. Frontend проверяет статус

```javascript
Каждые 5 секунд:
GET /api/train/status/{model_id}

Получает:
{
  status: "training",
  progress: 75,
  trigger_word: "MY_PORTRAIT_2025_A3F2"
}
```

### 5. После завершения

```javascript
{
  status: "completed",
  progress: 100,
  model_url: "https://fal.ai/loras/abc123/model.safetensors",
  trigger_word: "MY_PORTRAIT_2025_A3F2"
}

→ Пользователь видит "TRAINING COMPLETE"
→ Кнопка "GO TO NEUROPHOTO" → переход к генерации
```

### 6. Генерация с LoRA в NeuroPhoto

```javascript
POST /api/generate
{
  prompt: "portrait photo",
  modelId: "abc-123", // ID из БД
  telegram_id: "123456"
}

Backend:
1. Находит модель в БД по modelId
2. Берет model_url
3. Автоматически добавляет trigger_word в промпт:
   "MY_PORTRAIT_2025_A3F2, portrait photo"
4. Вызывает FalProvider с loras: [{ path: model_url, scale: 1.0 }]
```

---

## 🎯 Экономный режим тренировки

Для минимальных затрат:

```typescript
{
  steps: 500,        // Вместо 1000 (дешевле, но хуже качество)
  lora_rank: 8,      // Вместо 16 (быстрее и дешевле)
  batch_size: 1,     // Минимальный батч
  learning_rate: 1e-4,
}
```

**Стоимость:**
- **Flux LoRA Training (Fal.ai)**: ~$0.50-$1.00 за модель
- **Быстрая тренировка (500 шагов)**: ~$0.30

---

## ✅ Чеклист для production

- [x] Frontend: Model Name input
- [x] Frontend: Trigger word generation
- [x] Frontend: API integration
- [x] Backend: /api/train endpoint
- [x] Backend: /api/train/status endpoint
- [x] Backend: Database schema
- [ ] **TODO:** Photo upload to S3/Cloudinary
- [ ] **TODO:** Real Fal.ai training integration
- [ ] **TODO:** Webhooks для статуса (вместо polling)
- [ ] **TODO:** Gender selection UI
- [ ] **TODO:** Progress визуализация в real-time

---

## 📚 Документация Fal.ai

**Тренировка:**
- https://fal.ai/models/fal-ai/flux-lora-fast-training

**Генерация с LoRA:**
- https://fal.ai/models/fal-ai/flux-lora/api ✅ (уже используем)

**Python Client:**
```bash
pip install fal-client
```

**Node.js Client:**
```bash
npm install @fal-ai/client
```

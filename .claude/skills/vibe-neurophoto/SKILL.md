---
name: vibe-neurophoto
agent_id: vibe-neurophoto
description: 🎨 Auto-activates for AI image generation, LoRA training, NeuroPhoto, and fal.ai/Replicate integration
keywords:
  - neurophoto
  - нейрофото
  - генерация изображений
  - image generation
  - lora
  - LoRA
  - обучение модели
  - fal.ai
  - replicate
  - fal
  - diffusion
  - flux
  - avatar
  - цифровое тело
model: sonnet
trigger_threshold: 0.8
auto_activate: true
---

# 🎨 Vibe NeuroPhoto Skill - AI Image Generation

Этот скилл **автоматически активируется** когда упоминается генерация изображений, LoRA, NeuroPhoto или AI модели.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `neurophoto`, `нейрофото`
- `генерация изображений`, `image generation`
- `lora`, `LoRA`, `обучение модели`
- `fal.ai`, `fal`, `replicate`
- `диффузия`, `diffusion`, `flux`
- `avatar`, `цифровое тело`
- `портрет`, `portrait`, `cyberpunk`
- `сгенерировать изображение`

### Примеры:
```
"Создай LoRA модель для обучения"
→ Авто-активируется vibe-neurophoto

"Настроить NeuroPhoto генерацию"
→ Авто-активируется vibe-neurophoto

"Интегрировать fal.ai API"
→ Авто-активируется vibe-neurophoto
```

## 🎯 Что Делает

1. **LoRA Training**: Обучение персональных моделей
2. **Image Generation**: Генерация через LoRA
3. **Service Integration**: fal.ai, Replicate API
4. **Digital Avatar**: Цифровое тело пользователя
5. **Prompt Engineering**: Оптимизация промптов
6. **Cost Calculation**: Расчет стоимости операций

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для креативности
trigger_threshold: 0.8     # Высокий порог активации (80%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при работе с AI изображениями
- **Координируется с**: vibe-coder, vibe-ai, vibe-services
- **Результат**: Готовая система генерации + обучения

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-neurophoto",
  description="Create LoRA training service",
  prompt="Build service for training personal LoRA models via fal.ai"
)
```

### Автоматически:
```
"Добавь генерацию через trigger word"
→ vibe-neurophoto активируется автоматически
```

## 🎨 Специализация

- ✅ **Fal.ai Integration**: flux-dev-lora-trainer, flux-schnell
- ✅ **Replicate API**: Модели и inference
- ✅ **LoRA Training**: Personal model creation
- ✅ **Image Generation**: With user-specific LoRA
- ✅ **Prompt Engineering**: Gender + trigger word + prompt
- ✅ **Cost Calculation**: Stars, tokens, pricing
- ✅ **Database Schema**: user_models, operations, assets
- ✅ **ElizaOS Services**: Service lifecycle + delayed initialization
- ✅ **ActionResult Pattern**: success обязателен

## 📚 Паттерны

### Service Pattern (Official ElizaOS):
```typescript
export class NeuroPhotoService extends Service {
  static serviceType = 'neuro-photo';
  capabilityDescription = 'AI image generation with LoRA models';

  private falClient: FalClient;
  private replicateClient: ReplicateClient;

  constructor(private runtime: IAgentRuntime) {
    super();
  }

  async initialize(): Promise<void> {
    const falKey = this.runtime.getSetting('FAL_KEY');
    if (!falKey) {
      throw new Error('FAL_KEY not configured');
    }

    this.falClient = new FalClient({ apiKey: falKey });
  }

  async generateImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
    // Combine trigger word + gender + user prompt
    const prompt = `${options.triggerWord}, ${options.gender}, ${options.userPrompt}`;

    try {
      // Call fal.ai or Replicate
      const result = await this.falClient.generate({
        prompt,
        model_url: options.modelUrl
      });

      this.runtime.logger.info('Image generated', { userId: options.userId });

      return {
        success: true,
        imageUrl: result.url,
        metadata: result.metadata
      };

    } catch (error) {
      this.runtime.logger.error('Image generation failed', { error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.falClient.disconnect();
  }
}
```

### Database Schema Pattern:
```typescript
// Drizzle Schema
export const userModelsTable = pgTable('user_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull(),
  modelName: varchar('model_name').notNull(),
  modelUrl: varchar('model_url').notNull(),
  triggerWord: varchar('trigger_word').notNull(),
  gender: varchar('gender').notNull(),
  status: varchar('status').notNull().default('training'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Repository
export class UserModelsRepository {
  async findActiveByTelegramId(telegramId: number): Promise<UserModel[]> {
    const db = this.runtime.databaseAdapter.db;
    return await db.select()
      .from(userModelsTable)
      .where(and(
        eq(userModelsTable.telegramId, telegramId),
        eq(userModelsTable.status, 'completed')
      ));
  }

  async create(modelData: CreateUserModelData): Promise<UserModel> {
    const db = this.runtime.databaseAdapter.db;
    const [result] = await db.insert(userModelsTable)
      .values(modelData)
      .returning();

    return result;
  }
}
```

### LoRA Training Flow:
```
1. User uploads 10-25 photos
2. System creates ZIP archive
3. Send to fal.ai LoRA trainer
4. Save model_url to database
5. Generate trigger_word (e.g., "NEURO_SAGE")
6. Status: training → completed
```

### Image Generation Flow:
```
1. Get user's active LoRA models
2. If none → "Train a model first"
3. If one → auto-select
4. If multiple → show selection keyboard
5. Generate with: trigger_word + gender + prompt
6. Save to assets table
7. Deduct balance (4⭐ per image)
```

**Автоматически делает AI генерацию изображений персональной и мощной!** 🎨🖼️

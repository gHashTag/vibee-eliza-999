# Fal.ai LoRA Models Integration

## Currently Integrated Models

### 1. Elephant LoRA (Real Fal.ai Model)
- **Name**: Elephant LoRA (Fal.ai)
- **URL**: `https://v3b.fal.media/files/elephant/YpfnIK7JlNO7vZTsGanfo_pytorch_lora_weights.safetensors`
- **Trigger Word**: `TOK`
- **Status**: ✅ Active in database
- **Usage**: Add `TOK` to your prompt to activate this LoRA

### 2. Cyberpunk Warrior LoRA (Test Model)
- **Name**: Cyberpunk Warrior LoRA
- **URL**: `fal-ai/flux-lora/cyberpunk-warrior-v1` (placeholder)
- **Trigger Word**: `NEURO_CYBER`
- **Status**: ✅ Active in database (for testing)

---

## Available Fal.ai LoRA Trainers

Based on Fal.ai documentation, the following pre-trained LoRA trainers are available:

### For Training Custom LoRAs:

1. **flux-lora-fast-training**
   - Fast training for styles, people, and subjects
   - Use case: Quick personalization

2. **flux-lora-portrait-trainer**
   - Optimized for portrait generation
   - Features: Bright highlights, excellent prompt following, high detail

3. **flux-kontext-trainer**
   - General LoRA trainer for FLUX.1 Kontext [dev]

4. **wan-trainer/t2v-14b**
   - Custom LoRAs for Wan-2.1 T2V 14B model

5. **qwen-image-trainer**
   - LoRA training for Qwen Image models

### Pre-trained Adaptations Available:

- Artistic styles (impressionism, cyberpunk, etc.)
- Specific artist styles
- Anime characters
- Celebrity portraits
- Objects/scenes (spaceships, fantasy landscapes)
- Brand identities
- Product-specific outputs

---

## How to Add More LoRA Models

### Option 1: Train Your Own LoRA

1. Use Fal.ai's training endpoints (e.g., `flux-lora-fast-training`)
2. Upload training images
3. Get the trained model URL (`.safetensors` file)
4. Add to database:

```bash
DATABASE_URL=sqlite bun run add-real-lora.ts
```

### Option 2: Use Pre-trained LoRA from Fal.ai

1. Browse Fal.ai model library
2. Copy the model URL (should end with `.safetensors`)
3. Determine the trigger word from model documentation
4. Add to database via SQL:

```sql
INSERT INTO user_models (
  telegram_id,
  model_name,
  model_url,
  trigger_word,
  status,
  is_active
) VALUES (
  123456,
  'Your Model Name',
  'https://v3b.fal.media/files/.../model.safetensors',
  'TRIGGER_WORD',
  'completed',
  true
);
```

---

## How LoRA Works in the Plugin

### 1. Database Storage
- Models stored in `user_models` table
- Each model has: `model_url`, `trigger_word`, `status`

### 2. API Loading
- Frontend fetches models via `/api/models?telegram_id=123456`
- Models grouped as "My Digital Bodies"

### 3. Hybrid Generation Logic
When generating an image:

1. If user has active LoRA models → Use first one
2. Auto-inject trigger word into prompt
3. Pass LoRA URL to Fal.ai provider via `loras` parameter
4. If no models → Fallback to Flux Schnell

### Example Fal.ai API Call with LoRA

```typescript
const input = {
  prompt: "TOK, majestic elephant in jungle", // trigger word + prompt
  image_size: { width: 768, height: 1365 },
  loras: [
    {
      path: "https://v3b.fal.media/files/elephant/YpfnIK7JlNO7vZTsGanfo_pytorch_lora_weights.safetensors",
      scale: 0.8 // LoRA strength (0.0 - 1.0)
    }
  ]
};

const result = await fal.subscribe("fal-ai/flux-lora", { input });
```

---

## Testing LoRA in Frontend

1. **Reload Frontend** (if dev server running):
   ```bash
   # Frontend auto-reloads when API returns new models
   ```

2. **Check Model Dropdown**:
   - Should see "🎭 My Digital Bodies" group
   - "Elephant LoRA (Fal.ai) (TOK)"
   - "Cyberpunk Warrior LoRA (NEURO_CYBER)"

3. **Generate Image**:
   - Select "Elephant LoRA (Fal.ai)"
   - Enter prompt: "majestic animal in sunset"
   - Trigger word "TOK" will be auto-added
   - Final prompt: "TOK, majestic animal in sunset"

---

## Next Steps

### Find More Pre-trained LoRAs:
1. Visit https://fal.ai/models
2. Search for "LoRA" models
3. Look for models with `.safetensors` URLs
4. Add them to the database

### Train Custom LoRA:
1. Use `fal-ai/flux-lora-fast-training` endpoint
2. Upload 10-20 images of subject
3. Get trained model URL
4. Add to database

---

## Troubleshooting

### Model not showing in dropdown
- Check API: `curl http://localhost:3001/api/models?telegram_id=123456`
- Verify `status='completed'` and `is_active=true`

### LoRA not working in generation
- Check that `model_url` is correct (`.safetensors` file)
- Verify trigger word is being injected (check logs)
- Check Fal.ai API response for errors

### Wrong trigger word
- Update in database: `UPDATE user_models SET trigger_word='NEW_WORD' WHERE id='...'`
- Trigger word should match what the LoRA was trained with

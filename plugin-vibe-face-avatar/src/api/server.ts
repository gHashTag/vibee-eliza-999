import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { db, userModels, DB_MODE } from '../db/client';
import { eq, and } from 'drizzle-orm';
import { loadInfisicalSecrets } from '../services/infisicalLoader';
await loadInfisicalSecrets();
const app = express();
const PORT = process.env.API_PORT || 3001;

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20 // Max 20 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

app.use(cors());
app.use(express.json({ limit: '200mb' }));

/**
 * GET /api/models
 * Get user models for a specific telegram_id
 * 
 * Query params:
 * - telegram_id: User's Telegram ID
 * - bot_name: Bot name (default: 'neuro_face_bot')
 */
app.get('/api/models', async (req, res) => {
  try {
    const telegramId = req.query.telegram_id as string;
    const botName = (req.query.bot_name as string) || 'neuro_face_bot';

    if (!telegramId) {
      return res.status(400).json({ error: 'telegram_id is required' });
    }

    const models = await (db as any)
      .select()
      .from(userModels)
      .where(
        and(
          eq(userModels.telegram_id, parseInt(telegramId, 10)),
          eq(userModels.bot_name, botName),
          eq(userModels.is_active, true),
          eq(userModels.status, 'completed')
        )
      )
      .orderBy(userModels.created_at);

    res.json({
      success: true,
      models: models.map((m: any) => ({
        id: m.id,
        name: m.model_name,
        trigger_word: m.trigger_word,
        url: m.model_url,
        gender: m.gender,
        created_at: m.created_at,
      })),
    });
  } catch (error) {
    console.error('[API] Error loading models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load models',
    });
  }
});

/**
 * POST /api/upload-photos
 * Upload photos and convert to base64 data URLs
 */
app.post('/api/upload-photos', upload.array('photos', 20), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const telegramId = req.body.telegram_id;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }

    if (!telegramId) {
      return res.status(400).json({ error: 'telegram_id is required' });
    }

    console.log(`[API] Uploading ${files.length} photos for user ${telegramId}`);

    // Convert to base64 data URLs (for Fal.ai compatibility)
    const photoUrls = files.map(file => {
      const base64 = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${base64}`;
    });

    console.log(`[API] Converted ${photoUrls.length} photos to data URLs`);

    res.json({
      success: true,
      photo_count: photoUrls.length,
      photo_urls: photoUrls,
    });

  } catch (error: any) {
    console.error('[API] Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Upload failed' 
    });
  }
});

/**
 * POST /api/generate
 * Generate an image using a specific model
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, modelId, telegram_id, num_images = 1, steps } = req.body;

    if (!prompt || !telegram_id) {
      return res.status(400).json({ error: 'prompt and telegram_id are required' });
    }

    console.log(`[API] Generating image for ${telegram_id} with model ${modelId || 'default'}`);

    let modelUrl: string | undefined;

    // If a specific model ID is provided (and it's not a standard one like 'flux-schnell'), look it up
    if (modelId && modelId !== 'flux-schnell' && modelId !== 'sdxl') {
       // Use standard select instead of query API to avoid union type issues
       const models = await (db as any)
         .select()
         .from(userModels)
         .where(eq(userModels.id, modelId))
         .limit(1);
       
       if (models.length > 0) {
         modelUrl = models[0].model_url;
         console.log(`[API] Found user model URL: ${modelUrl}`);
       }
    }

    // Import dynamically to avoid circular deps if any (though imports are usually fine)
    const { generateNeuroPhotoHybrid } = await import('../services/generateNeuroPhotoHybrid');

    const result = await generateNeuroPhotoHybrid(
      prompt,
      modelUrl,
      num_images,
      telegram_id.toString(),
      {}, // context
      'neuro_face_bot'
    );

    res.json(result);

  } catch (error) {
    console.error('[API] Error generating image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate image',
    });
  }
});

/**
 * POST /api/train
 * Start training a new LoRA model
 */
app.post('/api/train', async (req, res) => {
  try {
    const { telegram_id, model_name, trigger_word, photo_urls, gender = 'person' } = req.body;

    if (!telegram_id || !model_name || !trigger_word || !photo_urls || photo_urls.length < 5) {
      return res.status(400).json({ 
        error: 'telegram_id, model_name, trigger_word, and at least 5 photo_urls are required' 
      });
    }

    console.log(`[API] Starting training for model: ${model_name} (trigger: ${trigger_word})`);

    // 1. Create model record in database with "training" status
    const modelId = crypto.randomUUID();
    const now = new Date().toISOString();

    await (db as any).insert(userModels).values({
      id: modelId,
      telegram_id: parseInt(telegram_id, 10),
      bot_name: 'neuro_face_bot',
      model_name,
      model_url: '', // Will be updated after training
      trigger_word,
      gender,
      status: 'training',
      is_active: true,
      metadata: JSON.stringify({ photo_count: photo_urls.length }),
      created_at: now,
      updated_at: now,
    });

    // 2. Start real Fal.ai training (async - runs in background)
    console.log(`[API] Starting Fal.ai training for ${modelId}...`);
    
    // Import training service
    const { startFalTraining } = await import('../services/falTrainingService');
    
    // Start training asynchronously (doesn't block response)
    startFalTraining({
      modelId,
      trigger_word,
      photo_urls,
      steps: 500, // Economic mode - can be configured later
      lora_rank: 16,
    }).catch(error => {
      console.error('[API] Training background error:', error);
    });

    res.json({
      success: true,
      model_id: modelId,
      status: 'training',
      message: 'Training started successfully',
    });

  } catch (error) {
    console.error('[API] Error starting training:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start training',
    });
  }
});

/**
 * GET /api/train/status/:modelId
 * Check training status for a model
 */
app.get('/api/train/status/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const models = await (db as any)
      .select()
      .from(userModels)
      .where(eq(userModels.id, modelId))
      .limit(1);

    if (models.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const model = models[0];
    
    res.json({
      success: true,
      model_id: model.id,
      status: model.status,
      model_name: model.model_name,
      trigger_word: model.trigger_word,
      model_url: model.model_url,
      progress: model.status === 'completed' ? 100 : model.status === 'training' ? 50 : 0,
    });

  } catch (error) {
    console.error('[API] Error checking training status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check training status',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: DB_MODE });
});

// Start server
if (require.main === module) {
  // Initialize providers from environment variables
  import('../services/providers').then(({ initializeProvidersFromEnv }) => {
    initializeProvidersFromEnv();
    
    app.listen(PORT, () => {
      console.log(`[API Server] Running on http://localhost:${PORT}`);
      console.log(`[API Server] Database mode: ${DB_MODE}`);
    });
  });
}

export default app;

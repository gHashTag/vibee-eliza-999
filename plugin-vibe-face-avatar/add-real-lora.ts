// Add real Fal.ai LoRA model to database
import { db, userModels } from './src/db/client';

console.log('=== Adding Real Fal.ai LoRA Model ===\n');

async function addRealLoRA() {
  try {
    // Add the elephant LoRA model from Fal.ai
    const [model] = await db.insert(userModels).values({
      telegram_id: 123456,
      bot_name: 'neuro_face_bot',
      model_name: 'Elephant LoRA (Fal.ai)',
      model_url: 'https://v3b.fal.media/files/elephant/YpfnIK7JlNO7vZTsGanfo_pytorch_lora_weights.safetensors',
      trigger_word: 'TOK',
      gender: 'person',
      status: 'completed',
      is_active: true,
      metadata: {
        description: 'Pre-trained elephant LoRA from Fal.ai',
        provider: 'fal-ai',
        source: 'https://fal.ai/models/fal-ai/flux-lora/api',
        real_model: true,
      },
    }).returning();

    console.log('✅ Real LoRA model added:');
    console.log(JSON.stringify(model, null, 2));

    // List all models
    const allModels = await db.select().from(userModels);
    console.log(`\n✅ Total models in database: ${allModels.length}`);
    allModels.forEach(m => {
      console.log(`  - ${m.model_name} (${m.trigger_word}) - ${m.model_url}`);
    });
    
    console.log('\n=== Done ===');
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

addRealLoRA();

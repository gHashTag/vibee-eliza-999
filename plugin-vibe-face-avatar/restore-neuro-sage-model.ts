// Restore NEURO_SAGE model to database
import { db, userModels } from './src/db/client';
import { eq, and } from 'drizzle-orm';

console.log('=== Restoring NEURO_SAGE Model ===\n');

async function restoreNeuroSageModel() {
  try {
    // Check if NEURO_SAGE model already exists for this user
    const existingModel = await db.select().from(userModels).where(
      and(
        eq(userModels.telegram_id, 144022504),
        eq(userModels.trigger_word, 'NEURO_SAGE')
      )
    );

    if (existingModel.length > 0) {
      console.log('✅ NEURO_SAGE model already exists for user 144022504. Skipping insert.');
      console.log('Existing model:');
      console.log(JSON.stringify(existingModel[0], null, 2));
    } else {
      // Insert the NEURO_SAGE model
      const [model] = await db.insert(userModels).values({
        telegram_id: 144022504,
        bot_name: 'neuro_face_bot',
        model_name: 'NEURO_SAGE Model',
        model_url: 'https://v3b.fal.media/files/b/elephant/YpfnIK7JlNO7vZTsGanfo_pytorch_lora_weights.safetensors',
        trigger_word: 'NEURO_SAGE',
        gender: 'person',
        status: 'completed',
        is_active: true,
        metadata: {
          training_id: 'd04da9f2-01ee-4ef4-9493-40084d85ab30',
          steps: 1500,
          learning_rate: 0.0002,
          trainer: 'fal-ai/flux-lora-portrait-trainer',
          restored_manually: true,
          description: 'Manually restored NEURO_SAGE model from Fal.ai training history',
        },
      }).returning();

      console.log('✅ NEURO_SAGE model restored successfully:');
      console.log(JSON.stringify(model, null, 2));
    }

    // Query all models for the user
    const userModelsResult = await db.select().from(userModels).where(eq(userModels.telegram_id, 144022504));
    console.log(`\n✅ Total models for user 144022504: ${userModelsResult.length}`);
    userModelsResult.forEach(m => {
      console.log(`  - ${m.model_name} (${m.trigger_word}) - Status: ${m.status}`);
    });
    
    console.log('\n=== Restoration Complete ===');
    console.log('You can now use /neurophoto command with trigger word NEURO_SAGE');
  } catch (error) {
    console.error('❌ Restoration failed:', error);
    process.exit(1);
  }
}

restoreNeuroSageModel();
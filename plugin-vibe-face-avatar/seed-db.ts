// Seed script: Add test LoRA model to database
import { db, userModels } from './src/db/client';

console.log('=== Seeding Test LoRA Model ===\n');

async function seedDatabase() {
  try {
    // Add a test LoRA model for user 123456
    const [model] = await db.insert(userModels).values({
      telegram_id: 123456,
      bot_name: 'neuro_face_bot',
      model_name: 'Cyberpunk Warrior LoRA',
      model_url: 'fal-ai/flux-lora/cyberpunk-warrior-v1',
      trigger_word: 'NEURO_CYBER',
      gender: 'male',
      status: 'completed',
      is_active: true,
      metadata: {
        description: 'Cyberpunk style character model',
        training_date: '2025-11-20',
        test_model: true,
      },
    }).returning();

    console.log('✅ Test model added successfully:');
    console.log(JSON.stringify(model, null, 2));

    // Verify it was added
    const allModels = await db.select().from(userModels);
    console.log(`\n✅ Total models in database: ${allModels.length}`);
    
    console.log('\n=== Seed Complete ===');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();

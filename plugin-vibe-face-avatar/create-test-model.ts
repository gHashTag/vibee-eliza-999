// Quick script to create test model
import { db, userModels } from './src/db/client';

async function createTestModel() {
  try {
    console.log('🔨 Creating test models...\n');

    // Test model 1: For UUID-based user (web interface)
    const model1 = await db.insert(userModels).values({
      entity_id: 'aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf', // Example UUID from generateImageAction
      bot_name: 'neuro_face_bot',
      model_name: 'Demo User Model',
      model_url: 'fal-ai/flux-lora/demo-model-v1',
      trigger_word: 'NEURO_DEMO',
      gender: 'person',
      status: 'completed',
      is_active: true,
      metadata: { description: 'Test model for demo', test_model: true },
    }).returning();

    console.log('✅ Test model 1 created:', model1[0].id);

    // Test model 2: For Telegram user
    const model2 = await db.insert(userModels).values({
      telegram_id: 999888777,
      bot_name: 'neuro_face_bot',
      model_name: 'Demo Telegram Model',
      model_url: 'fal-ai/flux-lora/demo-telegram-v1',
      trigger_word: 'NEURO_TELEGRAM',
      gender: 'male',
      status: 'completed',
      is_active: true,
      metadata: { description: 'Test model for Telegram', test_model: true },
    }).returning();

    console.log('✅ Test model 2 created:', model2[0].id);

    // Verify
    const allModels = await db.select().from(userModels);
    console.log(`\n📦 Total models in database: ${allModels.length}`);

    for (const model of allModels) {
      console.log(`- ${model.model_name} (status: ${model.status}, active: ${model.is_active})`);
    }

    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestModel();

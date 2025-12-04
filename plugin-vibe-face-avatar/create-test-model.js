// Quick script to create test model
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema.js';

const DATABASE_URL = "postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const queryClient = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });
const db = drizzle(queryClient, { schema });

async function createTestModel() {
  try {
    console.log('🔨 Creating test models...\n');

    // Test model 1: For UUID-based user (web interface)
    const model1 = await db.insert(schema.userModels).values({
      entity_id: 'aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf', // Example UUID
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
    const model2 = await db.insert(schema.userModels).values({
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
    const allModels = await db.select().from(schema.userModels);
    console.log(`\n📦 Total models in database: ${allModels.length}`);

    for (const model of allModels) {
      console.log(`- ${model.model_name} (status: ${model.status}, active: ${model.is_active})`);
    }

    await queryClient.end();
    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await queryClient.end();
    process.exit(1);
  }
}

createTestModel();

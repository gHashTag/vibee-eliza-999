// Test script to verify SQLite database works
import { db, userModels, DB_MODE } from './src/db/client';
import { eq } from 'drizzle-orm';

console.log('=== Avatar Face DB Test ===');
console.log('Database Mode:', DB_MODE);

async function testDatabase() {
  try {
    // Test 1: Insert a test model
    console.log('\n1. Inserting test model...');
    const [inserted] = await db.insert(userModels).values({
      telegram_id: 123456,
      bot_name: 'neuro_face_bot',
      model_name: 'Test LoRA v1',
      model_url: 'fal-ai/flux-lora/test-model',
      trigger_word: 'NEURO_TEST',
      status: 'completed',
      is_active: true,
      metadata: { test: true },
    }).returning();
    
    console.log('✅ Inserted:', inserted);

    // Test 2: Query all models
    console.log('\n2. Querying all models...');
    const allModels = await db.select().from(userModels);
    console.log(`✅ Found ${allModels.length} models`);
    allModels.forEach(m => console.log(`  - ${m.model_name} (${m.status})`));

    // Test 3: Query active models for user
    console.log('\n3. Querying active models for user 123456...');
    const activeModels = await db.select().from(userModels).where(
      eq(userModels.telegram_id, 123456)
    );
    console.log(`✅ Found ${activeModels.length} active models`);

    // Test 4: Cleanup
    console.log('\n4. Cleaning up test data...');
    await db.delete(userModels).where(eq(userModels.telegram_id, 123456));
    console.log('✅ Cleanup done');

    console.log('\n=== All tests passed! ===');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDatabase();

import { getUserModelsTask } from './src/services/modelLoader';
import { runTaskEither } from './src/utils/functional/result';

async function testModelLookup() {
  console.log('🔍 Testing model lookup...\n');

  // Test 1: Lookup by entity_id (web user)
  console.log('Test 1: Looking for entity_id = aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf');
  const models1 = await runTaskEither(getUserModelsTask('aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf', 'neuro_face_bot'));
  
  if (models1.isRight()) {
    console.log(`✅ Found ${models1.value.length} models`);
    models1.value.forEach(m => console.log(`  - ${m.model_name} (trigger: ${m.trigger_word})`));
  } else {
    console.log('❌ Error:', models1.value);
  }

  console.log('\n---\n');

  // Test 2: Lookup by telegram_id (Telegram user)
  console.log('Test 2: Looking for telegram_id = 999888777');
  const models2 = await runTaskEither(getUserModelsTask(999888777, 'neuro_face_bot'));
  
  if (models2.isRight()) {
    console.log(`✅ Found ${models2.value.length} models`);
    models2.value.forEach(m => console.log(`  - ${m.model_name} (trigger: ${m.trigger_word})`));
  } else {
    console.log('❌ Error:', models2.value);
  }

  console.log('\n---\n');

  // Test 3: Lookup by default telegram ID from seed-db.ts
  console.log('Test 3: Looking for telegram_id = 123456');
  const models3 = await runTaskEither(getUserModelsTask(123456, 'neuro_face_bot'));
  
  if (models3.isRight()) {
    console.log(`✅ Found ${models3.value.length} models`);
    models3.value.forEach(m => console.log(`  - ${m.model_name} (trigger: ${m.trigger_word})`));
  } else {
    console.log('❌ Error:', models3.value);
  }

  console.log('\n✅ Tests complete!');
}

testModelLookup();

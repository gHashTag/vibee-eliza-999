import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = "postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const queryClient = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });

async function createUniversalModel() {
  try {
    console.log('🔨 Creating universal test model...\n');

    // Create a model that will be found by default UUID patterns
    const models = [
      'c2a4d44f-3e12-00f4-acd8-88bb3ca64e35', // From neuroPhoto.json character ID
      'aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf', // Common test UUID
      'aabbccdd-eeff-1234-5678-123456789abc', // Generic test UUID
    ];

    for (let i = 0; i < models.length; i++) {
      const entityId = models[i];
      const modelName = `Universal Test Model ${i + 1}`;
      const trigger = `NEURO_TEST${i + 1}`;

      // Delete existing model if any
      await queryClient.unsafe(
        `DELETE FROM user_models WHERE entity_id = $1 OR telegram_id = $2`,
        [entityId, 1000000000 + i]
      );

      // Insert new model
      const result = await queryClient.unsafe(`
        INSERT INTO user_models (
          entity_id,
          bot_name,
          model_name,
          model_url,
          trigger_word,
          gender,
          status,
          is_active,
          metadata
        ) VALUES (
          $1,
          'neuro_face_bot',
          $2,
          'fal-ai/flux-lora/universal-test-v1',
          $3,
          'person',
          'completed',
          true,
          '{"test": true, "universal": true}'
        ) RETURNING id, entity_id, model_name
      `, [entityId, modelName, trigger]);

      console.log(`✅ Created: ${modelName}`);
      console.log(`   ID: ${entityId}`);
      console.log(`   Trigger: ${trigger}\n`);
    }

    // List all models
    console.log('📦 All models in database:');
    const allModels = await queryClient.unsafe(`
      SELECT
        CASE
          WHEN entity_id IS NOT NULL THEN 'entity: ' || entity_id
          ELSE 'telegram: ' || telegram_id::text
        END as identifier,
        model_name,
        trigger_word,
        status,
        is_active
      FROM user_models
      WHERE bot_name = 'neuro_face_bot'
      ORDER BY created_at DESC
    `);

    allModels.forEach((model, idx) => {
      console.log(`${idx + 1}. [${model.identifier}] ${model.model_name} (${model.trigger_word})`);
    });

    await queryClient.end();
    console.log('\n✅ Universal model created!');
    console.log('\n📝 Test commands:');
    console.log('1. Try generating with entity_id: c2a4d44f-3e12-00f4-acd8-88bb3ca64e35');
    console.log('2. Or with telegram_id: 1000000000');
    console.log('3. All models are ready for testing!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await queryClient.end();
    process.exit(1);
  }
}

createUniversalModel();

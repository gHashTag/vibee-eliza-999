import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = "postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const queryClient = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });

async function verify() {
  try {
    console.log('🔍 Verifying models in database...\n');
    
    const result = await queryClient.unsafe(`
      SELECT 
        id,
        telegram_id,
        entity_id,
        bot_name,
        model_name,
        trigger_word,
        status,
        is_active
      FROM user_models 
      WHERE bot_name = 'neuro_face_bot'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📦 Found ${result.length} models:`);
    console.log(JSON.stringify(result, null, 2));
    
    await queryClient.end();
    console.log('\n✅ Verified!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await queryClient.end();
    process.exit(1);
  }
}

verify();

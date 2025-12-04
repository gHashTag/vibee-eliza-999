import { db, userModels } from './src/db/client';

async function checkDatabase() {
  try {
    console.log('🔍 Проверяем подключение к базе данных...');
    
    // Check database connection
    const result = await db.execute('SELECT current_database(), current_user');
    console.log('✅ Database connected:', result);
    
    // Check table exists
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user_model%'
    `);
    console.log('📊 Tables found:', tables);
    
    // Check if table has any data
    const models = await db.select().from(userModels).limit(1);
    console.log('📦 Current models count:', models.length);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();

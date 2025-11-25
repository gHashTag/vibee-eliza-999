#!/usr/bin/env node

// Скрипт для копирования модели из SQLite в PostgreSQL базу агента

const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');

// Параметры подключения
const PG_CONFIG = {
  host: '127.0.0.1',
  port: 5432,
  database: 'eliza',
  user: 'postgres',
  password: 'postgres',
};

async function copyModel() {
  console.log('🔄 Начинаем копирование модели...');

  // 1. Читаем модель из SQLite
  const sqliteDb = new sqlite3.Database('/Users/playra/vibee-agent/data/avatar-face.db');

  sqliteDb.get(
    "SELECT * FROM user_models WHERE telegram_id = 1189369188 AND status = 'completed'",
    async (err, row) => {
      if (err) {
        console.error('❌ Ошибка чтения SQLite:', err);
        process.exit(1);
      }

      if (!row) {
        console.error('❌ Модель не найдена в SQLite');
        process.exit(1);
      }

      console.log('✅ Найдена модель в SQLite:', row.model_name);

      // 2. Подключаемся к PostgreSQL
      const client = new Client(PG_CONFIG);

      try {
        await client.connect();
        console.log('✅ Подключились к PostgreSQL');

        // 3. Проверяем существует ли таблица
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'user_models'
          );
        `);

        if (!tableExists.rows[0].exists) {
          console.log('⚠️ Таблица user_models не существует, создаем...');
          // Здесь можно добавить создание таблицы
          console.log('❌ Нужно создать таблицу вручную');
          process.exit(1);
        }

        // 4. Добавляем модель
        const insertQuery = `
          INSERT INTO user_models (
            id,
            telegram_id,
            bot_name,
            model_name,
            model_url,
            trigger_word,
            gender,
            status,
            training_model,
            is_active,
            created_at,
            updated_at
          ) VALUES (
            $1::uuid,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11::timestamp,
            $12::timestamp
          )
          ON CONFLICT (id) DO UPDATE SET
            telegram_id = EXCLUDED.telegram_id,
            bot_name = EXCLUDED.bot_name,
            model_name = EXCLUDED.model_name,
            model_url = EXCLUDED.model_url,
            trigger_word = EXCLUDED.trigger_word,
            gender = EXCLUDED.gender,
            status = EXCLUDED.status,
            training_model = EXCLUDED.training_model,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();
        `;

        const values = [
          row.id,
          row.telegram_id,
          row.bot_name,
          row.model_name,
          row.model_url,
          row.trigger_word,
          row.gender,
          row.status,
          row.training_model,
          row.is_active,
          row.created_at,
          row.completed_at,
        ];

        await client.query(insertQuery, values);
        console.log('✅ Модель добавлена в PostgreSQL!');

        // 5. Проверяем
        const check = await client.query(
          'SELECT * FROM user_models WHERE telegram_id = $1',
          [row.telegram_id]
        );

        console.log('📊 Количество моделей в PostgreSQL:', check.rows.length);
        check.rows.forEach((model, idx) => {
          console.log(`  ${idx + 1}. ${model.model_name} (${model.status})`);
        });

        process.exit(0);

      } catch (error) {
        console.error('❌ Ошибка PostgreSQL:', error);
        process.exit(1);
      } finally {
        await client.end();
        sqliteDb.close();
      }
    }
  );
}

copyModel();

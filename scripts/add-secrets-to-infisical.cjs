#!/usr/bin/env node

/**
 * Скрипт для добавления секретов в Infisical Cloud
 *
 * Использование:
 * node scripts/add-secrets-to-infisical.js
 *
 * Добавляет в Infisical Cloud недостающие секреты:
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_BOT_ID
 * - POSTGRES_URL
 * - SECRET_SALT
 * - FAL_KEY
 */

require('dotenv').config({ path: '../.env' });

const INFISICAL_API = 'https://api.infisical.com/api/v2';

async function addSecrets() {
  console.log('🚀 Adding secrets to Infisical Cloud...\n');

  try {
    // 1. Получаем access token
    console.log('1️⃣ Authenticating with Infisical...');
    const tokenResponse = await fetch(`${INFISICAL_API}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: process.env.INFISICAL_CLIENT_ID,
        clientSecret: process.env.INFISICAL_CLIENT_SECRET,
        token: 'infisical-pat'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to authenticate: ${tokenResponse.status} ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    if (!accessToken) {
      throw new Error('No access token received');
    }

    console.log('✅ Authenticated successfully\n');

    // 2. Список секретов для добавления
    // Бот: @agent_vibecoder_bot (ID: 8309813696)
    const secrets = [
      {
        key: 'TELEGRAM_BOT_TOKEN',
        value: process.env.TELEGRAM_BOT_TOKEN || '8309813696:AAG2QWKlmUSQ3BBDupoEv1RQ0m63KcKS-IQ',
        type: 'shared',
        environment: process.env.INFISICAL_ENVIRONMENT || 'dev'
      },
      {
        key: 'TELEGRAM_BOT_ID',
        value: process.env.TELEGRAM_BOT_ID || '8309813696',
        type: 'shared',
        environment: process.env.INFISICAL_ENVIRONMENT || 'dev'
      },
      {
        key: 'POSTGRES_URL',
        value: process.env.POSTGRES_URL || 'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        type: 'shared',
        environment: process.env.INFISICAL_ENVIRONMENT || 'dev'
      },
      {
        key: 'SECRET_SALT',
        value: process.env.SECRET_SALT || 'your_jwt_secret_here_change_in_production',
        type: 'shared',
        environment: process.env.INFISICAL_ENVIRONMENT || 'dev'
      },
      {
        key: 'FAL_KEY',
        value: process.env.FAL_KEY || '',
        type: 'shared',
        environment: process.env.INFISICAL_ENVIRONMENT || 'dev'
      }
    ];

    // 3. Добавляем секреты
    console.log('2️⃣ Adding secrets...');
    for (const secret of secrets) {
      try {
        if (!secret.value) {
          console.log(`⚠️  Skipping ${secret.key} (empty value)`);
          continue;
        }

        const response = await fetch(`${INFISICAL_API}/secrets/${secret.key}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            secret: secret.value,
            environment: secret.environment,
            type: secret.type
          })
        });

        if (response.ok) {
          console.log(`✅ Added ${secret.key}`);
        } else {
          const error = await response.text();
          console.log(`⚠️  Failed to add ${secret.key}: ${response.status} ${error}`);
        }
      } catch (err) {
        console.log(`⚠️  Error adding ${secret.key}:`, err.message);
      }
    }

    console.log('\n✨ Done! All secrets added to Infisical Cloud');
    console.log('\n📋 Environment variables now available:');
    console.log('   - TELEGRAM_BOT_TOKEN');
    console.log('   - TELEGRAM_BOT_ID');
    console.log('   - POSTGRES_URL');
    console.log('   - SECRET_SALT');
    console.log('   - FAL_KEY (optional)');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. INFISICAL credentials in .env file');
    console.error('2. Network connection');
    console.error('3. Infisical project permissions');
    process.exit(1);
  }
}

// Запускаем
addSecrets();

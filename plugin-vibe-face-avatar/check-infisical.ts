#!/usr/bin/env bun
import { loadInfisicalSecrets } from './src/services/infisicalLoader';

async function checkSecrets() {
  console.log('\n🔐 Checking Infisical secrets...\n');
  
  // Load secrets
  await loadInfisicalSecrets();
  
  // Check if keys are loaded
  const keys = ['FAL_KEY', 'REPLICATE_API_KEY', 'OPENAI_API_KEY'];
  
  console.log('📋 Loaded secrets:');
  keys.forEach(key => {
    const value = process.env[key];
    if (value) {
      console.log(`✅ ${key}: ${value.substring(0, 10)}...${value.substring(value.length - 4)}`);
    } else {
      console.log(`❌ ${key}: NOT FOUND`);
    }
  });
  
  console.log('\n✅ Infisical loaded successfully!\n');
}

checkSecrets().catch(console.error);

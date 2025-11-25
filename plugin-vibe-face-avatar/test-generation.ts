import { fetch } from 'bun';

const API_URL = 'http://localhost:3001/api';
const TELEGRAM_ID = '123456';

async function testGeneration() {
  console.log('🚀 Starting Generation Test...');

  // 1. Fetch available models
  console.log('\n1. Fetching user models...');
  const modelsRes = await fetch(`${API_URL}/models?telegram_id=${TELEGRAM_ID}`);
  const modelsData = await modelsRes.json();

  if (!modelsData.success || modelsData.models.length === 0) {
    console.error('❌ No models found for user. Please run add-real-lora.ts first.');
    return;
  }

  console.log(`✅ Found ${modelsData.models.length} models.`);
  const elephantModel = modelsData.models.find((m: any) => m.name.includes('Elephant') || m.trigger_word === 'NEURO_SAGE');
  
  if (!elephantModel) {
    console.error('❌ Elephant model not found.');
    return;
  }

  console.log(`🐘 Using model: ${elephantModel.name} (${elephantModel.id})`);

  // 2. Generate image
  console.log('\n2. Generating image (Economical Mode)...');
  const generatePayload = {
    prompt: "A cyberpunk elephant walking through neon rainy streets",
    modelId: elephantModel.id,
    telegram_id: TELEGRAM_ID,
    num_images: 1,
    steps: 4 // Economical setting for Flux Schnell
  };

  console.log('Payload:', JSON.stringify(generatePayload, null, 2));

  const startTime = Date.now();
  const genRes = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(generatePayload)
  });

  const genData = await genRes.json();
  const duration = (Date.now() - startTime) / 1000;

  if (genData.success) {
    console.log(`\n✅ Generation Successful in ${duration.toFixed(2)}s!`);
    console.log('📸 Image URL:', genData.imageUrls[0]);
    console.log('📝 Metadata:', genData.metadata);
  } else {
    console.error('\n❌ Generation Failed:', genData.error);
  }
}

testGeneration().catch(console.error);

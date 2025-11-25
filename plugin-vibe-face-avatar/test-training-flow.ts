import { fetch } from 'bun';

const API_URL = 'http://localhost:3001/api';

async function testTrainingFlow() {
  console.log('🎓 Testing Full Training Flow\n');

  // 1. Start training
  console.log('1. Starting training...');
  const trainPayload = {
    telegram_id: '123456',
    model_name: 'Test Model 2025',
    trigger_word: 'TEST_MODEL_2025_XY12',
    photo_urls: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg',
      'https://example.com/photo4.jpg',
      'https://example.com/photo5.jpg',
    ],
    gender: 'person',
  };

  const trainRes = await fetch(`${API_URL}/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trainPayload),
  });

  const trainData = await trainRes.json();
  console.log('✅ Training started:', trainData);

  if (!trainData.success) {
    console.error('❌ Training failed to start');
    return;
  }

  const modelId = trainData.model_id;
  console.log(`📝 Model ID: ${modelId}\n`);

  // 2. Poll for status
  console.log('2. Polling for training status...');
  let status = 'training';
  let attempts = 0;
  const maxAttempts = 10;

  while (status === 'training' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const statusRes = await fetch(`${API_URL}/train/status/${modelId}`);
    const statusData = await statusRes.json();
    
    console.log(`   [${attempts + 1}/${maxAttempts}] Status: ${statusData.status} (${statusData.progress}%)`);
    
    status = statusData.status;
    attempts++;

    if (status === 'completed') {
      console.log('\n✅ Training completed!');
      console.log('   Model URL:', statusData.model_url);
      console.log('   Trigger Word:', statusData.trigger_word);
      break;
    } else if (status === 'failed') {
      console.error('\n❌ Training failed');
      break;
    }
  }

  // 3. Check if model appears in /api/models
  console.log('\n3. Checking if model is available...');
  const modelsRes = await fetch(`${API_URL}/models?telegram_id=123456`);
  const modelsData = await modelsRes.json();

  const trainedModel = modelsData.models.find((m: any) => m.id === modelId);
  
  if (trainedModel) {
    console.log('✅ Model found in /api/models:');
    console.log('   Name:', trainedModel.name);
    console.log('   Trigger:', trainedModel.trigger_word);
    console.log('   URL:', trainedModel.url);
  } else {
    console.log('❌ Model not found in /api/models');
  }

  console.log('\n🎉 Test Complete!');
}

testTrainingFlow().catch(console.error);

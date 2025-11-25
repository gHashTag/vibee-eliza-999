#!/usr/bin/env bun

// Test photo upload endpoint
// Usage: bun run test-upload.ts

import { readFileSync } from 'fs';
import { join } from 'path';

async function testUpload() {
  console.log('🧪 Testing Photo Upload Endpoint\n');

  // Create 3 test image buffers (1x1 pixel PNG)
  const testImages = [
    {
      name: 'test1.png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
      mimetype: 'image/png'
    },
    {
      name: 'test2.png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
      mimetype: 'image/png'
    },
    {
      name: 'test3.png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
      mimetype: 'image/png'
    },
  ];

  // Create FormData
  const formData = new FormData();
  
  testImages.forEach((img, i) => {
    const blob = new Blob([img.buffer], { type: img.mimetype });
    formData.append('photos', blob, img.name);
  });
  
  formData.append('telegram_id', '123456');

  console.log(`📤 Uploading ${testImages.length} test photos...`);

  try {
    const response = await fetch('http://localhost:3001/api/upload-photos', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const data = await response.json();
    
    console.log('✅ Upload successful!');
    console.log(`   Photo count: ${data.photo_count}`);
    console.log(`   URLs generated: ${data.photo_urls.length}`);
    console.log(`   First URL preview: ${data.photo_urls[0].substring(0, 50)}...`);
    
    // Verify it's base64
    if (data.photo_urls[0].startsWith('data:image/')) {
      console.log('✅ Photos converted to data URLs correctly');
    } else {
      console.log('❌ Photos not in data URL format');
    }

  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

testUpload().then(() => {
  console.log('\n🎉 Test Complete!');
});

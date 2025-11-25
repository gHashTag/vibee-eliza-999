#!/usr/bin/env bun
/**
 * API Integration Test Script
 * Тестирует все API эндпоинты Avatar Face Plugin
 */

const API_BASE = 'http://localhost:3001';
const TEST_TELEGRAM_ID = '123456';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message?: string;
  data?: any;
}

const results: TestResult[] = [];

async function testEndpoint(name: string, url: string, options?: RequestInit): Promise<TestResult> {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   URL: ${url}`);

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ PASS: ${response.status}`);
      return {
        name,
        status: 'PASS',
        message: `Status ${response.status}`,
        data
      };
    } else {
      console.log(`   ❌ FAIL: ${response.status}`);
      return {
        name,
        status: 'FAIL',
        message: `Status ${response.status}: ${JSON.stringify(data)}`
      };
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error instanceof Error ? error.message : String(error)}`);
    return {
      name,
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runTests() {
  console.log('━'.repeat(80));
  console.log('🚀 AVATAR FACE PLUGIN - API INTEGRATION TESTS');
  console.log('━'.repeat(80));

  // Test 1: GET /api/models
  results.push(await testEndpoint(
    'GET /api/models - Get user models',
    `${API_BASE}/api/models?telegram_id=${TEST_TELEGRAM_ID}`
  ));

  // Test 2: GET /api/models with bot_name
  results.push(await testEndpoint(
    'GET /api/models - With bot_name filter',
    `${API_BASE}/api/models?telegram_id=${TEST_TELEGRAM_ID}&bot_name=neuro_face_bot`
  ));

  // Test 3: GET /api/models without telegram_id (should fail)
  results.push(await testEndpoint(
    'GET /api/models - Missing telegram_id (expect error)',
    `${API_BASE}/api/models`
  ));

  // Test 4: POST /api/generate - Generate image (requires model_id)
  results.push(await testEndpoint(
    'POST /api/generate - Generate image',
    `${API_BASE}/api/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: TEST_TELEGRAM_ID,
        prompt: 'beautiful sunset over ocean',
        model_id: 'test-model-id'  // Mock model ID
      })
    }
  ));

  // Test 5: GET /api/health - Health check
  results.push(await testEndpoint(
    'GET /api/health - Health check',
    `${API_BASE}/api/health`
  ));

  // Print summary
  console.log('\n' + '━'.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('━'.repeat(80));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\nSuccess Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  console.log('\n' + '━'.repeat(80));
  console.log('DETAILED RESULTS:');
  console.log('━'.repeat(80));

  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`\n${index + 1}. ${icon} ${result.name}`);
    if (result.message) {
      console.log(`   Message: ${result.message}`);
    }
    if (result.data && result.status === 'PASS') {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2).split('\n').slice(0, 5).join('\n   ')}`);
    }
  });

  console.log('\n' + '━'.repeat(80));

  // Exit with appropriate code
  if (failed > 0) {
    console.log('\n❌ TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTS PASSED');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ TEST RUNNER ERROR:', error);
  process.exit(1);
});

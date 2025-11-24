#!/usr/bin/env node

// Тест отправки события в Sentry напрямую

const SENTRY_API_KEY = process.env.SENTRY_API_KEY;
const SENTRY_ORG = 'vasilev-dmitrii';
const SENTRY_PROJECT = 'vibee-eliza-999-prod-2';

if (!SENTRY_API_KEY) {
  console.log('❌ SENTRY_API_KEY not found in environment');
  console.log('Set it with: export SENTRY_API_KEY=your_key_here');
  process.exit(1);
}

console.log('🔄 Testing Sentry API connection...\n');

console.log('📋 Configuration:');
console.log('   Organization:', SENTRY_ORG);
console.log('   Project:', SENTRY_PROJECT);
console.log('   API Key:', SENTRY_API_KEY.substring(0, 10) + '...\n');

// Создать тестовое событие
const eventId = Math.random().toString(36).substring(2) + Date.now().toString(36);
const payload = {
  event_id: eventId,
  level: 'info',
  message: 'GitHub Issue Auto-registration Test',
  environment: 'tracking',
  logger: 'github',
  tags: {
    github_issue_number: '999',
    github_repository: 'gHashTag/vibee-eliza-999',
    issue_author: 'test-bot',
    sync_direction: 'github_to_sentry',
    test: 'true'
  },
  extra: {
    github_issue_url: 'https://github.com/gHashTag/vibee-eliza-999/issues/999',
    github_issue_title: 'Test Issue for Sentry Sync',
    github_issue_number: 999,
    github_repository: 'gHashTag/vibee-eliza-999',
    sync_timestamp: new Date().toISOString(),
    test: true
  },
  fingerprint: ['github-issue', 'gHashTag/vibee-eliza-999', '999']
};

console.log('📦 Sending event to Sentry...\n');

// Отправить в Sentry
fetch(`https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/events/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENTRY_API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'GitHub-Sentry-Sync-Test/1.0'
  },
  body: JSON.stringify(payload)
})
.then(response => {
  console.log('📡 Response status:', response.status);
  console.log('📡 Response status text:', response.statusText);

  if (response.status === 201) {
    return response.json();
  } else {
    return response.text().then(text => {
      throw new Error(`API Error: ${response.status}\n${text}`);
    });
  }
})
.then(data => {
  console.log('\n✅ SUCCESS! Event sent to Sentry');
  console.log('📋 Response data:');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n🔍 Check your Sentry dashboard:');
  console.log(`https://${SENTRY_ORG}.sentry.io/projects/${SENTRY_PROJECT}/`);
  console.log('\nLook for events with:');
  console.log('   - Logger: github');
  console.log('   - Level: info');
  console.log('   - Message: GitHub Issue Auto-registration Test');
})
.catch(error => {
  console.log('\n❌ FAILED to send event to Sentry');
  console.log('Error:', error.message);

  console.log('\n🔍 Troubleshooting:');
  console.log('1. Check SENTRY_API_KEY is correct');
  console.log('2. Verify organization/project names');
  console.log('3. Check API key has project:write permission');
  console.log('4. Ensure Sentry project exists and is active');
  console.log('\nDashboard URL:', `https://${SENTRY_ORG}.sentry.io/projects/${SENTRY_PROJECT}/`);
});

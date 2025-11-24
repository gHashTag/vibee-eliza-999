const https = require('https');
const fs = require('fs');

// Configuration from .env
const CONFIG = {
  CLIENT_ID: '88fcf0cd-cce9-4844-bad2-8e19b4bad3ed',
  CLIENT_SECRET: 'b377e7a60b669ea2317f339dc6cb79ce49d588a7bbed92433bb2a73dedff3314',
  PROJECT_ID: 'fd763fa3-35d5-4045-93bd-1795c5f00fc3',
  ENVIRONMENT: 'dev'
};

async function getSecrets() {
  console.log('🔐 Fetching secrets from Infisical...\n');

  // Get access token
  const tokenResponse = await makeRequest({
    hostname: 'api.infisical.com',
    path: '/api/v2/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    clientId: CONFIG.CLIENT_ID,
    clientSecret: CONFIG.CLIENT_SECRET
  }));

  if (!tokenResponse.success) {
    console.error('❌ Failed to get access token:', tokenResponse.error);
    return;
  }

  const accessToken = tokenResponse.data.token;

  // Get secrets
  console.log('✅ Got access token, fetching secrets...\n');
  
  const secretsResponse = await makeRequest({
    hostname: 'api.infisical.com',
    path: `/api/v2/secrets/${CONFIG.PROJECT_ID}?environment=${CONFIG.ENVIRONMENT}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!secretsResponse.success) {
    console.error('❌ Failed to get secrets:', secretsResponse.error);
    return;
  }

  // Filter relevant secrets
  const secrets = {};
  const wantedKeys = [
    'GITHUB_TOKEN',
    'SENTRY_API_KEY',
    'TELEGRAM_BOT_TOKEN',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ];

  for (const secret of secretsResponse.data.secrets) {
    if (wantedKeys.includes(secret.key)) {
      secrets[secret.key] = secret.secretValue;
    }
  }

  console.log('📋 Found Secrets:');
  Object.keys(secrets).forEach(key => {
    const masked = secrets[key].substring(0, 4) + '...';
    console.log(`   ${key}: ${masked}`);
  });

  console.log('\n💡 To test integration, run:');
  console.log('   export GITHUB_TOKEN=' + (secrets.GITHUB_TOKEN || 'YOUR_TOKEN'));
  console.log('   export SENTRY_API_KEY=' + (secrets.SENTRY_API_KEY || 'YOUR_TOKEN'));
  console.log('   node test-sentry-github-integration.js');

  // Save to .env.local for convenience
  const envContent = Object.entries(secrets)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync('.env.local', envContent);
  console.log('\n✅ Secrets saved to .env.local');
}

function makeRequest(options, body = null) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ success: false, error: e.message, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

getSecrets().catch(console.error);

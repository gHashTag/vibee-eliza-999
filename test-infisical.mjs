import 'dotenv/config';

console.log('Testing Infisical connection...\n');

try {
  console.log('1. Environment variables:');
  console.log('  CLIENT_ID:', process.env.INFISICAL_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('  PROJECT_ID:', process.env.INFISICAL_PROJECT_ID ? 'SET' : 'NOT SET');
  console.log('  ENV:', process.env.INFISICAL_ENVIRONMENT || 'dev');

  const authResponse = await fetch('https://app.infisical.com/api/v1/auth/universal-auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.INFISICAL_CLIENT_ID,
      clientSecret: process.env.INFISICAL_CLIENT_SECRET
    })
  });

  console.log('\n2. Auth response:', authResponse.status, authResponse.statusText);

  if (authResponse.ok) {
    const authData = await authResponse.json();
    console.log('✅ Auth successful!');
    console.log('  Expires:', authData.expiresAt);

    const secretsResponse = await fetch(`https://app.infisical.com/api/v3/secrets/raw?workspaceId=${process.env.INFISICAL_PROJECT_ID}&environment=${process.env.INFISICAL_ENVIRONMENT || 'dev'}`, {
      headers: {
        'Authorization': `Bearer ${authData.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n3. Secrets response:', secretsResponse.status, secretsResponse.statusText);

    if (secretsResponse.ok) {
      const secretsData = await secretsResponse.json();
      console.log('Secrets data keys:', Object.keys(secretsData));
      if (secretsData.secrets) {
        console.log('First secret:', secretsData.secrets[0]);
      } else {
        console.log('Secrets data:', secretsData);
      }
      // console.log(`✅ Loaded ${secretsData.secrets.length} secrets!`);

      const critical = ['TELEGRAM_BOT_TOKEN', 'POSTGRES_URL', 'TELEGRAM_BOT_ID', 'OPENROUTER_API_KEY'];
      console.log('\n📋 Critical secrets:');
      for (const key of critical) {
        const found = secretsData.secrets.find(s => (s.secretKey === key || s.key === key));
        console.log(`  ${key}:`, found ? '✅' : '❌ MISSING');
      }
    } else {
      const error = await secretsResponse.text();
      console.log('❌ Failed to fetch secrets:', error);
    }
  } else {
    const error = await authResponse.text();
    console.log('❌ Auth failed:', error);
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
}

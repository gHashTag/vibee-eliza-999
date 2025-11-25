import { InfisicalSDK } from "@infisical/sdk";

async function checkInfisicalAPI() {
  const client = new InfisicalSDK({
    clientId: process.env.INFISICAL_CLIENT_ID!,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
  });

  console.log('\n📋 Initial SDK state:');
  console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
  console.log('Properties:', Object.getOwnPropertyNames(client));

  try {
    console.log('\n🔐 Authenticating...');
    await client.authenticate();
    console.log('✅ Authenticated!');

    console.log('\n📋 SDK after authentication:');
    console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
    console.log('Properties:', Object.getOwnPropertyNames(client));

    // Check if there are any nested objects
    console.log('\n🔍 Detailed inspection:');
    for (const prop of Object.getOwnPropertyNames(client)) {
      const value = (client as any)[prop];
      if (value && typeof value === 'object') {
        console.log(`  ${prop}:`, typeof value, Object.keys(value).slice(0, 5));
      } else {
        console.log(`  ${prop}:`, value);
      }
    }

  } catch (error) {
    console.error('❌ Auth error:', error);
  }
}

checkInfisicalAPI();

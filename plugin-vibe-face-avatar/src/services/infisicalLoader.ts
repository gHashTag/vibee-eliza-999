import { InfisicalSDK } from "@infisical/sdk";

/**
 * Load all secrets from Infisical into process.env.
 * Should be called before any other module accesses env vars.
 */
export async function loadInfisicalSecrets(): Promise<void> {
  try {
    // Initialize the Infisical SDK
    const client = new InfisicalSDK({
      clientId: process.env.INFISICAL_CLIENT_ID!,
      clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
    });

    // Authenticate the client
    await client.authenticate();

    // Get all secrets from the configured environment
    const secrets = await client.secretsClient.listSecrets({
      environment: process.env.INFISICAL_ENVIRONMENT || "dev",
      projectId: process.env.INFISICAL_PROJECT_ID!,
      attachTo: 'process.env'
    });

    if (!secrets || secrets.length === 0) {
      console.warn('⚠️  No secrets found in Infisical');
      return;
    }

    console.log(`📦 Loaded ${secrets.length} secrets from Infisical`);

    // Populate process.env without overwriting existing variables
    for (const secret of secrets) {
      const key = secret.secretKey;
      const value = secret.secretValue;

      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }

    console.log('✅ Infisical secrets loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load secrets from Infisical:', error instanceof Error ? error.message : String(error));
    // Don't throw - allow app to continue with env vars from .env files
  }
}

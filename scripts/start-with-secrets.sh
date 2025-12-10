#!/bin/bash
# Start agent with secrets from Infisical

cd /Users/playra/vibee-agent

# Load base config
source .env.dev

# Get token from Infisical
TOKEN=$(curl -s "https://app.infisical.com/api/v1/auth/universal-auth/login" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"clientId\": \"$INFISICAL_CLIENT_ID\", \"clientSecret\": \"$INFISICAL_CLIENT_SECRET\"}" | jq -r '.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to get Infisical token"
  exit 1
fi

echo "✅ Got Infisical token"

# Export all secrets
eval "$(curl -s "https://app.infisical.com/api/v3/secrets/raw?workspaceId=$INFISICAL_PROJECT_ID&environment=dev" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.secrets[] | "export \(.secretKey)=\(.secretValue | @sh)"')"

echo "✅ Loaded secrets from Infisical"
echo "📱 TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:0:20}..."

# Kill old processes
pkill -f elizaos 2>/dev/null
sleep 2

# Start agent
echo "🚀 Starting VIBEE agent..."
npx elizaos start --character characters/vibeeAgent.json

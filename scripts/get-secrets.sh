#!/bin/bash
source .env.dev

TOKEN=$(curl -s "https://app.infisical.com/api/v1/auth/universal-auth/login" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"clientId\": \"$INFISICAL_CLIENT_ID\", \"clientSecret\": \"$INFISICAL_CLIENT_SECRET\"}" | jq -r '.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Failed to get token"
  exit 1
fi

# Export secrets to env
curl -s "https://app.infisical.com/api/v3/secrets/raw?workspaceId=$INFISICAL_PROJECT_ID&environment=dev" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.secrets[] | "\(.secretKey)=\(.secretValue)"'

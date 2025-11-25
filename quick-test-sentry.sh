#!/bin/bash

# Быстрый тест Sentry API
# Запуск: ./quick-test-sentry.sh

echo "🧪 Sentry API Quick Test"
echo "========================"
echo ""

# Получить API key из GitHub secrets
echo "📡 Getting SENTRY_API_KEY from GitHub..."
SENTRY_API_KEY=$(gh secret get SENTRY_API_KEY --repo gHashTag/vibee-eliza-999 2>/dev/null)

if [ -z "$SENTRY_API_KEY" ]; then
    echo "❌ ERROR: SENTRY_API_KEY not found!"
    echo "   Please check GitHub repository secrets"
    exit 1
fi

echo "✅ API Key found: ${SENTRY_API_KEY:0:10}..."
echo ""

# Настройки
SENTRY_ORG="vasilev-dmitrii"
SENTRY_PROJECT="vibee-eliza-999-prod-2"
API_URL="https://sentry.io/api/0/projects/$SENTRY_ORG/$SENTRY_PROJECT/events/"

echo "📋 Configuration:"
echo "   Organization: $SENTRY_ORG"
echo "   Project: $SENTRY_PROJECT"
echo "   API URL: $API_URL"
echo ""

# Создать событие
EVENT_ID=$(openssl rand -hex 16)
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

echo "📦 Creating test event..."
echo "   Event ID: $EVENT_ID"
echo "   Timestamp: $TIMESTAMP"
echo ""

# Создать JSON
cat > /tmp/test_event.json <<EOF
{
  "event_id": "$EVENT_ID",
  "level": "info",
  "message": "Quick Test from GitHub CLI",
  "environment": "tracking",
  "logger": "github-quick-test",
  "tags": {
    "test": "true",
    "source": "github-cli",
    "timestamp": "$TIMESTAMP"
  },
  "extra": {
    "test": true,
    "timestamp": "$TIMESTAMP",
    "repository": "gHashTag/vibee-eliza-999"
  }
}
EOF

echo "📄 Test JSON:"
cat /tmp/test_event.json
echo ""
echo ""

# Отправить
echo "🚀 Sending to Sentry..."
HTTP_STATUS=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST \
  -H "Authorization: Bearer $SENTRY_API_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: GitHub-CLI-Test/1.0" \
  -d @/tmp/test_event.json \
  "$API_URL")

echo "📡 HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ SUCCESS!"
    echo ""
    echo "📋 Response:"
    cat /tmp/response.json | jq '.' 2>/dev/null || cat /tmp/response.json
    echo ""
    echo "🔍 Check Sentry Dashboard:"
    echo "https://$SENTRY_ORG.sentry.io/projects/$SENTRY_PROJECT/"
    echo ""
    echo "Look for event with:"
    echo "   - Logger: github-quick-test"
    echo "   - Message: Quick Test from GitHub CLI"
else
    echo "❌ FAILED!"
    echo ""
    echo "📋 Response:"
    cat /tmp/response.json | jq '.' 2>/dev/null || cat /tmp/response.json
    echo ""
    echo "🔍 Troubleshooting:"
    echo "1. Check SENTRY_API_KEY is correct"
    echo "2. Verify org/project names: $SENTRY_ORG/$SENTRY_PROJECT"
    echo "3. Check API key permissions"
    echo "4. Ensure project exists"
    exit 1
fi

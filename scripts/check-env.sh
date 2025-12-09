#!/bin/bash
# Quick environment check script
# Run this before any work to verify API keys and environment variables

echo "=================================================="
echo "🔍 ENVIRONMENT VARIABLES CHECK"
echo "=================================================="
echo ""

# Check .env file
echo "📄 Checking .env file..."
if [ -f .env ]; then
  echo "✅ .env file exists"
  echo ""
  echo "📋 Infisical Configuration:"
  grep -E "INFISICAL|NODE_ENV" .env | while read line; do
    if [[ $line == *"SECRET"* ]]; then
      echo "  ✅ $(echo $line | cut -d= -f1): [HIDDEN]"
    else
      echo "  ✅ $line"
    fi
  done
else
  echo "❌ .env file NOT FOUND"
  exit 1
fi

echo ""
echo "=================================================="
echo "🔑 Critical API Keys Status"
echo "=================================================="
echo ""

# Check critical environment variables
check_var() {
  local var_name=$1
  local description=$2
  if [ -n "${!var_name}" ]; then
    local value="${!var_name}"
    local preview="${value:0:10}..."
    echo "✅ $description ($var_name): $preview"
    return 0
  else
    echo "❌ $description ($var_name): NOT SET"
    return 1
  fi
}

# List of critical variables
critical_count=0
total_count=7

check_var "TELEGRAM_BOT_TOKEN" "Telegram Bot Token" && ((critical_count++))
check_var "TELEGRAM_BOT_ID" "Telegram Bot ID" && ((critical_count++))
check_var "TELEGRAM_API_ID" "Telegram API ID" && ((critical_count++))
check_var "TELEGRAM_API_HASH" "Telegram API Hash" && ((critical_count++))
check_var "OPENROUTER_API_KEY" "OpenRouter API Key" && ((critical_count++))
check_var "FAL_KEY" "Fal AI Key" && ((critical_count++))
check_var "POSTGRES_URL" "PostgreSQL URL" && ((critical_count++))

echo ""
echo "=================================================="
echo "📊 Summary: $critical_count/$total_count critical variables set"
echo "=================================================="
echo ""

if [ $critical_count -eq $total_count ]; then
  echo "🎉 All critical environment variables are set!"
  echo "✅ Ready to run: npm run dev:hot"
  exit 0
else
  echo "⚠️  Warning: Some critical variables are missing!"
  echo "💡 Make sure Infisical is configured and secrets are loaded"
  echo "💡 Run: npm run dev:hot"
  exit 1
fi

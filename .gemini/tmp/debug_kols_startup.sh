#!/bin/bash

# Load .env file (as done in start-all.sh)
if [ -f "/Users/playra/vibee-agent/.env" ]; then
    set -a
    source "/Users/playra/vibee-agent/.env"
    set +a
fi

# Set explicit DB envs (as done in start-all.sh)
export DATABASE_URL="sqlite:./data/dev.sqlite"
export DATABASE_ADAPTER=sqlite
export ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true

# Echo the KOLS agent command with expanded variables
echo "KOLS_COMMAND_DEBUG: env PORT=3002 DATABASE_URL=\"$DATABASE_URL\" DATABASE_ADAPTER=\"$DATABASE_ADAPTER\" TELEGRAM_API_ID=\"$TELEGRAM_API_ID\" TELEGRAM_API_HASH=\"$TELEGRAM_API_HASH\" TELEGRAM_SESSION_STRING=\"$TELEGRAM_SESSION_STRING\" TELEGRAM_BOT_TOKEN=\"$TELEGRAM_BOT_TOKEN\" OPENROUTER_API_KEY=\"$OPENROUTER_API_KEY\" SECRET_SALT=\"$SECRET_SALT\" npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json"

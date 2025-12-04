#!/bin/bash
cd /Users/playra/vibee-agent
source .infisical.env
if [ -f .env.dev ]; then
    source .env.dev
fi
export VIBEE_ENV_LOADED=true
bun run dev --character characters/vibeeAgent.json

#!/bin/bash
curl -s -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer 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" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: https://vibee.ai" \
  -H "X-Title: VIBEE Test" \
  -d '{"model": "x-ai/grok-3-fast", "messages": [{"role": "user", "content": "Say hello in one word"}], "max_tokens": 50}'

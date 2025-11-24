import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'

/**
 * Capabilities Provider
 * 
 * Предоставляет информацию о возможностях Telegram плагина для LLM
 */
export const capabilitiesProvider: Provider = {
  name: 'telegramCapabilities',
  
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<ProviderResult> => {
    const service = runtime.getService<TelegramService>('telegram-craft')
    const strategy = service?.getStrategy() || 'unknown'
    const isConnected = service?.isConnected() || false
    
    return {
      text: `
# 🐝 Telegram Craft Plugin Capabilities

## Current Configuration
- **Connection Strategy**: ${strategy}
- **Status**: ${isConnected ? '✅ Connected' : '❌ Disconnected'}

## Available Actions

### 📤 SEND_MESSAGE
Send messages to Telegram chats
- Command: \`/send @username message\`
- Supports: Reply to messages

### 📜 READ_HISTORY
Read message history from chats
- Command: \`/history @username [limit]\`
- Userbot only (MTProto)

### 📋 GET_DIALOGS
List all Telegram dialogs/chats
- Command: \`/dialogs [limit]\`
- Userbot only (MTProto)

## Supported Features (MTProto)
- ✅ Send messages to any chat
- ✅ Read message history
- ✅ Get user information
- ✅ List dialogs
- ✅ Join channels/groups
- ✅ Forward messages

## Limitations (Bot API)
- ❌ Cannot read history of non-bot chats
- ❌ Cannot list user dialogs
- ✅ Can send messages to authorized chats

---
**Plugin Version**: 1.0.0
**Powered by**: GramJS (MTProto)
      `.trim(),
      values: {
        strategy,
        isConnected,
        supportedActions: [
          'SEND_MESSAGE',
          'READ_HISTORY',
          'GET_DIALOGS',
        ],
      },
    }
  },
}

// src/schemas/actions.schema.ts
import { z as z2 } from "zod";

// src/schemas/telegram.schema.ts
import { z } from "zod";
var TelegramConfigSchema = z.object({
  TELEGRAM_API_ID: z.string().min(1, "TELEGRAM_API_ID обязателен"),
  TELEGRAM_API_HASH: z.string().min(1, "TELEGRAM_API_HASH обязателен"),
  TELEGRAM_SESSION: z.string().optional(),
  TELEGRAM_STRATEGY: z.enum(["mtproto", "botapi", "mcp"]).default("mtproto"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_PHONE: z.string().optional(),
  TELEGRAM_PASSWORD: z.string().optional(),
  TELEGRAM_MONITORING_CHANNEL_ID: z.string().optional()
});
var TelegramChatIdSchema = z.string().min(1, "Chat ID не может быть пустым");
var TelegramMessageSchema = z.object({
  id: z.number().int().positive(),
  text: z.string(),
  sender: z.string(),
  date: z.number().int().positive(),
  chatId: z.string().optional()
});
var TelegramDialogSchema = z.object({
  id: z.string(),
  name: z.string(),
  unreadCount: z.number().int().nonnegative(),
  lastMessage: TelegramMessageSchema.optional()
});
var TelegramUserSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional()
});

// src/schemas/actions.schema.ts
var SendMessageInputSchema = z2.object({
  chatId: TelegramChatIdSchema,
  message: z2.string().min(1, "Сообщение не может быть пустым").max(4096, "Сообщение слишком длинное (макс. 4096 символов)"),
  replyTo: z2.number().int().positive().optional()
});
var SendMessageOutputSchema = z2.object({
  success: z2.boolean(),
  data: z2.object({
    messageId: z2.number().int().positive(),
    chatId: z2.string(),
    date: z2.number().int().positive()
  }).optional(),
  error: z2.string().optional()
});
var ReadHistoryInputSchema = z2.object({
  chatId: TelegramChatIdSchema,
  limit: z2.number().int().positive().max(100).default(10)
});
var ReadHistoryOutputSchema = z2.object({
  success: z2.boolean(),
  data: z2.object({
    messages: z2.array(z2.object({
      id: z2.number(),
      text: z2.string(),
      sender: z2.string(),
      date: z2.number()
    })),
    chatId: z2.string()
  }).optional(),
  error: z2.string().optional()
});
var GetDialogsInputSchema = z2.object({
  limit: z2.number().int().positive().max(100).default(20)
});
var GetDialogsOutputSchema = z2.object({
  success: z2.boolean(),
  data: z2.object({
    dialogs: z2.array(z2.object({
      id: z2.string(),
      name: z2.string(),
      unreadCount: z2.number()
    }))
  }).optional(),
  error: z2.string().optional()
});
var GetUserInputSchema = z2.object({
  userId: z2.string().min(1)
});
var GetUserOutputSchema = z2.object({
  success: z2.boolean(),
  data: z2.object({
    id: z2.string(),
    username: z2.string().optional(),
    firstName: z2.string().optional(),
    lastName: z2.string().optional()
  }).optional(),
  error: z2.string().optional()
});
var JoinChatInputSchema = z2.object({
  chatId: TelegramChatIdSchema
});
var ForwardMessageInputSchema = z2.object({
  fromChatId: TelegramChatIdSchema,
  toChatId: TelegramChatIdSchema,
  messageId: z2.number().int().positive()
});

// src/actions/sendMessage.action.ts
var sendMessageAction = {
  name: "SEND_TELEGRAM_MESSAGE",
  similes: ["SEND_TG_MESSAGE", "TELEGRAM_SEND", "TG_SEND"],
  description: "Отправляет сообщение в Telegram чат через userbot (MTProto)",
  validate: async (runtime, message) => {
    const text = message.content?.text?.toLowerCase();
    if (!text)
      return false;
    const commands = ["/send", "/tgsend", "telegram send"];
    const intents = [
      "отправь в telegram",
      "отправить сообщение в tg",
      "написать в телеграм",
      "send to telegram"
    ];
    return commands.some((cmd) => text.includes(cmd)) || intents.some((intent) => text.includes(intent));
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const params = extractSendMessageParams(message, state);
      const validatedInput = SendMessageInputSchema.parse(params);
      const service = runtime.getService("telegram-craft");
      if (!service) {
        throw new Error("Telegram service not available");
      }
      await callback?.({
        text: `\uD83D\uDCE4 Отправляю сообщение в ${validatedInput.chatId}...`
      });
      const result = await service.sendMessage(validatedInput.chatId, validatedInput.message, validatedInput.replyTo);
      await callback?.({
        text: `✅ Сообщение отправлено!

\uD83D\uDCE8 Chat ID: ${validatedInput.chatId}
\uD83D\uDCDD Message ID: ${result.messageId}`
      });
      return {
        success: true,
        data: {
          messageId: result.messageId,
          chatId: validatedInput.chatId,
          date: result.date
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await callback?.({
        text: `❌ Ошибка отправки сообщения:
${errorMessage}`
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "/send @john Hello from ElizaOS!" }
      },
      {
        user: "{{agent}}",
        content: {
          text: "✅ Сообщение отправлено!",
          action: "SEND_TELEGRAM_MESSAGE"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Отправь в telegram сообщение привет всем" }
      },
      {
        user: "{{agent}}",
        content: {
          text: "\uD83D\uDCE4 Отправляю сообщение...",
          action: "SEND_TELEGRAM_MESSAGE"
        }
      }
    ]
  ]
};
function extractSendMessageParams(message, state) {
  const text = message.content?.text || "";
  const match = text.match(/\/send\s+(@?\w+)\s+(.+)/i);
  if (match) {
    return {
      chatId: match[1],
      message: match[2]
    };
  }
  return {
    chatId: message.roomId || "me",
    message: text
  };
}

// src/actions/readHistory.action.ts
var readHistoryAction = {
  name: "READ_TELEGRAM_HISTORY",
  similes: ["GET_TG_HISTORY", "TELEGRAM_HISTORY", "TG_HISTORY"],
  description: "Читает историю сообщений из Telegram чата (userbot)",
  validate: async (runtime, message) => {
    const text = message.content?.text?.toLowerCase();
    if (!text)
      return false;
    const commands = ["/history", "/tghistory", "telegram history"];
    const intents = [
      "покажи историю",
      "прочитай сообщения из",
      "что писали в",
      "show history",
      "read messages from"
    ];
    return commands.some((cmd) => text.includes(cmd)) || intents.some((intent) => text.includes(intent));
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const params = extractHistoryParams(message, state);
      const validatedInput = ReadHistoryInputSchema.parse(params);
      const service = runtime.getService("telegram-craft");
      if (!service) {
        throw new Error("Telegram service not available");
      }
      await callback?.({
        text: `\uD83D\uDCDC Читаю историю из ${validatedInput.chatId}...`
      });
      const messages = await service.getHistory(validatedInput.chatId, validatedInput.limit);
      const formattedMessages = messages.slice(0, 10).map((msg) => `[${new Date(msg.date * 1000).toLocaleTimeString()}] ${msg.sender}: ${msg.text}`).join(`
`);
      await callback?.({
        text: `✅ История чата ${validatedInput.chatId}

${formattedMessages}

\uD83D\uDCCA Всего сообщений: ${messages.length}`
      });
      return {
        success: true,
        data: {
          messages,
          chatId: validatedInput.chatId
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await callback?.({
        text: `❌ Ошибка чтения истории:
${errorMessage}`
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "/history @mygroup" }
      },
      {
        user: "{{agent}}",
        content: {
          text: "✅ История чата получена",
          action: "READ_TELEGRAM_HISTORY"
        }
      }
    ]
  ]
};
function extractHistoryParams(message, state) {
  const text = message.content?.text || "";
  const match = text.match(/\/history\s+(@?\w+)(?:\s+(\d+))?/i);
  if (match) {
    return {
      chatId: match[1],
      limit: match[2] ? parseInt(match[2]) : 10
    };
  }
  return {
    chatId: message.roomId || "me",
    limit: 10
  };
}

// src/actions/getDialogs.action.ts
var getDialogsAction = {
  name: "GET_TELEGRAM_DIALOGS",
  similes: ["LIST_TG_CHATS", "TELEGRAM_CHATS", "TG_DIALOGS"],
  description: "Получает список диалогов и чатов из Telegram (userbot)",
  validate: async (runtime, message) => {
    const text = message.content?.text?.toLowerCase();
    if (!text)
      return false;
    const commands = ["/dialogs", "/chats", "/tgdialogs"];
    const intents = [
      "покажи мои чаты",
      "список диалогов",
      "мои telegram чаты",
      "show my chats",
      "list dialogs"
    ];
    return commands.some((cmd) => text.includes(cmd)) || intents.some((intent) => text.includes(intent));
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const params = extractDialogsParams(message);
      const validatedInput = GetDialogsInputSchema.parse(params);
      const service = runtime.getService("telegram-craft");
      if (!service) {
        throw new Error("Telegram service not available");
      }
      await callback?.({
        text: "\uD83D\uDCCB Получаю список диалогов..."
      });
      const dialogs = await service.getDialogs(validatedInput.limit);
      const formattedDialogs = dialogs.slice(0, 15).map((d, i) => `${i + 1}. **${d.name}** (ID: \`${d.id}\`) - \uD83D\uDCAC ${d.unreadCount} непрочитанных`).join(`
`);
      await callback?.({
        text: `✅ Ваши диалоги Telegram:

${formattedDialogs}

\uD83D\uDCCA Всего: ${dialogs.length} диалогов`
      });
      return {
        success: true,
        data: { dialogs }
      };
    } catch (error) {
      await callback?.({
        text: `❌ Ошибка получения диалогов:
${error instanceof Error ? error.message : "Unknown error"}`
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "/dialogs" }
      },
      {
        user: "{{agent}}",
        content: {
          text: "✅ Список диалогов получен",
          action: "GET_TELEGRAM_DIALOGS"
        }
      }
    ]
  ]
};
function extractDialogsParams(message) {
  const text = message.content?.text || "";
  const match = text.match(/\/dialogs\s+(\d+)/i);
  return {
    limit: match ? parseInt(match[1]) : 20
  };
}

// src/actions/startGroupMonitoring.action.ts
var startGroupMonitoringAction = {
  name: "START_GROUP_MONITORING",
  similes: [
    "START_MONITORING",
    "GROUP_MONITOR",
    "MONITOR_CHATS",
    "LISTEN_GROUPS"
  ],
  description: "Запускает мониторинг групповых чатов в реальном времени",
  validate: async (runtime, message) => {
    const text = message.content?.text?.toLowerCase();
    if (!text)
      return false;
    const commands = ["/monitor start", "/monitoring start", "/ слушать"];
    const intents = [
      "запусти мониторинг",
      "начать мониторинг групп",
      "начать слушать чаты",
      "start monitoring groups",
      "listen to chats",
      "мониторь чаты",
      "слушай групповые чаты"
    ];
    return commands.some((cmd) => text.includes(cmd)) || intents.some((intent) => text.includes(intent));
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      console.log("\uD83D\uDD0D [START_GROUP_MONITORING] Handler called");
      console.log("\uD83D\uDD0D [START_GROUP_MONITORING] Runtime exists:", !!runtime);
      const allServices = runtime.services || [];
      console.log("\uD83D\uDD0D [START_GROUP_MONITORING] Total services in runtime:", allServices.length);
      console.log("\uD83D\uDD0D [START_GROUP_MONITORING] Service types:", allServices.map((s) => s.serviceType || s.constructor?.serviceType));
      console.log('\uD83D\uDD0D [START_GROUP_MONITORING] Calling runtime.getService("telegram-craft")...');
      const service = runtime.getService("telegram-craft");
      console.log("\uD83D\uDD0D [START_GROUP_MONITORING] Service returned:", !!service);
      console.log("\uD83D\uDD0D [START_GROUP_MONITORING] Service type:", service?.serviceType);
      if (!service) {
        console.error("❌ [START_GROUP_MONITORING] Service is NULL!");
        console.error("❌ [START_GROUP_MONITORING] Available services:", allServices.map((s) => ({
          type: s.serviceType || s.constructor?.serviceType,
          className: s.constructor?.name
        })));
        throw new Error("Telegram service not available");
      }
      console.log("✅ [START_GROUP_MONITORING] Service found and ready");
      await callback?.({
        text: "\uD83D\uDD0D Запускаю мониторинг групповых чатов..."
      });
      const result = await service.startGroupMonitoring();
      if (result.success) {
        const stats = service.getMonitoringStats();
        await callback?.({
          text: `✅ Мониторинг запущен!

\uD83D\uDCCA Статистика:
• Всего групп: ${stats.totalGroups}
• Активных групп: ${stats.activeGroups}
• Сообщений обработано: ${stats.totalMessages}
• Время работы: ${Math.floor(stats.uptime / 1000)}с

\uD83D\uDCA1 Отправь "добавь группу @название" чтобы добавить чат для мониторинга`,
          action: "START_GROUP_MONITORING"
        });
        return {
          success: true,
          data: {
            monitoringStarted: true,
            stats
          }
        };
      } else {
        await callback?.({
          text: `❌ Не удалось запустить мониторинг: ${result.message}`,
          error: true
        });
        return {
          success: false,
          error: new Error(result.message)
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await callback?.({
        text: `❌ Ошибка запуска мониторинга: ${errorMessage}`,
        error: true
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage)
      };
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "запусти мониторинг групп" }
      },
      {
        name: "KOLS_AGENT",
        content: {
          text: `✅ Мониторинг запущен!

\uD83D\uDCCA Статистика:
• Всего групп: 0
• Активных групп: 0`,
          action: "START_GROUP_MONITORING"
        }
      }
    ]
  ]
};

// src/actions/addGroupToMonitor.action.ts
var addGroupToMonitorAction = {
  name: "ADD_GROUP_TO_MONITOR",
  similes: [
    "ADD_GROUP_MONITOR",
    "MONITOR_ADD_GROUP",
    "JOIN_GROUP_MONITOR"
  ],
  description: "Добавляет группу в список мониторинга",
  validate: async (runtime, message) => {
    const text = message.content?.text?.toLowerCase();
    if (!text)
      return false;
    const commands = ["/monitor add", "/monitor add", "добавь группу"];
    const intents = [
      "добавь чат",
      "добавь в мониторинг",
      "начать слушать",
      "add group to monitor",
      "monitor this chat"
    ];
    return commands.some((cmd) => text.includes(cmd)) || intents.some((intent) => text.includes(intent));
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const text = message.content?.text || "";
      const chatId = message?.roomId || "unknown";
      let groupId = chatId;
      let groupName = "текущий чат";
      const match = text.match(/@([a-zA-Z0-9_]+)/);
      if (match) {
        groupId = match[1];
        groupName = `@${match[1]}`;
      }
      const service = runtime.getService("telegram-craft");
      if (!service) {
        throw new Error("Telegram service not available");
      }
      const result = await service.addGroupToMonitoring(groupId, groupName);
      if (result.success) {
        await callback?.({
          text: `✅ Группа "${groupName}" добавлена в мониторинг!

\uD83D\uDCA1 Чтобы увидеть все мониторимые группы, отправь "покажи группы"`,
          action: "ADD_GROUP_TO_MONITOR"
        });
        return {
          success: true,
          data: {
            groupAdded: true,
            groupId,
            groupName
          }
        };
      } else {
        await callback?.({
          text: `❌ Не удалось добавить группу: ${result.message}`,
          error: true
        });
        return {
          success: false,
          error: new Error(result.message)
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await callback?.({
        text: `❌ Ошибка добавления группы: ${errorMessage}`,
        error: true
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage)
      };
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "добавь группу @mygroup" }
      },
      {
        name: "KOLS_AGENT",
        content: {
          text: '✅ Группа "@mygroup" добавлена в мониторинг!',
          action: "ADD_GROUP_TO_MONITOR"
        }
      }
    ]
  ]
};

// src/actions/liveFeed.action.ts
var liveFeedAction = {
  name: "LIVE_FEED",
  similes: ["live feed", "live messages", "show live", "real-time", "включи трансляцию", "покажи онлайн"],
  description: "Показывает сообщения из Telegram групп в реальном времени прямо в чате",
  validate: async (runtime, message) => {
    const text = message.content.text.toLowerCase();
    return text.includes("трансляц") || text.includes("онлайн") || text.includes("live") || text.includes("покажи сообщения") || text.includes("что в группах");
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const service = runtime.getService("telegram-craft");
      if (!service) {
        await callback({
          text: "Telegram сервис не инициализирован",
          error: true
        });
        return { success: false, text: "Service not found" };
      }
      const recentMessages = service.getRecentMessages(10);
      const stats = service.getMonitoringStats();
      if (recentMessages.length === 0) {
        await callback({
          text: `\uD83D\uDCE1 Мониторинг активен

\uD83D\uDCCA Статистика:
• Обработано сообщений: ${stats.totalMessages}
• Время работы: ${Math.floor(stats.uptime / 1000 / 60)} минут

⏳ Ожидаем новые сообщения...
\uD83D\uDCA1 Как только придет новое сообщение - я сразу покажу!`,
          action: "LIVE_FEED"
        });
        return {
          success: true,
          text: "No messages yet"
        };
      }
      const messagesText = recentMessages.map((msg) => {
        const time = new Date(msg.timestamp).toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        return `[${time}] \uD83D\uDCE8 **${msg.chatTitle}**
\uD83D\uDC64 ${msg.fromUsername}: ${msg.text.substring(0, 200)}${msg.text.length > 200 ? "..." : ""}`;
      }).join(`

---

`);
      await callback({
        text: `\uD83D\uDCE1 **Трансляция сообщений из Telegram**

\uD83D\uDCCA Обработано: ${stats.totalMessages} сообщений

${messagesText}

---
✅ Обновляется автоматически при каждом новом сообщении`,
        action: "LIVE_FEED"
      });
      return {
        success: true,
        text: "Live feed activated",
        data: {
          messageCount: recentMessages.length,
          totalMessages: stats.totalMessages
        }
      };
    } catch (error) {
      console.error("❌ Live Feed Action error:", error);
      await callback({
        text: "Ошибка получения сообщений из Telegram",
        error: true
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        name: "user",
        content: { text: "покажи сообщения из групп" }
      },
      {
        name: "assistant",
        content: {
          text: "\uD83D\uDCE1 Показываю последние сообщения из Telegram групп...",
          action: "LIVE_FEED"
        }
      }
    ],
    [
      {
        name: "user",
        content: { text: "что происходит в группах?" }
      },
      {
        name: "assistant",
        content: {
          text: "Сейчас проверю последние сообщения в ваших группах",
          action: "LIVE_FEED"
        }
      }
    ]
  ]
};

// src/providers/recentMessages.provider.ts
var recentMessagesProvider = {
  name: "recentMessages",
  get: async (runtime, message, state) => {
    try {
      const service = runtime.getService("telegram-craft");
      if (!service || !service.isConnected()) {
        return {
          text: "",
          values: {}
        };
      }
      const chatId = message.roomId || "me";
      const messages = await service.getHistory(chatId, 10);
      const formattedMessages = messages.map((msg) => {
        const time = new Date(msg.date * 1000).toLocaleTimeString();
        return `[${time}] ${msg.sender}: ${msg.text}`;
      }).join(`
`);
      return {
        text: `
# \uD83D\uDCAC Recent Telegram Messages

## Chat: ${chatId}

\`\`\`
${formattedMessages}
\`\`\`

---
**Total messages**: ${messages.length}
**Last updated**: ${new Date().toLocaleString()}
        `.trim(),
        values: {
          chatId,
          messageCount: messages.length,
          messages: messages.map((m) => ({
            id: m.id,
            text: m.text,
            sender: m.sender
          }))
        },
        data: {
          raw: messages
        }
      };
    } catch (error) {
      console.error("Error in recentMessagesProvider:", error);
      return {
        text: "",
        values: {}
      };
    }
  }
};

// src/providers/dialogsList.provider.ts
var dialogsListProvider = {
  name: "dialogsList",
  get: async (runtime, message, state) => {
    try {
      const service = runtime.getService("telegram-craft");
      if (!service || !service.isConnected()) {
        return {
          text: "",
          values: {}
        };
      }
      const dialogs = await service.getDialogs(20);
      const formattedDialogs = dialogs.slice(0, 15).map((d, i) => `${i + 1}. ${d.name} (ID: ${d.id}) - ${d.unreadCount} unread`).join(`
`);
      return {
        text: `
# \uD83D\uDCCB Telegram Dialogs List

## Active Chats

${formattedDialogs}

---
**Total dialogs**: ${dialogs.length}
**Last updated**: ${new Date().toLocaleString()}
        `.trim(),
        values: {
          dialogCount: dialogs.length,
          dialogs: dialogs.map((d) => ({
            id: d.id,
            name: d.name,
            unread: d.unreadCount
          }))
        },
        data: {
          raw: dialogs
        }
      };
    } catch (error) {
      console.error(" Error in dialogsListProvider:", error);
      return {
        text: "",
        values: {}
      };
    }
  }
};

// src/providers/capabilities.provider.ts
var capabilitiesProvider = {
  name: "telegramCapabilities",
  get: async (runtime, message, state) => {
    const service = runtime.getService("telegram-craft");
    const strategy = service?.getStrategy() || "unknown";
    const isConnected = service?.isConnected() || false;
    return {
      text: `
# \uD83D\uDC1D Telegram Craft Plugin Capabilities

## Current Configuration
- **Connection Strategy**: ${strategy}
- **Status**: ${isConnected ? "✅ Connected" : "❌ Disconnected"}

## Available Actions

### \uD83D\uDCE4 SEND_MESSAGE
Send messages to Telegram chats
- Command: \`/send @username message\`
- Supports: Reply to messages

### \uD83D\uDCDC READ_HISTORY
Read message history from chats
- Command: \`/history @username [limit]\`
- Userbot only (MTProto)

### \uD83D\uDCCB GET_DIALOGS
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
          "SEND_MESSAGE",
          "READ_HISTORY",
          "GET_DIALOGS"
        ]
      }
    };
  }
};

// src/providers/liveMessages.provider.ts
var liveMessagesProvider = {
  get: async (runtime, message) => {
    try {
      const service = runtime.getService("telegram-craft");
      if (!service) {
        return "Telegram сервис не инициализирован";
      }
      const stats = service.getMonitoringStats();
      const groups = service.getMonitoredGroups();
      const recentMessages = service.getRecentMessages(20);
      if (!service.isGroupMonitoringActive()) {
        return `\uD83D\uDCE1 Мониторинг групп: Остановлен

\uD83D\uDCA1 Отправь "запусти мониторинг групп" чтобы начать слушать сообщения`;
      }
      if (recentMessages.length === 0) {
        return `\uD83D\uDCE1 Мониторинг активен

\uD83D\uDCCA Статистика:
• Групп в мониторинге: ${stats.totalGroups}
• Сообщений обработано: ${stats.totalMessages}
• Время работы: ${Math.floor(stats.uptime / 1000 / 60)} минут

⏳ Ожидаем новые сообщения из групп...`;
      }
      const messagesText = recentMessages.slice(0, 10).map((msg) => {
        const time = new Date(msg.timestamp).toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit"
        });
        const text = msg.text.length > 100 ? msg.text.substring(0, 100) + "..." : msg.text;
        return `[${time}] \uD83D\uDCE8 ${msg.chatTitle}
  ${msg.fromUsername}: ${text}`;
      }).join(`

`);
      return `\uD83D\uDCE1 Мониторинг активен | \uD83D\uDCCA Обработано: ${stats.totalMessages} сообщений

\uD83D\uDCEC Последние сообщения из групп:

${messagesText}

---
\uD83D\uDCA1 Сообщения обновляются в реальном времени`;
    } catch (error) {
      console.error("❌ Error in liveMessagesProvider:", error);
      return "Ошибка получения сообщений";
    }
  }
};

// src/providers/autoMessageForwarder.provider.ts
var autoMessageForwarderProvider = {
  name: "AUTO_MESSAGE_FORWARDER",
  description: "Автоматическая пересылка сообщений из Telegram групп в чат",
  get: async (runtime, message) => {
    const telegramService = runtime.getService("telegram-craft");
    if (!telegramService) {
      return null;
    }
    if (!telegramService.hasMessageDistributor()) {
      const distributor = (messageText) => {
        runtime.addMemory({
          id: `auto-forward-${Date.now()}`,
          content: {
            text: messageText,
            action: "AUTO_FORWARD_MESSAGE",
            type: "auto-forward"
          },
          roomId: message.roomId || "default",
          userId: "system",
          createdAt: new Date
        });
      };
      telegramService.setMessageDistributor(distributor);
      console.log("✅ [AutoForwarder] Message distributor активирован");
    }
    return null;
  }
};

// src/evaluators/messageAutoForward.evaluator.ts
var messageAutoForwardEvaluator = {
  name: "MESSAGE_AUTO_FORWARD",
  shouldRun: async (runtime, message) => {
    return true;
  },
  evaluate: async (runtime, message, state) => {
    try {
      const telegramService = runtime.getService("telegram-craft");
      if (!telegramService) {
        return { success: false, confidence: 0 };
      }
      const recentMessages = telegramService.getRecentMessages(5);
      const lastCheck = state?.lastMessageCheck || 0;
      const newMessages = recentMessages.filter((msg) => msg.timestamp.getTime() > lastCheck);
      if (newMessages.length > 0) {
        console.log(`\uD83D\uDCE4 [AutoForward] Отправляю ${newMessages.length} новых сообщений`);
        const messagesText = newMessages.map((msg) => {
          const time = new Date(msg.timestamp).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
          return `[${time}] \uD83D\uDCE8 **${msg.chatTitle}**
\uD83D\uDC64 ${msg.fromUsername}: ${msg.text.substring(0, 200)}${msg.text.length > 200 ? "..." : ""}`;
        }).join(`

---

`);
        return {
          success: true,
          confidence: 1,
          data: {
            newMessages: newMessages.length,
            autoForwardText: `\uD83D\uDCE1 **Новые сообщения из Telegram (${newMessages.length}):**

${messagesText}

---
\uD83D\uDD04 Ожидаю новые сообщения...`
          }
        };
      }
      return { success: true, confidence: 0.1 };
    } catch (error) {
      console.error("❌ [AutoForward] Error:", error);
      return { success: false, confidence: 0 };
    }
  },
  handler: async (runtime, message, state, callback) => {
    try {
      if (state?.autoForwardText) {
        await callback({
          text: state.autoForwardText,
          action: "MESSAGE_AUTO_FORWARD"
        });
        console.log("✅ [AutoForward] Сообщения отправлены");
      }
    } catch (error) {
      console.error("❌ [AutoForward] Handler error:", error);
    }
  }
};

// src/services/telegram.service.ts
import { Service, stringToUuid } from "@elizaos/core";

// src/services/adapters/mtproto.adapter.ts
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";

class MTProtoAdapter {
  client;
  config;
  session;
  messageHandlers = new Set;
  constructor(config) {
    this.config = config;
    this.session = new StringSession(config.session || "");
    this.client = new TelegramClient(this.session, config.apiId, config.apiHash, {
      connectionRetries: 5,
      deviceModel: "Desktop",
      appVersion: "1.0.0",
      systemVersion: "NodeJS",
      langCode: "en"
    });
  }
  async connect() {
    console.log("\uD83D\uDD17 Connecting to Telegram via MTProto...");
    try {
      if (this.config.session) {
        console.log("\uD83D\uDD11 Using existing session string");
        const connectPromise = this.client.connect();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("MTProto connection timeout after 10 seconds")), 1e4);
        });
        await Promise.race([connectPromise, timeoutPromise]);
      } else {
        console.log("⚠️ No session string found, skipping auth (interactive mode not supported)");
        return;
      }
      console.log("✅ Connected to Telegram!");
      console.log("\uD83D\uDC64 User ID:", (await this.client.getMe()).id);
      this.setupMessageListener();
    } catch (error) {
      console.error("❌ MTProto connection failed:", error);
      console.log("⚠️ Telegram will be unavailable. Continuing without Telegram...");
      throw error;
    }
  }
  setupMessageListener() {
    console.log("\uD83C\uDFA7 [MTProto] Setting up message listener...");
    this.client.addEventHandler(async (event) => {
      console.log(`\uD83D\uDD14 [MTProto] New message event received! Handlers count: ${this.messageHandlers.size}`);
      console.log(`\uD83D\uDCDD [MTProto] Message text: ${event.message.text || event.message.message}`);
      if (this.messageHandlers.size === 0) {
        console.log("⚠️ [MTProto] No handlers registered yet!");
      }
      const enrichedEvent = {
        originalEvent: event,
        message: event.message,
        chatId: undefined,
        chatTitle: "Unknown Chat",
        chatUsername: undefined,
        senderId: undefined,
        senderUsername: undefined,
        senderFirstName: undefined,
        senderLastName: undefined
      };
      try {
        const chat = await event.message.getChat();
        const sender = await event.message.getSender();
        const peerId = event.message.peerId;
        if (peerId) {
          if (peerId.userId)
            enrichedEvent.chatId = peerId.userId.toString();
          else if (peerId.chatId)
            enrichedEvent.chatId = peerId.chatId.toString();
          else if (peerId.channelId)
            enrichedEvent.chatId = peerId.channelId.toString();
        }
        enrichedEvent.chatTitle = chat?.title || chat?.firstName || "Private Chat";
        enrichedEvent.chatUsername = chat?.username;
        enrichedEvent.senderId = sender?.id?.toString() || "unknown";
        enrichedEvent.senderUsername = sender?.username;
        enrichedEvent.senderFirstName = sender?.firstName;
        enrichedEvent.senderLastName = sender?.lastName;
        console.log(`\uD83D\uDCAC [MTProto] Chat: ${enrichedEvent.chatTitle} (${enrichedEvent.chatId}), From: ${enrichedEvent.senderFirstName} (${enrichedEvent.senderId})`);
      } catch (error) {
        console.error("⚠️ [MTProto] Failed to get chat/sender info:", error);
        if (!enrichedEvent.chatId) {
          const peerId = event.message.peerId;
          if (peerId) {
            if (peerId.userId)
              enrichedEvent.chatId = peerId.userId.toString();
            else if (peerId.chatId)
              enrichedEvent.chatId = peerId.chatId.toString();
            else if (peerId.channelId)
              enrichedEvent.chatId = peerId.channelId.toString();
            else
              enrichedEvent.chatId = "unknown";
          } else {
            enrichedEvent.chatId = "unknown";
          }
        }
      }
      this.messageHandlers.forEach((handler) => {
        try {
          console.log("\uD83D\uDCE4 [MTProto] Calling handler...");
          handler(enrichedEvent);
        } catch (error) {
          console.error("❌ [MTProto] Error in message handler:", error);
        }
      });
    }, new NewMessage({}));
    console.log("✅ [MTProto] Message listener configured");
  }
  onMessage(handler) {
    this.messageHandlers.add(handler);
    console.log(`\uD83D\uDCE8 New message handler registered. Total handlers: ${this.messageHandlers.size}`);
  }
  offMessage(handler) {
    this.messageHandlers.delete(handler);
    console.log(`\uD83D\uDCE8 Message handler removed. Total handlers: ${this.messageHandlers.size}`);
  }
  async disconnect() {
    await this.client.disconnect();
    console.log("\uD83D\uDD0C Disconnected from Telegram");
  }
  async sendMessage(chatId, message, replyTo) {
    const result = await this.client.sendMessage(chatId, {
      message,
      replyTo
    });
    return {
      messageId: result.id,
      date: result.date,
      chatId
    };
  }
  async getHistory(chatId, limit) {
    const messages = await this.client.getMessages(chatId, { limit });
    return messages.map((msg) => ({
      id: msg.id,
      text: msg.text || "",
      sender: msg.senderId?.toString() || "unknown",
      date: msg.date,
      chatId
    }));
  }
  async getDialogs(limit) {
    const dialogs = await this.client.getDialogs({ limit });
    return dialogs.map((dialog) => ({
      id: dialog.id.toString(),
      name: dialog.title || dialog.name || "Unknown",
      type: dialog.isUser ? "private" : dialog.isChannel ? "channel" : dialog.isGroup ? "group" : "unknown",
      unreadCount: dialog.unreadCount
    }));
  }
  getClient() {
    return this.client;
  }
}

// src/services/adapters/botapi.adapter.ts
import { Telegraf } from "telegraf";

class BotApiAdapter {
  bot = null;
  config;
  constructor(config) {
    this.config = config;
    if (!config.botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN required for Bot API");
    }
    this.bot = new Telegraf(config.botToken);
  }
  async connect() {
    if (!this.bot) {
      throw new Error("Bot not initialized");
    }
    console.log("\uD83E\uDD16 Connecting via Bot API...");
    try {
      const me = await this.bot.telegram.getMe();
      console.log(`✅ Bot API connected as @${me.username}`);
    } catch (error) {
      console.error("❌ Bot API connection failed:", error);
      throw new Error(`Failed to connect to Telegram Bot API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async disconnect() {
    if (this.bot) {
      await this.bot.stop();
      console.log("\uD83D\uDED1 Bot API disconnected");
    }
  }
  async sendMessage(chatId, message, replyTo) {
    if (!this.bot) {
      throw new Error("Bot not connected");
    }
    const options = replyTo ? { reply_parameters: { message_id: replyTo } } : {};
    const result = await this.bot.telegram.sendMessage(chatId, message, options);
    return {
      messageId: result.message_id,
      date: result.date,
      chatId
    };
  }
  async getHistory(chatId, limit) {
    console.warn("⚠️ Bot API does not support reading message history");
    throw new Error("getHistory not supported by Bot API - use MTProto for userbot features");
  }
  async getDialogs(limit) {
    console.warn("⚠️ Bot API does not support getting dialogs list");
    throw new Error("getDialogs not supported by Bot API - use MTProto for userbot features");
  }
}

// src/services/adapters/mcp.adapter.ts
class McpAdapter {
  config;
  connected = false;
  mcpServerUrl;
  constructor(config) {
    this.config = config;
  }
  async connect() {
    console.log("\uD83D\uDD0C Connecting via MCP...");
    this.connected = true;
    console.log("✅ MCP connected (mock)");
  }
  async disconnect() {
    this.connected = false;
    console.log("\uD83D\uDED1 MCP disconnected");
  }
  async sendMessage(chatId, message, replyTo) {
    if (!this.connected) {
      throw new Error("MCP not connected");
    }
    console.log(`\uD83D\uDCE4 MCP: Send to ${chatId}: ${message}`);
    return {
      messageId: Math.floor(Math.random() * 1e6),
      date: Date.now(),
      chatId
    };
  }
  async getHistory(chatId, limit) {
    if (!this.connected) {
      throw new Error("MCP not connected");
    }
    console.log(`\uD83D\uDCDC MCP: Get history from ${chatId}, limit: ${limit}`);
    return [];
  }
  async getDialogs(limit) {
    if (!this.connected) {
      throw new Error("MCP not connected");
    }
    console.log(`\uD83D\uDCCB MCP: Get dialogs, limit: ${limit}`);
    return [];
  }
}

// src/services/telegram.service.ts
import fs from "node:fs";
import path from "node:path";
var colors = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  cyan: "\x1B[36m",
  yellow: "\x1B[33m",
  white: "\x1B[37m",
  green: "\x1B[32m",
  red: "\x1B[31m",
  magenta: "\x1B[35m",
  blue: "\x1B[34m",
  gray: "\x1B[90m"
};
var colorize = {
  chat: (text) => `${colors.bright}${colors.cyan}${text}${colors.reset}`,
  user: (text) => `${colors.bright}${colors.yellow}${text}${colors.reset}`,
  message: (text) => `${colors.white}${text}${colors.reset}`,
  success: (text) => `${colors.green}${text}${colors.reset}`,
  error: (text) => `${colors.red}${text}${colors.reset}`,
  meta: (text) => `${colors.magenta}${text}${colors.reset}`,
  system: (text) => `${colors.blue}${text}${colors.reset}`,
  time: (text) => `${colors.gray}${text}${colors.reset}`
};

class TelegramService extends Service {
  static serviceType = "telegram-craft";
  serviceType = "telegram-craft";
  static async start(runtime) {
    console.log("\uD83D\uDE80 [TelegramService] static start() called");
    const instance = new TelegramService;
    await instance.initialize(runtime);
    console.log("✅ [TelegramService] static start() completed");
    return instance;
  }
  static async stop(runtime) {
    console.log("\uD83D\uDED1 [TelegramService] static stop() called");
  }
  adapter = null;
  strategy = "mtproto";
  runtime = null;
  autoReplyEnabled = true;
  capabilityDescription = "Telegram userbot управление через MTProto (GramJS) с fallback стратегиями";
  async initialize(runtime) {
    console.log("\uD83D\uDD27 [TelegramService] initialize() called");
    console.log("\uD83D\uDD11 [TelegramService] Runtime received: " + (runtime ? "YES" : "NO"));
    this.runtime = runtime;
    console.log("✅ [TelegramService] Runtime saved!");
    this.strategy = runtime.getSetting("TELEGRAM_STRATEGY") || "mtproto";
    console.log(`\uD83D\uDD27 [TelegramService] Strategy: ${this.strategy}`);
    try {
      switch (this.strategy) {
        case "mtproto":
          console.log("\uD83D\uDD27 [TelegramService] Initializing MTProto adapter...");
          await this.initializeMTProto(runtime);
          console.log("✅ [TelegramService] MTProto adapter initialized");
          break;
        case "botapi":
          console.log("\uD83D\uDD27 [TelegramService] Initializing BotAPI adapter...");
          await this.initializeBotApi(runtime);
          console.log("✅ [TelegramService] BotAPI adapter initialized");
          break;
        case "mcp":
          console.log("\uD83D\uDD27 [TelegramService] Initializing MCP adapter...");
          await this.initializeMcp(runtime);
          console.log("✅ [TelegramService] MCP adapter initialized");
          break;
        default:
          throw new Error(`Unknown Telegram strategy: ${this.strategy}`);
      }
      console.log(`✅ [TelegramService] Service initialized successfully with ${this.strategy}`);
      console.log(`✅ [TelegramService] Adapter is ${this.adapter ? "SET" : "NULL"}`);
    } catch (error) {
      console.error(`❌ [TelegramService] Failed to initialize:`, error);
      throw error;
    }
  }
  async initializeMTProto(runtime) {
    const apiId = runtime.getSetting("TELEGRAM_API_ID");
    const apiHash = runtime.getSetting("TELEGRAM_API_HASH");
    const session = runtime.getSetting("TELEGRAM_SESSION_STRING") || process.env.TELEGRAM_SESSION_STRING;
    console.log(`\uD83D\uDD27 [MTProto] API ID: ${apiId ? "✅ SET" : "❌ MISSING"}`);
    console.log(`\uD83D\uDD27 [MTProto] API Hash: ${apiHash ? "✅ SET" : "❌ MISSING"}`);
    console.log(`\uD83D\uDD27 [MTProto] Session: ${session ? "✅ SET" : "⚠️ OPTIONAL"}`);
    if (!apiId || !apiHash) {
      throw new Error("TELEGRAM_API_ID и TELEGRAM_API_HASH обязательны для MTProto");
    }
    console.log("\uD83D\uDD27 [MTProto] Creating adapter instance...");
    this.adapter = new MTProtoAdapter({
      apiId: parseInt(apiId),
      apiHash,
      session
    });
    console.log("✅ [MTProto] Adapter instance created");
  }
  async initializeBotApi(runtime) {
    const botToken = runtime.getSetting("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN обязателен для Bot API");
    }
    this.adapter = new BotApiAdapter({
      apiId: 0,
      apiHash: "",
      botToken
    });
  }
  async initializeMcp(runtime) {
    this.adapter = new McpAdapter({
      apiId: 0,
      apiHash: ""
    });
  }
  async start() {
    console.log("\uD83D\uDE80 [TelegramService] start() called");
    if (!this.adapter) {
      console.log("⚠️ [TelegramService] Adapter not initialized, initializing now...");
      await this.initializeFromEnv();
    }
    if (!this.adapter) {
      throw new Error("Telegram adapter not initialized");
    }
    try {
      console.log("\uD83D\uDE80 [TelegramService] Connecting adapter...");
      await this.adapter.connect();
      console.log("✅ [TelegramService] Telegram Service started successfully");
      console.log("\uD83D\uDD25 [TelegramService] Auto-starting group monitoring...");
      const result = await this.startGroupMonitoring();
      if (result.success) {
        console.log("✅ [TelegramService] Group monitoring auto-started successfully");
      } else {
        console.error("⚠️ [TelegramService] Failed to auto-start monitoring:", result.error);
      }
    } catch (error) {
      console.error("❌ [TelegramService] Failed to start:", error);
      console.log("⚠️ [TelegramService] Telegram connection failed, but continuing without Telegram functionality...");
    }
  }
  async initializeFromEnv() {
    const strategy = process.env.TELEGRAM_STRATEGY || "mtproto";
    this.strategy = strategy;
    console.log(`\uD83D\uDD27 [TelegramService] Initializing from ENV with strategy: ${strategy}`);
    try {
      switch (strategy) {
        case "mtproto":
          await this.initializeMTProtoFromEnv();
          break;
        case "botapi":
          await this.initializeBotApiFromEnv();
          break;
        case "mcp":
          await this.initializeMcpFromEnv();
          break;
        default:
          throw new Error(`Unknown Telegram strategy: ${strategy}`);
      }
      console.log(`✅ [TelegramService] Initialized from ENV successfully`);
    } catch (error) {
      console.error(`❌ [TelegramService] Failed to initialize from ENV:`, error);
      throw error;
    }
  }
  async initializeMTProtoFromEnv() {
    const apiId = process.env.TELEGRAM_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;
    const session = process.env.TELEGRAM_SESSION_STRING;
    console.log(`\uD83D\uDD27 [MTProto] API ID from ENV: ${apiId ? "✅ SET" : "❌ MISSING"}`);
    console.log(`\uD83D\uDD27 [MTProto] API Hash from ENV: ${apiHash ? "✅ SET" : "❌ MISSING"}`);
    console.log(`\uD83D\uDD27 [MTProto] Session from ENV: ${session ? "✅ SET" : "⚠️ OPTIONAL"}`);
    if (!apiId || !apiHash) {
      throw new Error("TELEGRAM_API_ID и TELEGRAM_API_HASH обязательны для MTProto");
    }
    console.log("\uD83D\uDD27 [MTProto] Creating adapter instance from ENV...");
    this.adapter = new MTProtoAdapter({
      apiId: parseInt(apiId),
      apiHash,
      session
    });
    console.log("✅ [MTProto] Adapter instance created from ENV");
  }
  async initializeBotApiFromEnv() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN обязателен для Bot API");
    }
    this.adapter = new BotApiAdapter({
      apiId: 0,
      apiHash: "",
      botToken
    });
  }
  async initializeMcpFromEnv() {
    this.adapter = new McpAdapter({
      apiId: 0,
      apiHash: ""
    });
  }
  async stop() {
    if (this.adapter) {
      try {
        await this.adapter.disconnect();
        console.log("\uD83D\uDED1 Telegram Service stopped");
      } catch (error) {
        console.error("⚠️ Error stopping Telegram Service:", error);
      }
    }
    this.messageHandlerRegistered = false;
    console.log("\uD83D\uDD12 [TelegramService] Message handler registration flag reset");
  }
  async sendMessage(chatId, message, replyTo) {
    if (!this.adapter) {
      throw new Error("Telegram Service not initialized");
    }
    const allowedGroupId = process.env.ALLOWED_GROUP_ID;
    if (allowedGroupId && chatId !== allowedGroupId) {
      console.log(`⛔ [TelegramService] БЛОКИРОВКА: Попытка написать в чужую группу: ${chatId} (разрешена только ${allowedGroupId})`);
      return {
        success: false,
        error: `Group ${chatId} is not allowed. Only ${allowedGroupId} is permitted.`
      };
    }
    return this.adapter.sendMessage(chatId, message, replyTo);
  }
  async getHistory(chatId, limit = 10) {
    if (!this.adapter) {
      throw new Error("Telegram Service not initialized");
    }
    return this.adapter.getHistory(chatId, limit);
  }
  async getDialogs(limit = 20) {
    if (!this.adapter) {
      throw new Error("Telegram Service not initialized");
    }
    return this.adapter.getDialogs(limit);
  }
  async getUser(userId) {
    if (!this.adapter || !this.adapter.getUser) {
      throw new Error("getUser not supported by current adapter");
    }
    return this.adapter.getUser(userId);
  }
  async joinChat(chatId) {
    if (!this.adapter || !this.adapter.joinChat) {
      throw new Error("joinChat not supported by current adapter");
    }
    return this.adapter.joinChat(chatId);
  }
  async forwardMessage(fromChatId, toChatId, messageId) {
    if (!this.adapter || !this.adapter.forwardMessage) {
      throw new Error("forwardMessage not supported by current adapter");
    }
    return this.adapter.forwardMessage(fromChatId, toChatId, messageId);
  }
  isMonitoring = false;
  monitoredGroups = new Map;
  messageHandlers = new Set;
  totalMessages = 0;
  monitoringStartTime = null;
  liveFeedCallbacks = new Set;
  messageDistributor = null;
  messageHandlerRegistered = false;
  setMessageDistributor(distributor) {
    this.messageDistributor = distributor;
    console.log(`\uD83D\uDCFA [TelegramService] Message distributor установлен`);
  }
  addLiveFeedCallback(callback) {
    this.liveFeedCallbacks.add(callback);
    console.log(`\uD83D\uDCFA [TelegramService] Live feed callback добавлен (всего: ${this.liveFeedCallbacks.size})`);
  }
  removeLiveFeedCallback(callback) {
    this.liveFeedCallbacks.delete(callback);
    console.log(`\uD83D\uDCFA [TelegramService] Live feed callback удален (осталось: ${this.liveFeedCallbacks.size})`);
  }
  sendToLiveFeed(message) {
    try {
      const time = new Date(message.timestamp).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      const header = `${colorize.time(`[${time}]`)} \uD83D\uDCE8 ${colorize.chat(message.chatTitle)}`;
      const sender = `${colorize.user(message.fromFirstName)}${message.fromUsername ? colorize.meta(` ${message.fromUsername}`) : ""}`;
      const messageText = colorize.message(`${message.text.substring(0, 150)}${message.text.length > 150 ? "..." : ""}`);
      const formattedMessage = `${header}
\uD83D\uDC64 ${sender}
\uD83D\uDCAC ${messageText}`;
      this.liveFeedCallbacks.forEach((callback) => {
        try {
          callback(formattedMessage);
        } catch (error) {
          console.error(colorize.error("❌ [TelegramService] Live feed callback error:"), error);
        }
      });
      if (this.messageDistributor) {
        try {
          this.messageDistributor(formattedMessage);
        } catch (error) {
          console.error(colorize.error("❌ [TelegramService] Message distributor error:"), error);
        }
      }
    } catch (error) {
      console.error(colorize.error("❌ [TelegramService] Failed to send to live feed:"), error);
    }
  }
  async startGroupMonitoring() {
    if (this.isMonitoring) {
      return { success: true, message: "Мониторинг уже запущен" };
    }
    if (!this.adapter) {
      return { success: false, message: "Telegram сервис не инициализирован" };
    }
    try {
      this.isMonitoring = true;
      this.monitoringStartTime = new Date;
      this.totalMessages = 0;
      console.log("\uD83D\uDE80 Запущен мониторинг групповых чатов");
      console.log("\uD83D\uDCE1 Стратегия:", this.getStrategy());
      console.log("\uD83D\uDD0D Мониторим все группы где аккаунт участник");
      this.onMessage((message) => {});
      console.log("✅ Подписка на сообщения установлена");
      return {
        success: true,
        message: `Мониторинг запущен для ${this.monitoredGroups.size} групп`
      };
    } catch (error) {
      this.isMonitoring = false;
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      console.error("❌ Ошибка запуска мониторинга:", errorMessage);
      return { success: false, message: "Ошибка запуска", error: errorMessage };
    }
  }
  async stopGroupMonitoring() {
    if (!this.isMonitoring) {
      return { success: true, message: "Мониторинг уже остановлен" };
    }
    this.isMonitoring = false;
    console.log("⏹️ Мониторинг групповых чатов остановлен");
    return { success: true, message: "Мониторинг остановлен" };
  }
  async addGroupToMonitoring(groupId, groupTitle) {
    if (this.monitoredGroups.has(groupId)) {
      return { success: false, message: "Группа уже добавлена в мониторинг" };
    }
    this.monitoredGroups.set(groupId, {
      id: groupId,
      title: groupTitle,
      type: "group"
    });
    console.log(`✅ Группа добавлена в мониторинг: ${groupTitle} (${groupId})`);
    return {
      success: true,
      message: `Группа "${groupTitle}" добавлена в мониторинг`
    };
  }
  async removeGroupFromMonitoring(groupId) {
    const removed = this.monitoredGroups.delete(groupId);
    if (removed) {
      console.log(`\uD83D\uDDD1️ Группа удалена из мониторинга: ${groupId}`);
      return { success: true, message: `Группа ${groupId} удалена из мониторинга` };
    } else {
      return { success: false, message: "Группа не найдена в мониторинге" };
    }
  }
  getMonitoredGroups() {
    return Array.from(this.monitoredGroups.values());
  }
  getMonitoringStats() {
    return {
      totalGroups: this.monitoredGroups.size,
      activeGroups: this.isMonitoring ? this.monitoredGroups.size : 0,
      totalMessages: this.totalMessages,
      uptime: this.monitoringStartTime ? Date.now() - this.monitoringStartTime.getTime() : 0
    };
  }
  isGroupMonitoringActive() {
    return this.isMonitoring;
  }
  async handleIncomingMessage(event) {
    console.log("\uD83C\uDFAF [TelegramService] handleIncomingMessage() called!");
    console.log(`\uD83D\uDD0D [TelegramService] Monitoring active: ${this.isMonitoring}`);
    if (!this.isMonitoring) {
      console.log("⏸️ [TelegramService] Monitoring is not active, ignoring message");
      return;
    }
    try {
      const message = event.message;
      const finalChatId = event.chatId || this.extractChatId(message.peerId);
      const chatTitle = event.chatTitle || "Unknown Chat";
      console.log(`\uD83D\uDCE8 [TelegramService] Processing message from chat:`, {
        chatId: finalChatId,
        chatTitle,
        sender: event.senderId || message.senderId?.toString(),
        messageId: message.id
      });
      const fromUserId = event.senderId || message.senderId?.toString() || "unknown";
      const fromUsername = event.senderUsername || "";
      const fromFirstName = event.senderFirstName || "Unknown";
      const fromLastName = event.senderLastName || "";
      const fullName = fromLastName ? `${fromFirstName} ${fromLastName}` : fromFirstName;
      const usernameDisplay = fromUsername ? `@${fromUsername}` : "";
      this.totalMessages++;
      const processedMessage = {
        messageId: message.id,
        chatId: finalChatId,
        chatTitle,
        fromUserId,
        fromUsername: usernameDisplay,
        fromFirstName: fullName,
        text: message.text || message.message || "",
        timestamp: new Date(message.date * 1000),
        hasMedia: message.media ? true : false,
        mediaType: this.detectMediaType(message.media)
      };
      const allowedGroupId = process.env.ALLOWED_GROUP_ID;
      if (allowedGroupId && finalChatId !== allowedGroupId) {
        console.log(`⛔ [TelegramService] ИГНОРИРУЕМ сообщение из неразрешённой группы: ${finalChatId} (разрешена только ${allowedGroupId})`);
        console.log(`   \uD83D\uDCCD Группа: "${chatTitle}"`);
        console.log(`   \uD83D\uDCAC Сообщение: "${(message.text || message.message || "").substring(0, 50)}..."`);
        return;
      }
      const shouldMonitor = this.monitoredGroups.has(finalChatId) || this.monitoredGroups.has(chatTitle) || allowedGroupId && finalChatId === allowedGroupId;
      console.log(`\uD83D\uDD0D [TelegramService] Should monitor this chat: ${shouldMonitor}`);
      console.log(`\uD83D\uDCAC [TelegramService] Message text preview:`, {
        text: (message.text || message.message || "").substring(0, 100),
        chatTitle,
        fromFirstName
      });
      if (shouldMonitor) {
        this.saveMessageToHistory(processedMessage);
        this.sendToLiveFeed(processedMessage);
        this.messageHandlers.forEach((handler) => {
          try {
            handler(processedMessage);
          } catch (error) {
            console.error("❌ Ошибка в обработчике сообщения:", error);
          }
        });
        const timestamp = new Date().toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        console.log(`${colorize.time(`[${timestamp}]`)} \uD83D\uDCE8 ${colorize.chat(chatTitle)} » ${colorize.user(fromFirstName)}${usernameDisplay ? colorize.meta(` ${usernameDisplay}`) : ""}: ${colorize.message(processedMessage.text?.substring(0, 100) || "...")}`);
        this.checkTriggerWords(processedMessage);
        console.log(`\uD83D\uDD25 [TelegramService] BEFORE generateAndSendReply - runtime: ${this.runtime ? "SET" : "NULL"}`);
        await this.generateAndSendReply(processedMessage);
        console.log(`✅ [TelegramService] AFTER generateAndSendReply`);
      }
    } catch (error) {
      console.error("❌ [TelegramService] Ошибка обработки сообщения:", error);
    }
  }
  extractChatId(peerId) {
    if (!peerId)
      return "unknown";
    if (peerId.userId)
      return peerId.userId.toString();
    if (peerId.chatId)
      return peerId.chatId.toString();
    if (peerId.channelId)
      return peerId.channelId.toString();
    return peerId.toString?.() || "unknown";
  }
  detectMediaType(media) {
    if (!media)
      return;
    if (media._ === "MessageMediaPhoto")
      return "photo";
    if (media._ === "MessageMediaDocument") {
      const mimeType = media.document?.mimeType || "";
      if (mimeType.startsWith("video/"))
        return "video";
      if (mimeType.startsWith("audio/"))
        return "audio";
      return "document";
    }
    if (media._ === "MessageMediaVoice")
      return "voice";
    if (media._ === "MessageMediaGeo")
      return "location";
    return "unknown";
  }
  checkTriggerWords(message) {
    const triggerWords = [
      "help",
      "помощь",
      "пожаловаться",
      "report",
      "urgent",
      "срочно"
    ];
    const text = message.text?.toLowerCase() || "";
    const foundTriggers = triggerWords.filter((word) => text.includes(word));
    if (foundTriggers.length > 0) {
      console.log(`⚠️ Триггерные слова найдены: ${foundTriggers.join(", ")}`);
      console.log(`\uD83D\uDCCD В чате: ${message.chatTitle}`);
      console.log(`\uD83D\uDC64 От: ${message.fromFirstName} (${message.fromUserId})`);
      console.log(`\uD83D\uDCAC Сообщение: ${message.text?.substring(0, 100)}...`);
      this.sendTriggerNotification(message, foundTriggers);
    }
  }
  sendTriggerNotification(message, foundTriggers) {
    try {
      const timestamp = new Date().toISOString();
      const monitoringChannelId = process.env.TELEGRAM_MONITORING_CHANNEL_ID;
      const notificationText = `\uD83D\uDEA8 ТРИГГЕР ОБНАРУЖЕН
\uD83D\uDCCD Чат: ${message.chatTitle}
\uD83D\uDC64 От: ${message.fromFirstName} (${message.fromUserId})
\uD83D\uDD11 Слова: ${foundTriggers.join(", ")}
\uD83D\uDCAC Сообщение: ${message.text?.substring(0, 150)}${message.text && message.text.length > 150 ? "..." : ""}
⏰ Время: ${timestamp}`;
      if (monitoringChannelId) {
        this.sendMessage(monitoringChannelId, notificationText).catch((error) => {
          console.error("❌ Ошибка отправки уведомления в канал мониторинга:", error);
        });
      }
      const logFilePath = path.join(process.cwd(), "trigger-alerts.log");
      const logEntry = `[${timestamp}] TRIGGER ALERT
Chat: ${message.chatTitle} (${message.chatId})
From: ${message.fromFirstName} (${message.fromUserId})
Triggers: ${foundTriggers.join(", ")}
Message: ${message.text}
---
`;
      fs.appendFileSync(logFilePath, logEntry);
      console.log(`\uD83D\uDCDD Записано в лог: ${logFilePath}`);
    } catch (error) {
      console.error("❌ Ошибка при отправке уведомления о триггере:", error);
    }
  }
  async generateAndSendReply(processedMessage) {
    if (!this.runtime) {
      console.log("⚠️ [TelegramService] Runtime not available, skipping auto-reply");
      return;
    }
    if (!this.autoReplyEnabled) {
      console.log("⏸️ [TelegramService] Auto-reply disabled, skipping");
      return;
    }
    try {
      console.log(`\uD83E\uDD16 [TelegramService] Generating reply for message from ${processedMessage.fromFirstName}...`);
      if (!this.runtime.messageManager) {
        console.log("⚠️ [TelegramService] messageManager not available, using simplified mode");
        const simpleReply = this.generateSimpleReply(processedMessage.text, processedMessage.fromFirstName);
        await this.sendMessage(processedMessage.chatId, simpleReply, processedMessage.messageId);
        return;
      }
      const userMemory = {
        id: stringToUuid(`telegram-${processedMessage.chatId}-${processedMessage.messageId}-${Date.now()}`),
        userId: stringToUuid(`telegram-user-${processedMessage.fromUserId}`),
        agentId: this.runtime.agentId,
        roomId: stringToUuid(`telegram-room-${processedMessage.chatId}`),
        content: {
          text: processedMessage.text,
          source: "telegram",
          metadata: {
            chatId: processedMessage.chatId,
            chatTitle: processedMessage.chatTitle,
            messageId: processedMessage.messageId,
            fromUsername: processedMessage.fromUsername,
            fromFirstName: processedMessage.fromFirstName
          }
        },
        createdAt: processedMessage.timestamp.getTime()
      };
      await this.runtime.messageManager.createMemory(userMemory);
      const roomId = stringToUuid(`telegram-room-${processedMessage.chatId}`);
      const conversationHistory = await this.runtime.messageManager.getMemories({
        roomId,
        count: 10,
        unique: true
      });
      console.log(`\uD83D\uDCDA [TelegramService] Получено ${conversationHistory.length} сообщений из истории для контекста`);
      const state = await this.runtime.composeState(userMemory);
      const response = await this.runtime.processActions(userMemory, conversationHistory, state, async (response2) => {
        if (response2.content?.text) {
          console.log(`\uD83D\uDCAC [TelegramService] Sending reply: ${response2.content.text.substring(0, 100)}...`);
          await this.sendMessage(processedMessage.chatId, response2.content.text, processedMessage.messageId);
          const timestamp = new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
          console.log(`${colorize.time(`[${timestamp}]`)} \uD83D\uDCE4 ${colorize.chat(processedMessage.chatTitle)} » ${colorize.success("VIBEE")}: ${colorize.message(response2.content.text.substring(0, 100))}`);
        }
      });
      console.log(`✅ [TelegramService] Reply generation completed`);
    } catch (error) {
      console.error(`❌ [TelegramService] Failed to generate reply:`, error);
      const fallbackReply = this.generateSimpleReply(processedMessage.text, processedMessage.fromFirstName);
      try {
        await this.sendMessage(processedMessage.chatId, fallbackReply, processedMessage.messageId);
      } catch (sendError) {
        console.error(`❌ [TelegramService] Failed to send fallback message:`, sendError);
      }
    }
  }
  generateSimpleReply(messageText, fromFirstName) {
    const text = messageText.toLowerCase().trim();
    if (text.includes("привет") || text.includes("hi") || text.includes("hello")) {
      const greetings = [
        `Привет, ${fromFirstName}! Как дела? \uD83D\uDE0A`,
        `Здравствуй, ${fromFirstName}! Чем могу помочь?`,
        `Привет! Рад тебя видеть, ${fromFirstName}!`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    if (text.includes("как дела") || text.includes("как ты")) {
      return `Спасибо что спросил, ${fromFirstName}! Дела отлично, изучаю новое и готов к интересным задачам! А у тебя как?`;
    }
    if (text.includes("помощь") || text.includes("help")) {
      return `Конечно, ${fromFirstName}! Я готов помочь. Что конкретно тебя интересует?`;
    }
    if (text.includes("спасибо") || text.includes("thanks")) {
      return `Пожалуйста, ${fromFirstName}! Рад был помочь! \uD83D\uDC4D`;
    }
    if (text.includes("работа") || text.includes("дела")) {
      return `Понимаю, ${fromFirstName}. Работа бывает разной. Если нужна помощь или совет - обращайся!`;
    }
    if (text.includes("?")) {
      return `Интересный вопрос, ${fromFirstName}! Дай-ка подумаю... Это зависит от контекста, но я готов обсудить это с тобой.`;
    }
    const generalReplies = [
      `Понятно, ${fromFirstName}! Расскажи подробнее, что думаешь об этом?`,
      `Интересно, ${fromFirstName}! Я слушаю.`,
      `${fromFirstName}, это любопытно. Какие у тебя мысли на этот счет?`,
      `Понял тебя, ${fromFirstName}. А что ты об этом думаешь?`,
      `${fromFirstName}, давай разберем это вместе!`
    ];
    return generalReplies[Math.floor(Math.random() * generalReplies.length)];
  }
  onMessage(handler) {
    console.log("\uD83D\uDD17 [TelegramService] onMessage() called");
    this.messageHandlers.add(handler);
    console.log(`\uD83D\uDCE8 [TelegramService] Подписка на сообщения установлена (${this.messageHandlers.size} обработчиков)`);
    if (!this.messageHandlerRegistered && this.adapter?.onMessage) {
      console.log("✅ [TelegramService] Adapter supports onMessage, registering handler...");
      const adapterHandler = (event) => {
        console.log("\uD83D\uDCE5 [TelegramService] Adapter handler called, forwarding to handleIncomingMessage");
        this.handleIncomingMessage(event);
      };
      this.adapter.onMessage(adapterHandler);
      this.messageHandlerRegistered = true;
      console.log("✅ [TelegramService] Handler registered with adapter (ONCE ONLY)");
    } else if (!this.adapter?.onMessage) {
      console.log("⚠️ [TelegramService] Adapter does NOT support onMessage!");
    } else {
      console.log(`\uD83D\uDD12 [TelegramService] Handler already registered (skipping duplicate registration)`);
    }
  }
  offMessage(handler) {
    this.messageHandlers.delete(handler);
    console.log(`\uD83D\uDCE8 Отписка от сообщений (${this.messageHandlers.size} обработчиков)`);
  }
  getStrategy() {
    return this.strategy;
  }
  isConnected() {
    return this.adapter !== null;
  }
  hasMessageDistributor() {
    return this.messageDistributor !== null;
  }
  async getAllGroups() {
    if (!this.adapter) {
      throw new Error("Telegram Service not initialized");
    }
    try {
      const dialogs = await this.adapter.getDialogs(100);
      return dialogs.filter((d) => d.name !== "Unknown").map((dialog) => ({
        id: dialog.id,
        title: dialog.name,
        type: dialog.type || "unknown",
        unreadCount: dialog.unreadCount || 0,
        isMonitored: this.monitoredGroups.has(dialog.id) || this.monitoredGroups.has(dialog.name)
      }));
    } catch (error) {
      console.error("❌ Failed to get groups:", error);
      return [];
    }
  }
  recentMessages = [];
  saveMessageToHistory(message) {
    this.recentMessages.unshift({
      chatId: message.chatId,
      chatTitle: message.chatTitle,
      fromUsername: message.fromUsername || message.fromFirstName,
      text: message.text,
      timestamp: message.timestamp
    });
    if (this.recentMessages.length > 100) {
      this.recentMessages = this.recentMessages.slice(0, 100);
    }
  }
  getRecentMessages(limit = 50) {
    return this.recentMessages.slice(0, limit);
  }
}

// src/plugin.ts
var telegramCraftPlugin = {
  name: "telegram-craft",
  description: "ElizaOS plugin для Telegram userbot через MTProto (GramJS) с fallback стратегиями",
  actions: [
    sendMessageAction,
    readHistoryAction,
    getDialogsAction,
    startGroupMonitoringAction,
    addGroupToMonitorAction,
    liveFeedAction
  ],
  providers: [
    recentMessagesProvider,
    dialogsListProvider,
    capabilitiesProvider,
    liveMessagesProvider,
    autoMessageForwarderProvider
  ],
  evaluators: [
    messageAutoForwardEvaluator
  ],
  services: [new TelegramService],
  init: async (config, runtime) => {
    console.log("\uD83D\uDD27 Initializing Telegram Craft Plugin...");
    try {
      const validatedConfig = await TelegramConfigSchema.parseAsync({
        TELEGRAM_API_ID: config.TELEGRAM_API_ID || process.env.TELEGRAM_API_ID,
        TELEGRAM_API_HASH: config.TELEGRAM_API_HASH || process.env.TELEGRAM_API_HASH,
        TELEGRAM_SESSION: config.TELEGRAM_SESSION_STRING || process.env.TELEGRAM_SESSION_STRING,
        TELEGRAM_STRATEGY: config.TELEGRAM_STRATEGY || process.env.TELEGRAM_STRATEGY || "mtproto",
        TELEGRAM_BOT_TOKEN: config.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_PHONE: config.TELEGRAM_PHONE || process.env.TELEGRAM_PHONE,
        TELEGRAM_PASSWORD: config.TELEGRAM_PASSWORD || process.env.TELEGRAM_PASSWORD
      });
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) {
          process.env[key] = String(value);
        }
      }
      console.log("✅ [Plugin] TelegramService will be auto-registered by ElizaOS");
      console.log("\uD83D\uDD0D [Plugin] Services in plugin definition:", telegramCraftPlugin.services?.length || 0);
      console.log("\uD83D\uDD0D [Plugin] Service types:", telegramCraftPlugin.services?.map((s) => s.serviceType));
      console.log(`✅ Telegram Craft Plugin initialized with strategy: ${validatedConfig.TELEGRAM_STRATEGY}`);
      console.log(`\uD83D\uDCE6 Registered ${telegramCraftPlugin.actions?.length || 0} actions`);
      console.log(`\uD83D\uDCE1 Registered ${telegramCraftPlugin.providers?.length || 0} providers`);
      console.log(`⚙️  Registered ${telegramCraftPlugin.services?.length || 0} services`);
    } catch (error) {
      console.error("❌ Failed to initialize Telegram Craft Plugin:", error);
      throw error;
    }
  }
};
export {
  telegramCraftPlugin,
  startGroupMonitoringAction,
  sendMessageAction,
  recentMessagesProvider,
  readHistoryAction,
  getDialogsAction,
  dialogsListProvider,
  telegramCraftPlugin as default,
  capabilitiesProvider,
  addGroupToMonitorAction,
  TelegramUserSchema,
  TelegramService,
  TelegramMessageSchema,
  TelegramDialogSchema,
  TelegramConfigSchema,
  TelegramChatIdSchema,
  SendMessageInputSchema,
  ReadHistoryInputSchema,
  McpAdapter,
  MTProtoAdapter,
  JoinChatInputSchema,
  GetUserInputSchema,
  GetDialogsInputSchema,
  ForwardMessageInputSchema,
  BotApiAdapter
};

//# debugId=3979AAC91E0D00C964756E2164756E21
//# sourceMappingURL=index.js.map

#!/usr/bin/env bun
/**
 * Скрипт для централизованного управления чатами
 *
 * Использование:
 * bun scripts/manage-chats.ts status                    # Показать статус всех чатов
 * bun scripts/manage-chats.ts enable sales -4832231272  # Включить чат
 * bun scripts/manage-chats.ts disable sales -4832231272 # Отключить чат
 * bun scripts/manage-chats.ts interval sales 180        # Установить интервал (минуты)
 * bun scripts/manage-chats.ts list sales                # Список чатов агента
 */

import { ChatManager } from "../plugin-telegram-craft/src/config/chat-management";

const command = process.argv[2];
const agentId = process.argv[3];
const chatIdOrInterval = process.argv[4];

async function main() {
  try {
    switch (command) {
      case "status":
        const report = ChatManager.getStatusReport();
        console.log(report);
        break;

      case "list":
        if (!agentId) {
          console.error(
            "❌ Укажите ID агента: bun scripts/manage-chats.ts list <agentId>"
          );
          console.log(
            "Доступные агенты: sales, vibee, kols, videoExpert, photoExpert, musicExpert"
          );
          process.exit(1);
        }
        const agentStatus = ChatManager.getAgentStatus(agentId);
        if (!agentStatus) {
          console.error(`❌ Агент ${agentId} не найден`);
          process.exit(1);
        }
        console.log(`\n🤖 ${agentStatus.agentName} (${agentId})`);
        console.log(
          `   ⏰ Интервал: ${agentStatus.proactiveIntervalMinutes} минут`
        );
        console.log(
          `   📊 Активных: ${agentStatus.activeChatsCount}/${agentStatus.totalChatsCount}`
        );
        console.log(
          `   🔄 Проактивный режим: ${agentStatus.proactiveEnabled ? "✅ Включен" : "❌ Выключен"}\n`
        );
        console.log("Чаты:");
        for (const chat of agentStatus.chats) {
          const status = chat.isActive ? "✅" : "❌";
          console.log(`   ${status} ${chat.chatName}`);
          console.log(`      ID: ${chat.chatId}`);
          console.log(
            `      Вероятность ответа: ${chat.responseProbability * 100}%`
          );
        }
        break;

      case "enable":
        if (!agentId || !chatIdOrInterval) {
          console.error(
            "❌ Укажите агента и ID чата: bun scripts/manage-chats.ts enable <agentId> <chatId>"
          );
          process.exit(1);
        }
        const enabled = ChatManager.enableChat(agentId, chatIdOrInterval);
        if (enabled) {
          console.log(
            `✅ Чат ${chatIdOrInterval} включен для агента ${agentId}`
          );
          console.log(
            "⚠️  Перезапустите агентов для применения изменений: bun dev"
          );
        } else {
          console.error(`❌ Не удалось включить чат ${chatIdOrInterval}`);
          process.exit(1);
        }
        break;

      case "disable":
        if (!agentId || !chatIdOrInterval) {
          console.error(
            "❌ Укажите агента и ID чата: bun scripts/manage-chats.ts disable <agentId> <chatId>"
          );
          process.exit(1);
        }
        const disabled = ChatManager.disableChat(agentId, chatIdOrInterval);
        if (disabled) {
          console.log(
            `❌ Чат ${chatIdOrInterval} отключен для агента ${agentId}`
          );
          console.log(
            "⚠️  Перезапустите агентов для применения изменений: bun dev"
          );
        } else {
          console.error(`❌ Не удалось отключить чат ${chatIdOrInterval}`);
          process.exit(1);
        }
        break;

      case "interval":
        if (!agentId || !chatIdOrInterval) {
          console.error(
            "❌ Укажите агента и интервал: bun scripts/manage-chats.ts interval <agentId> <минуты>"
          );
          process.exit(1);
        }
        const interval = parseInt(chatIdOrInterval, 10);
        if (isNaN(interval) || interval < 1) {
          console.error("❌ Интервал должен быть числом (минуты)");
          process.exit(1);
        }
        const intervalSet = ChatManager.setProactiveInterval(agentId, interval);
        if (intervalSet) {
          console.log(
            `⏰ Интервал проактивной рассылки установлен: ${interval} минут для агента ${agentId}`
          );
          console.log(
            "⚠️  Перезапустите агентов для применения изменений: bun dev"
          );
        } else {
          console.error(`❌ Не удалось установить интервал`);
          process.exit(1);
        }
        break;

      case "proactive-on":
        if (!agentId) {
          console.error(
            "❌ Укажите агента: bun scripts/manage-chats.ts proactive-on <agentId>"
          );
          process.exit(1);
        }
        const enabledProactive = ChatManager.enableProactive(agentId);
        if (enabledProactive) {
          console.log(`✅ Проактивный режим включен для агента ${agentId}`);
          console.log(
            "⚠️  Перезапустите агентов для применения изменений: bun dev"
          );
        } else {
          console.error(`❌ Не удалось включить проактивный режим`);
          process.exit(1);
        }
        break;

      case "proactive-off":
        if (!agentId) {
          console.error(
            "❌ Укажите агента: bun scripts/manage-chats.ts proactive-off <agentId>"
          );
          process.exit(1);
        }
        const disabledProactive = ChatManager.disableProactive(agentId);
        if (disabledProactive) {
          console.log(`❌ Проактивный режим отключен для агента ${agentId}`);
          console.log(
            "⚠️  Перезапустите агентов для применения изменений: bun dev"
          );
        } else {
          console.error(`❌ Не удалось отключить проактивный режим`);
          process.exit(1);
        }
        break;

      default:
        console.log(`
📋 Централизованное управление чатами

Команды:
  status                    - Показать статус всех чатов
  list <agentId>            - Список чатов агента
  enable <agentId> <chatId> - Включить чат
  disable <agentId> <chatId> - Отключить чат
  interval <agentId> <мин>  - Установить интервал рассылки
  proactive-on <agentId>    - Включить проактивный режим
  proactive-off <agentId>   - Отключить проактивный режим

Примеры:
  bun scripts/manage-chats.ts status
  bun scripts/manage-chats.ts list sales
  bun scripts/manage-chats.ts disable sales -4832231272
  bun scripts/manage-chats.ts interval sales 180
        `);
        break;
    }
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

main();


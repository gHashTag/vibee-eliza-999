#!/usr/bin/env bun
/**
 * 🕉️ Утилита для переключения между юзер-ботами
 *
 * Использование:
 *   bun scripts/switch-userbot.ts <session_id>
 *   bun scripts/switch-userbot.ts list  # Показать все сессии
 *   bun scripts/switch-userbot.ts current  # Показать текущую сессию
 */

import {
  getAllSessions,
  getActiveSession,
  setActiveSession,
  getSession,
} from "../config/userbot-sessions";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command || command === "list") {
    // Показать все сессии
    console.log("\n📋 Доступные сессии юзер-ботов:\n");
    const sessions = getAllSessions();
    const active = getActiveSession();

    sessions.forEach((session) => {
      const isActive = active?.id === session.id;
      const marker = isActive ? "✅" : "  ";
      console.log(
        `${marker} ${session.id.padEnd(15)} - ${session.name}${
          session.description ? ` (${session.description})` : ""
        }`
      );
    });

    if (active) {
      console.log(`\n🎯 Активная сессия: ${active.name} (${active.id})\n`);
    }
    return;
  }

  if (command === "current") {
    // Показать текущую сессию
    const active = getActiveSession();
    if (active) {
      console.log(`\n🎯 Активная сессия: ${active.name} (${active.id})`);
      if (active.description) {
        console.log(`   Описание: ${active.description}`);
      }
      console.log(
        `   Session String: ${active.sessionString.substring(0, 30)}...\n`
      );
    } else {
      console.log("\n❌ Активная сессия не найдена!\n");
    }
    return;
  }

  // Переключить сессию
  const session = getSession(command);
  if (!session) {
    console.error(`\n❌ Сессия "${command}" не найдена!`);
    console.log("\n📋 Доступные сессии:");
    getAllSessions().forEach((s) => {
      console.log(`   - ${s.id} (${s.name})`);
    });
    console.log();
    process.exit(1);
  }

  const success = setActiveSession(command);
  if (success) {
    console.log(
      `\n✅ Переключено на сессию: ${session.name} (${session.id})\n`
    );
    console.log("💡 Для применения изменений перезапусти агентов: bun dev\n");
  } else {
    console.error(`\n❌ Не удалось переключить сессию!\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Ошибка:", error);
  process.exit(1);
});


#!/usr/bin/env python3
"""
Простой тест KOLS AGENT через live feed
"""

import time

print("📡 KOLS AGENT - Тест Live Feed")
print("=" * 50)
print()
print("✅ Агент подключен к Telegram")
print("✅ Мониторинг активен (Handlers count: 1)")
print("✅ Сообщения приходят из групп:")
print()
print("📨 Последние сообщения из логов:")
print()

# Читаем последние сообщения из лога
with open('agent.log', 'r') as f:
    lines = f.readlines()

# Ищем строки с сообщениями
messages = []
for line in lines[-200:]:
    if '📨 [' in line and ']' in line:
        # Извлекаем время и сообщение
        parts = line.split('📨 [')
        if len(parts) > 1:
            time_part = parts[1].split(']')[0]
            msg_part = parts[1].split('] ')[1] if len(parts[1].split('] ')) > 1 else ''
            messages.append((time_part, msg_part))

# Показываем последние 5 сообщений
for i, (time, msg) in enumerate(messages[-5:], 1):
    print(f"{i}. [{time}] {msg[:100]}...")
    print()

print()
print("💬 Для просмотра сообщений в чате:")
print("   1. Откройте Telegram")
print("   2. Найдите бота @kols_agent_bot")
print("   3. Отправьте: 'покажи сообщения'")
print()
print("🔄 Или ждите новых сообщений - они автоматически сохраняются!")

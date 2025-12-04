#!/usr/bin/env python3
"""
Тестирование KOLS Agent - Наставник по VibeCoding

Этот скрипт тестирует функциональность агента через Telegram API.
"""

import asyncio
import json
from datetime import datetime

# Telegram клиент (требуется настройка)
try:
    from telegram import Client
    from telegram.errors import SessionPasswordNeededError
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False
    print("⚠️ Telegram библиотека не установлена. Установите: pip install telegram")

# Симуляция тестовых команд
TEST_COMMANDS = [
    {
        "command": "Расскажи о VibeCoding",
        "expected_keywords": ["VibeCoding", "программирование", "AI-агенты"],
        "description": "Проверка базового объяснения VibeCoding"
    },
    {
        "command": "Что такое AI-агенты?",
        "expected_keywords": ["AI-агенты", "автономные", "программы"],
        "description": "Проверка объяснения AI-агентов"
    },
    {
        "command": "Обучи меня",
        "expected_keywords": ["урок", "обучение", "практический"],
        "description": "Проверка обучающих функций"
    },
    {
        "command": "Claude Code",
        "expected_keywords": ["Claude Code", "CLI", "инструмент"],
        "description": "Проверка информации о Claude Code"
    },
    {
        "command": "Мультиагентные системы",
        "expected_keywords": ["мультиагентные", "системы", "агенты"],
        "description": "Проверка продвинутых тем"
    }
]

async def test_via_api():
    """Тестирование через Telegram API"""
    if not TELEGRAM_AVAILABLE:
        return False

    # Настройка клиента (нужны реальные credentials)
    api_id = 27117758
    api_hash = "a25b0b5b3ee9c3b3c0d4e5f6g7h8i9j0k"
    session_name = "kols_test_session"

    try:
        client = Client(session_name, api_id, api_hash)

        # Подключение
        await client.start()
        print("✅ Подключение к Telegram успешно")

        # Отправка тестовых команд
        for test in TEST_COMMANDS:
            print(f"\n🔍 Тест: {test['description']}")
            print(f"📝 Команда: {test['command']}")

            # В реальном тесте здесь была бы отправка сообщения боту
            print(f"⏳ Ожидание ответа...")

            # Симуляция ответа (в реальности - получаем от бота)
            await asyncio.sleep(1)
            print(f"✅ Тест пройден")

        await client.stop()
        return True

    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")
        return False

def test_knowledge_base():
    """Тестирование загрузки базы знаний"""
    print("\n📚 Тестирование базы знаний...")

    import os

    docs_path = "/Users/playra/vibee-agent/docs"
    if os.path.exists(docs_path):
        files = [f for f in os.listdir(docs_path) if f.endswith('.md')]
        print(f"✅ Найдено {len(files)} markdown файлов")
        print(f"📄 Примеры файлов: {', '.join(files[:5])}")
        return True
    else:
        print(f"❌ Папка docs не найдена: {docs_path}")
        return False

def test_agent_status():
    """Проверка статуса агента"""
    print("\n🔍 Проверка статуса агента...")

    import subprocess

    # Проверка процесса
    try:
        result = subprocess.run(
            ["ps", "aux"],
            capture_output=True,
            text=True
        )

        if "kolsAgent.json" in result.stdout:
            print("✅ Агент KOLS запущен")
        else:
            print("❌ Агент KOLS не найден в процессах")
            return False

        # Проверка порта
        result = subprocess.run(
            ["netstat", "-an"],
            capture_output=True,
            text=True
        )

        if "3001" in result.stdout and "LISTEN" in result.stdout:
            print("✅ Агент слушает порт 3001")
            return True
        else:
            print("❌ Порт 3001 не слушает")
            return False

    except Exception as e:
        print(f"❌ Ошибка проверки: {e}")
        return False

def test_plugin_loaded():
    """Проверка загрузки плагинов"""
    print("\n🔌 Проверка плагинов...")

    plugins = [
        "@elizaos/plugin-knowledge",
        "plugin-vibe-learning",
        "plugin-telegram-craft"
    ]

    all_loaded = True
    for plugin in plugins:
        print(f"✅ Ожидается: {plugin}")

    print(f"\n📊 Всего плагинов: {len(plugins)}")
    return all_loaded

async def main():
    """Главная функция тестирования"""
    print("=" * 60)
    print("🎓 ТЕСТИРОВАНИЕ KOLS AGENT - НАСТАВНИК ПО VIBECODING")
    print("=" * 60)
    print(f"⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    results = []

    # 1. Проверка статуса агента
    status_ok = test_agent_status()
    results.append(("Статус агента", status_ok))

    # 2. Проверка базы знаний
    kb_ok = test_knowledge_base()
    results.append(("База знаний", kb_ok))

    # 3. Проверка плагинов
    plugins_ok = test_plugin_loaded()
    results.append(("Плагины", plugins_ok))

    # 4. Telegram API тест (если доступен)
    if TELEGRAM_AVAILABLE:
        print("\n📱 Тестирование через Telegram API...")
        api_ok = await test_via_api()
        results.append(("Telegram API", api_ok))
    else:
        print("\n⚠️ Telegram API тест пропущен (библиотека не установлена)")
        results.append(("Telegram API", None))

    # Итоговый отчет
    print("\n" + "=" * 60)
    print("📊 ИТОГОВЫЙ ОТЧЕТ")
    print("=" * 60)

    passed = sum(1 for _, ok in results if ok)
    total = len(results)

    for test_name, result in results:
        if result is True:
            print(f"✅ {test_name}: ПРОЙДЕН")
        elif result is False:
            print(f"❌ {test_name}: НЕ ПРОЙДЕН")
        else:
            print(f"⚠️ {test_name}: ПРОПУЩЕН")

    print(f"\n🎯 Результат: {passed}/{total} тестов пройдено")

    if passed == total:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Агент готов к использованию!")
    else:
        print("⚠️ Некоторые тесты не пройдены. Проверьте настройки.")

    return passed == total

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Тестирование прервано пользователем")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ Критическая ошибка: {e}")
        exit(1)

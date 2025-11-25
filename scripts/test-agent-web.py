#!/usr/bin/env python3
"""
Веб-тест агента "Нейрофото Персонажа" через HTTP API
Проверка работы через Web UI без Telegram
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:3000"
AGENT_NAME = "Нейрофото"

def check_health():
    """Проверка здоровья агента"""
    print("=" * 60)
    print("🏥 ПРОВЕРКА ЗДОРОВЬЯ АГЕНТА")
    print("=" * 60)

    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Агент здоров и доступен")
            print(f"   URL: {BASE_URL}")
            print(f"   Status: {response.status_code}")
            return True
        else:
            print(f"❌ Агент недоступен: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка подключения: {str(e)}")
        return False

def check_plugins():
    """Проверка загруженных плагинов"""
    print("\n" + "=" * 60)
    print("🔌 ПРОВЕРКА ПЛАГИНОВ")
    print("=" * 60)

    try:
        response = requests.get(f"{BASE_URL}/api/plugins", timeout=5)
        if response.status_code == 200:
            plugins = response.json()
            print("✅ Загруженные плагины:")

            for plugin in plugins:
                name = plugin.get('name', 'unknown')
                print(f"   • {name}")

            # Проверяем, есть ли наш плагин
            plugin_names = [p.get('name', '') for p in plugins]
            if 'neurophoto' in str(plugin_names).lower():
                print("\n✅ Плагин Avatar Face загружен")
                return True
            else:
                print("\n⚠️  Плагин Avatar Face не найден")
                return False
        else:
            print(f"❌ Ошибка получения плагинов: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка: {str(e)}")
        return False

def check_database():
    """Проверка подключения к базе данных"""
    print("\n" + "=" * 60)
    print("💾 ПРОВЕРКА БАЗЫ ДАННЫХ")
    print("=" * 60)

    try:
        # Проверяем, есть ли модели в БД
        response = requests.get(f"{BASE_URL}/api/models", timeout=5)
        if response.status_code == 200:
            models = response.json()
            print(f"✅ База данных доступна")
            print(f"   Найдено моделей: {len(models)}")

            if models:
                print("\n📊 Модели в БД:")
                for model in models[:3]:  # Показываем первые 3
                    name = model.get('model_name', 'unknown')
                    status = model.get('status', 'unknown')
                    print(f"   • {name} - {status}")
            return True
        else:
            print(f"❌ Ошибка доступа к БД: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка: {str(e)}")
        return False

def check_web_ui():
    """Проверка веб-интерфейса"""
    print("\n" + "=" * 60)
    print("🌐 ПРОВЕРКА WEB UI")
    print("=" * 60)

    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Веб-интерфейс доступен")
            print(f"   Откройте браузер: {BASE_URL}")
            return True
        else:
            print(f"❌ Веб-интерфейс недоступен: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка: {str(e)}")
        return False

def main():
    """Главная функция"""
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║              🌈 WEB API TESTER                              ║
    ║         Агент 'Нейрофото Персонажа'                          ║
    ║         Проверка через HTTP API                             ║
    ╚══════════════════════════════════════════════════════════════╝
    """)

    print(f"🎯 Тестируем агента: {AGENT_NAME}")
    print(f"🌐 URL: {BASE_URL}\n")

    results = {
        "health": check_health(),
        "plugins": check_plugins(),
        "database": check_database(),
        "web_ui": check_web_ui()
    }

    print("\n" + "=" * 60)
    print("📊 ИТОГОВЫЕ РЕЗУЛЬТАТЫ")
    print("=" * 60)

    for test_name, passed in results.items():
        status = "✅ ПРОЙДЕН" if passed else "❌ НЕ ПРОЙДЕН"
        print(f"{test_name.upper():20} {status}")

    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)

    print(f"\n📈 Успешность: {passed_tests}/{total_tests} тестов")

    if passed_tests == total_tests:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
        print("   Агент готов к использованию!")
        print(f"\n🌐 Откройте браузер: {BASE_URL}")
        print("   Выберите агента 'Нейрофото Персонажа'")
        print("   Начните тестирование команд!")
        return 0
    else:
        print("\n⚠️  НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ")
        print("   Проверьте логи агента")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⏹️  Тест прерван пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ КРИТИЧЕСКАЯ ОШИБКА: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

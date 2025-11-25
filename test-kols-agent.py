#!/usr/bin/env python3
"""
Тест KOLS AGENT - проверка автопересылки сообщений
"""

import requests
import json
import time

def test_agent():
    print("📡 Тестирование KOLS AGENT")
    print("=" * 50)
    print()

    # Тестовые сообщения
    test_messages = [
        "привет",
        "покажи сообщения",
        "что в группах?",
        "трансляция"
    ]

    for msg in test_messages:
        print(f"▶️  Отправляю: '{msg}'")

        try:
            # Пробуем разные endpoints
            endpoints = [
                'http://localhost:3002/message',
                'http://localhost:3002/api/message',
                'http://localhost:3002/chat'
            ]

            response = None
            for endpoint in endpoints:
                try:
                    response = requests.post(
                        endpoint,
                        headers={'Content-Type': 'application/json'},
                        json={
                            'content': {'text': msg},
                            'userId': '144022504',
                            'roomId': 'test-room'
                        },
                        timeout=3
                    )
                    if response.status_code != 404:
                        break
                except:
                    continue

            print(f"   ✅ Ответ получен (код {response.status_code})")

            # Парсим ответ
            try:
                data = response.json()
                if data and len(data) > 0:
                    print(f"   💬 Ответ: {data[0].get('text', '')[:100]}...")
                else:
                    print(f"   ℹ️  Пустой ответ")
            except:
                print(f"   📄 Ответ: {response.text[:100]}...")

        except Exception as e:
            print(f"   ❌ Ошибка: {e}")

        print()
        time.sleep(2)

    print("✅ Тест завершен")
    print()
    print("💡 Проверьте последние логи:")
    print("   tail -f ../agent.log | grep -E 'AutoForward|new messages'")

if __name__ == '__main__':
    test_agent()

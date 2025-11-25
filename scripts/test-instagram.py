#!/usr/bin/env python3
"""
Тест Instagram плагина через Telegram API
"""

import asyncio
from telegram import Client
from telegram.session import StringSession
import json
import os

# Загружаем конфиг
API_ID = int(os.getenv('TELEGRAM_API_ID', '94892'))
API_HASH = os.getenv('TELEGRAM_API_HASH', 'cacf9ad137d228611b49b2ecc6d68d43')
SESSION_STRING = os.getenv('TELEGRAM_SESSION_STRING', '1ApWapzMBu7_l3Ag6iecyMij5-mFLMmQvi5axSimPVoH2QcUb9FBcWJ8Sq3aqEEri2kYJKts-fd2pUYKGWNYxQ10YrBmP7oN-Yoedb1HO1VFolcvKrqFciy63SowMnk80GRLmrqQ7ZHxVmGbd0uO1NhoDG2sBuvCC_B_9CxCpHo8WBL_83yjJND0OaAvXAfedTrPWgjFUn7h_Fn_5B5GnrWsj6g-u14J26NqEqg0bwa1o9TfHTzH0A5xhnUC5-WqdcU23jq_4lfWtwiCafzWf7g16Rm3R48io53Sho2dKL8nyQeAtNWSXmBvcrSmVnfrXQz0EC0qA0XzriuXoHzE-fukmXns725g=')

async def test_instagram_post():
    """Тестируем публикацию в Instagram"""
    print("=== ТЕСТ INSTAGRAM ПЛАГИНА ===\n")

    try:
        # Создаём клиент
        client = Client(
            'test_session',
            api_id=API_ID,
            api_hash=API_HASH,
            session_string=SESSION_STRING
        )

        print("🔌 Подключаемся к Telegram...")
        await client.start()

        print("✅ Подключен!\n")

        # Находим бота VIBEE (замените на реальный username)
        print("👤 Ищем бота VIBEE...")
        # Получаем список чатов
        dialogs = await client.get_dialogs()
        bot_chat = None
        for dialog in dialogs:
            if dialog.is_bot:
                bot_chat = dialog.chat
                print(f"Найден бот: {bot_chat.first_name or bot_chat.title}")
                break

        if not bot_chat:
            print("❌ Бот не найден. Убедитесь, что бот запущен и доступен.")
            return

        # Отправляем тестовое сообщение
        test_message = "Опубликуй пост в Instagram с изображением https://picsum.photos/800/600 и подписью Тестовый пост от VIBEE 🤖"

        print(f"\n📤 Отправляем команду:\n{test_message}\n")
        await client.send_message(bot_chat.id, test_message)

        print("⏳ Ожидаем ответ...")
        # Ждём ответ
        response = await client.listen(timeout=30)
        print(f"\n📥 Ответ бота:\n{response.text}\n")

        # Проверяем, что ответ содержит Instagram
        if "instagram" in response.text.lower():
            print("✅ Тест ПРОЙДЕН! Плагин работает!")
            print(f"   Response: {response.text}")
        else:
            print("⚠️ Плагин ответил, но не по теме Instagram")
            print(f"   Response: {response.text}")

        await client.disconnect()

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_instagram_post())

#!/usr/bin/env python3
"""
🔍 Анализ пользователя через Telethon (Python)
Попробуем разные методы получения групп
"""

import asyncio
import sys
import os
from telethon import TelegramClient, functions, types
from telethon.sessions import StringSession

# Настройки из переменных окружения
API_ID = int(os.environ.get('API_ID', '94892'))
API_HASH = os.environ.get('API_HASH', 'cacf9ad137d228611b49b2ecc6d68d43')
SESSION_STRING = os.environ.get('SESSION_STRING', '1ApWapzMBu7_l3Ag6iecyMij5-mFLMmQvi5axSimPVoH2QcUb9FBcWJ8Sq3aqEEri2kYJKts-fd2pUYKGWNYxQ10YrBmP7oN-Yoedb1HO1VFolcvKrqFciy63SowMnk80GRLmrqQ7ZHxVmGbd0uO1NhoDG2sBuvCC_B_9CxCpHo8WBL_83yjJND0OaAvXAfedTrPWgjFUn7h_Fn_5B5GnrWsj6g-u14J26NqEqg0bwa1o9TfHTzH0A5xhnUC5-WqdcU23jq_4lfWtwiCafzWf7g16Rm3R48io53Sho2dKL8nyQeAtNWSXmBvcrSmVnfrXQz0EC0qA0XzriuXoHzE-fukmXns725g=')

SESSION_NAME = 'telethon_session'

async def method_1_get_full_user(client, user_id):
    """Метод 1: Получить полную информацию о пользователе"""
    print("\n1️⃣ Пробуем users.GetFullUser...")
    try:
        result = await client(functions.users.GetFullUserRequest(
            id=types.InputUser(user_id=user_id, access_hash=0)
        ))
        print(f"   ✅ Успех! Получили:")
        print(f"   - Full user: {result.full_user}")
        print(f"   - Chats: {len(result.chats) if result.chats else 0}")
        print(f"   - Users: {len(result.users) if result.users else 0}")

        if result.chats:
            print(f"\n   📋 Каналы/группы из GetFullUser:")
            for chat in result.chats:
                print(f"      - {chat.title} (ID: {chat.id})")
                if hasattr(chat, 'username') and chat.username:
                    print(f"        Username: @{chat.username}")

        return result
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return None

async def method_2_get_channels(client, user_id):
    """Метод 2: channels.getChannels"""
    print("\n2️⃣ Пробуем channels.GetChannels...")
    try:
        # Попытка 1: через InputChannel
        result = await client(functions.channels.GetChannelsRequest(
            id=[types.InputChannel(user_id=user_id, access_hash=0)]
        ))
        print(f"   ✅ Успех! Найдено каналов: {len(result.channels)}")
        for channel in result.channels:
            print(f"      - {channel.title} (ID: {channel.id})")
        return result
    except Exception as e:
        print(f"   ❌ Ошибка через InputChannel: {e}")

    try:
        # Попытка 2: через User
        user = await client.get_entity(user_id)
        if hasattr(user, 'access_hash') and user.access_hash:
            result = await client(functions.channels.GetChannelsRequest(
                id=[types.InputChannel(channel_id=user_id, access_hash=user.access_hash)]
            ))
            print(f"   ✅ Успех! Найдено каналов: {len(result.channels)}")
            return result
    except Exception as e:
        print(f"   ❌ Ошибка через get_entity: {e}")

    return None

async def method_3_get_common_chats(client, user_id):
    """Метод 3: messages.getCommonChats"""
    print("\n3️⃣ Пробуем messages.GetCommonChats...")
    try:
        # Получаем пользователя
        user = await client.get_entity(user_id)

        # Проверяем что это действительно User
        if not isinstance(user, types.User):
            print(f"   ❌ Сущность не является пользователем: {type(user)}")
            return None

        result = await client(functions.messages.GetCommonChatsRequest(
            user_id=types.InputUser(user_id=user_id, access_hash=user.access_hash),
            max_id=0,
            limit=100
        ))
        print(f"   ✅ Успех! Найдено общих чатов: {len(result.chats)}")
        for chat in result.chats:
            print(f"      - {chat.title} (ID: {chat.id})")
        return result
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return None

async def method_4_scan_all_dialogs(client, user_id):
    """Метод 4: Сканируем все диалоги и ищем пользователя"""
    print(f"\n4️⃣ Сканируем ВСЕ диалоги в поисках пользователя {user_id}...")
    found_groups = []
    dialog_count = 0

    try:
        async for dialog in client.iter_dialogs():
            dialog_count += 1
            entity = dialog.entity

            # Только группы и каналы
            if entity.type not in ['channel', 'chat']:
                continue

            # Проверяем участников (с лимитом для скорости)
            try:
                participant_count = 0
                async for participant in client.iter_participants(entity, aggressive=True):
                    participant_count += 1
                    if participant.id == user_id:
                        found_groups.append({
                            'id': entity.id,
                            'title': entity.title,
                            'username': getattr(entity, 'username', None),
                            'type': entity.type,
                            'participant_count': participant_count
                        })
                        print(f"   ✅ Найден в: {entity.title} (@{getattr(entity, 'username', 'приватная')})")
                        break

                    if participant_count > 100:  # Лимит для скорости
                        break

                # Небольшая задержка
                await asyncio.sleep(0.01)

            except Exception as e:
                print(f"   ⚠️ Ошибка в {entity.title}: {e}")

            # Прогресс
            if dialog_count % 10 == 0:
                print(f"   📊 Проверено {dialog_count} диалогов, найдено {len(found_groups)} групп...")

    except Exception as e:
        print(f"   ❌ Ошибка сканирования: {e}")

    print(f"\n   📊 ИТОГО: Проверено {dialog_count} диалогов")
    print(f"   🎯 Найдено групп: {len(found_groups)}")

    return found_groups

async def method_5_analyze_forwards(client, user_id):
    """Метод 5: Анализируем пересылки"""
    print(f"\n5️⃣ Анализируем пересылки от пользователя {user_id}...")
    forward_sources = []
    dialog_count = 0

    try:
        async for dialog in client.iter_dialogs():
            dialog_count += 1
            if dialog_count > 50:  # Ограничиваем для скорости
                break

            try:
                async for message in client.iter_messages(dialog, limit=50):
                    if message.forward and message.forward.sender_id == user_id:
                        forward_sources.append({
                            'dialog_id': dialog.id,
                            'title': dialog.title,
                            'message_id': message.id,
                            'date': message.date
                        })
                        print(f"   ↪ Пересылка в: {dialog.title}")

            except Exception as e:
                pass

    except Exception as e:
        print(f"   ❌ Ошибка анализа пересылок: {e}")

    print(f"   📊 Найдено источников пересылок: {len(forward_sources)}")
    return forward_sources

async def main():
    """Основная функция"""
    if len(sys.argv) < 2:
        print("Использование: python telethon-analysis.py <user_id или username>")
        sys.exit(1)

    target = sys.argv[1]
    print(f"🔍 Анализ пользователя: {target}")
    print("=" * 60)

    # Создаем клиент с StringSession
    client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

    try:
        # Подключаемся через session string
        await client.connect()
        if not await client.is_user_authorized():
            print("❌ Не авторизован! Нужна сессия")
            return
        print("✅ Подключен к Telegram")

        # Получаем сущность пользователя
        try:
            user = await client.get_entity(target)
            user_id = user.id
            print(f"👤 Пользователь найден: {user.first_name} (@{user.username}) ID: {user_id}")
        except Exception as e:
            print(f"❌ Не удалось найти пользователя: {e}")
            return

        # Пробуем разные методы
        results = {}

        # Метод 1: GetFullUser
        results['get_full_user'] = await method_1_get_full_user(client, user_id)

        # Метод 2: GetChannels
        results['get_channels'] = await method_2_get_channels(client, user_id)

        # Метод 3: GetCommonChats
        results['get_common_chats'] = await method_3_get_common_chats(client, user_id)

        # Метод 4: Сканирование всех диалогов
        results['scan_dialogs'] = await method_4_scan_all_dialogs(client, user_id)

        # Метод 5: Анализ пересылок
        results['analyze_forwards'] = await method_5_analyze_forwards(client, user_id)

        # Итоговый отчет
        print("\n" + "=" * 60)
        print("📊 ИТОГОВЫЙ ОТЧЕТ:")
        print("=" * 60)

        total_groups = len(results['scan_dialogs'])
        total_forwards = len(results['analyze_forwards'])

        print(f"🎯 Найдено групп через сканирование: {total_groups}")
        print(f"🔄 Найдено групп через пересылки: {total_forwards}")

        if total_groups > 0 or total_forwards > 0:
            print("\n✅ Результаты:")
            for group in results['scan_dialogs']:
                print(f"   • {group['title']} (@{group['username'] or 'приватная'})")
        else:
            print("\n❌ Группы не найдены или пользователь скрывает активность")

    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await client.disconnect()
        print("\n👋 Отключен от Telegram")

if __name__ == '__main__':
    asyncio.run(main())

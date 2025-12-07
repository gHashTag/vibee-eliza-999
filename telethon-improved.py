#!/usr/bin/env python3
"""
✅ УЛУЧШЕННАЯ версия - Telethon успешно находит группы!
Метод messages.GetCommonChats работает!
"""

import asyncio
import sys
import os
from telethon import TelegramClient, functions, types
from telethon.sessions import StringSession

# Настройки
API_ID = int(os.environ.get('API_ID', '94892'))
API_HASH = os.environ.get('API_HASH', 'cacf9ad137d228611b49b2ecc6d68d43')
SESSION_STRING = os.environ.get('SESSION_STRING', '1ApWapzMBu7_l3Ag6iecyMij5-mFLMmQvi5axSimPVoH2QcUb9FBcWJ8Sq3aqEEri2kYJKts-fd2pUYKGWNYxQ10YrBmP7oN-Yoedb1HO1VFolcvKrqFciy63SowMnk80GRLmrqQ7ZHxVmGbd0uO1NhoDG2sBuvCC_B_9CxCpHo8WBL_83yjJND0OaAvXAfedTrPWgjFUn7h_Fn_5B5GnrWsj6g-u14J26NqEqg0bwa1o9TfHTzH0A5xhnUC5-WqdcU23jq_4lfWtwiCafzWf7g16Rm3R48io53Sho2dKL8nyQeAtNWSXmBvcrSmVnfrXQz0EC0qA0XzriuXoHzE-fukmXns725g=')

SESSION_NAME = 'telethon_session'

async def get_user_info(client, user_id):
    """Получить полную информацию о пользователе"""
    print("\n📋 [1/4] Получаю профиль пользователя...")

    try:
        # Полная информация
        result = await client(functions.users.GetFullUserRequest(
            id=types.InputUser(user_id=user_id, access_hash=0)
        ))

        full_user = result.full_user
        print(f"   ✅ Имя: {full_user.personal_channel_id if hasattr(full_user, 'personal_channel_id') else 'Неизвестно'}")
        print(f"   📝 Bio: {full_user.about}")
        print(f"   💬 Общих чатов: {full_user.common_chats_count}")

        return result
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return None

async def get_common_chats(client, user_id):
    """Получить общие чаты - САМЫЙ ЭФФЕКТИВНЫЙ МЕТОД!"""
    print("\n🎯 [2/4] Получаю общие чаты (GetCommonChats)...")

    try:
        # Получаем пользователя
        user = await client.get_entity(user_id)

        if not isinstance(user, types.User):
            print(f"   ❌ Сущность не является пользователем")
            return []

        # Получаем общие чаты
        result = await client(functions.messages.GetCommonChatsRequest(
            user_id=types.InputUser(user_id=user_id, access_hash=user.access_hash),
            max_id=0,
            limit=100
        ))

        print(f"   ✅ Найдено общих чатов: {len(result.chats)}")

        groups = []
        for chat in result.chats:
            # Определяем тип чата
            chat_type = 'группа'
            if isinstance(chat, types.Channel):
                if chat.megagroup:
                    chat_type = 'супергруппа'
                else:
                    chat_type = 'канал'

            group_info = {
                'id': chat.id,
                'title': chat.title,
                'username': getattr(chat, 'username', None),
                'type': chat_type,
                'access_hash': getattr(chat, 'access_hash', None),
                'entity': chat  # Сохраняем сам объект
            }

            groups.append(group_info)

            # Выводим информацию
            username_str = f" (@{getattr(chat, 'username', None)})" if getattr(chat, 'username', None) else " (приватная)"
            print(f"   {len(groups)}. {chat.title} - {chat_type}{username_str}")

        return groups

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return []

async def get_user_channels(client, user_id):
    """Попытка получить каналы пользователя (может не работать)"""
    print("\n📺 [3/4] Пробуем получить каналы пользователя...")

    try:
        # Получаем пользователя
        user = await client.get_entity(user_id)

        if not isinstance(user, types.User):
            print(f"   ❌ Сущность не является пользователем")
            return []

        # Этот метод может не работать для пользователей
        # Попробуем разные варианты
        print(f"   ⚠️ Метод channels.getChannels обычно не работает для пользователей")
        print(f"   💡 Telegram ограничивает доступ к каналам других пользователей")

        return []

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return []

async def scan_public_activity(client, user_id, groups):
    """Проверяем активность пользователя в найденных группах"""
    print(f"\n💬 [4/4] Анализируем активность в найденных группах...")

    active_groups = []

    for group in groups:
        try:
            # Получаем последние сообщения от пользователя
            message_count = 0
            async for message in client.iter_messages(
                group['entity'],
                from_user=user_id,
                limit=10
            ):
                message_count += 1

            if message_count > 0:
                active_groups.append({
                    'title': group['title'],
                    'username': group['username'],
                    'messages': message_count
                })
                print(f"   ✅ {group['title']}: {message_count} сообщений")
            else:
                print(f"   ℹ️ {group['title']}: не активен (0 сообщений)")

        except Exception as e:
            print(f"   ⚠️ {group['title']}: ошибка анализа")

    return active_groups

async def main():
    """Основная функция"""
    if len(sys.argv) < 2:
        print("Использование: python telethon-improved.py <user_id или username>")
        sys.exit(1)

    target = sys.argv[1]
    print(f"🔍 Анализ пользователя: {target}")
    print("=" * 60)

    # Создаем клиент
    client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

    try:
        # Подключаемся
        await client.connect()
        if not await client.is_user_authorized():
            print("❌ Не авторизован!")
            return

        me = await client.get_me()
        print(f"✅ Подключен как: {me.first_name} (@{me.username})")

        # Получаем сущность пользователя
        try:
            user = await client.get_entity(target)
            user_id = user.id
            print(f"👤 Анализируем: {user.first_name} (@{user.username}) ID: {user_id}")
        except Exception as e:
            print(f"❌ Не удалось найти пользователя: {e}")
            return

        # Применяем методы
        user_info = await get_user_info(client, user_id)
        common_groups = await get_common_chats(client, user_id)
        user_channels = await get_user_channels(client, user_id)
        active_groups = await scan_public_activity(client, user_id, common_groups)

        # Итоговый отчет
        print("\n" + "=" * 60)
        print("📊 ИТОГОВЫЙ ОТЧЕТ:")
        print("=" * 60)

        print(f"\n👤 Пользователь: {user.first_name} (@{user.username})")
        print(f"🆔 ID: {user_id}")

        if user_info:
            full_user = user_info.full_user
            print(f"📝 Bio: {full_user.about}")
            print(f"💬 Общих чатов (официально): {full_user.common_chats_count}")

        print(f"\n🎯 Найдено групп: {len(common_groups)}")

        if common_groups:
            print("\n📋 Список групп:")
            for i, group in enumerate(common_groups, 1):
                username_str = f" (@{group['username']})" if group['username'] else " (приватная)"
                print(f"   {i}. {group['title']} - {group['type']}{username_str}")

        if active_groups:
            print(f"\n💬 Активные группы: {len(active_groups)}")
            for group in active_groups:
                print(f"   • {group['title']}: {group['messages']} сообщений")

        if len(common_groups) == 0:
            print("\n❌ Общих групп не найдено")
            print("💡 Возможные причины:")
            print("   • Пользователь скрывает группы")
            print("   • Очень строгие настройки приватности")
            print("   • Нет общих групп с вашим аккаунтом")

        print("\n✅ Анализ завершен!")

    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await client.disconnect()
        print("\n👋 Отключен от Telegram")

if __name__ == '__main__':
    asyncio.run(main())

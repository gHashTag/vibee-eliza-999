#!/usr/bin/env python3
"""
🔍 ПОЛНЫЙ АНАЛИЗ ВСЕХ ГРУПП ПОЛЬЗОВАТЕЛЯ
Попытка обойти ограничения приватности Telegram
"""

import asyncio
import sys
import os
from telethon import TelegramClient, functions, types
from telethon.sessions import StringSession
from telethon.errors import *
import json

# Настройки
API_ID = int(os.environ.get('API_ID', '94892'))
API_HASH = os.environ.get('API_HASH', 'cacf9ad137d228611b49b2ecc6d68d43')
SESSION_STRING = os.environ.get('SESSION_STRING', '1ApWapzMBu7_l3Ag6iecyMij5-mFLMmQvi5axSimPVoH2QcUb9FBcWJ8Sq3aqEEri2kYJKts-fd2pUYKGWNYxQ10YrBmP7oN-Yoedb1HO1VFolcvKrqFciy63SowMnk80GRLmrqQ7ZHxVmGbd0uO1NhoDG2sBuvCC_B_9CxCpHo8WBL_83yjJND0OaAvXAfedTrPWgjFUn7h_Fn_5B5GnrWsj6g-u14J26NqEqg0bwa1o9TfHTzH0A5xhnUC5-WqdcU23jq_4lfWtwiCafzWf7g16Rm3R48io53Sho2dKL8nyQeAtNWSXmBvcrSmVnfrXQz0EC0qA0XzriuXoHzE-fukmXns725g=')

async def get_user_info(client, user_id):
    """Получить полную информацию о пользователе"""
    print("\n📋 [1/6] Получаю профиль пользователя...")

    try:
        user = await client.get_entity(user_id)
        print(f"   ✅ Имя: {user.first_name}")
        print(f"   📝 Bio: {getattr(user, 'about', 'Не указано')}")
        print(f"   👤 Username: @{user.username if user.username else 'не указан'}")

        # Полная информация
        result = await client(functions.users.GetFullUserRequest(
            id=types.InputUser(user_id=user_id, access_hash=user.access_hash)
        ))

        full_user = result.full_user
        print(f"   💬 Общих чатов: {full_user.common_chats_count}")

        return user, result

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return None, None

async def get_common_chats(client, user_id):
    """Получить общие чаты - известный метод"""
    print("\n🎯 [2/6] Получаю общие чаты (GetCommonChats)...")

    try:
        user = await client.get_entity(user_id)

        result = await client(functions.messages.GetCommonChatsRequest(
            user_id=types.InputUser(user_id=user_id, access_hash=user.access_hash),
            max_id=0,
            limit=100
        ))

        print(f"   ✅ Найдено общих чатов: {len(result.chats)}")

        groups = []
        for chat in result.chats:
            chat_type = 'группа'
            if isinstance(chat, types.Channel):
                if chat.megagroup:
                    chat_type = 'супергруппа'
                else:
                    chat_type = 'канал'

            groups.append({
                'id': chat.id,
                'title': chat.title,
                'username': getattr(chat, 'username', None),
                'type': chat_type
            })

            print(f"   {len(groups)}. {chat.title} - {chat_type}")

        return groups

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return []

async def scan_all_dialogs(client, user_id):
    """Сканируем ВСЕ диалоги в поисках пользователя"""
    print("\n🔍 [3/6] Сканируем ВСЕ диалоги...")

    print("   📊 Получаю список всех диалогов...")
    dialogs = []
    all_groups = set()

    try:
        async for dialog in client.iter_dialogs(limit=1000):
            dialogs.append(dialog)

        print(f"   ✅ Всего диалогов: {len(dialogs)}")

        # Ищем пользователя в каждом диалоге
        found_groups = []
        checked_count = 0

        for dialog in dialogs:
            checked_count += 1
            if checked_count % 100 == 0:
                print(f"   ⏳ Проверено {checked_count}/{len(dialogs)} диалогов...")

            try:
                entity = dialog.entity

                # Проверяем, есть ли пользователь в этой группе
                if hasattr(entity, 'id'):
                    # Получаем участников группы
                    try:
                        participants = await client.get_participants(entity, aggressive=True)

                        for participant in participants:
                            if participant.id == user_id:
                                chat_type = 'группа'
                                if isinstance(entity, types.Channel):
                                    if entity.megagroup:
                                        chat_type = 'супергруппа'
                                    else:
                                        chat_type = 'канал'

                                group_info = {
                                    'id': entity.id,
                                    'title': entity.title,
                                    'username': getattr(entity, 'username', None),
                                    'type': chat_type,
                                    'from_dialogs': True
                                }

                                # Избегаем дубликатов
                                if entity.id not in all_groups:
                                    found_groups.append(group_info)
                                    all_groups.add(entity.id)
                                    print(f"   ✅ Найдена группа: {entity.title} ({chat_type})")

                    except Exception as e:
                        # Некоторые группы могут быть приватными или заблокированными
                        pass

            except Exception as e:
                pass

        print(f"   📊 Итого найдено групп через сканирование диалогов: {len(found_groups)}")

        # Сортируем по названию
        found_groups.sort(key=lambda x: x['title'])

        return found_groups

    except Exception as e:
        print(f"   ❌ Ошибка сканирования: {e}")
        return []

async def scan_user_messages(client, user_id):
    """Ищем сообщения от пользователя и определяем из каких групп они"""
    print("\n📢 [4/6] Анализируем сообщения пользователя...")

    groups = []
    group_ids = set()

    try:
        # Ищем сообщения от пользователя за последние месяцы
        print("   🔍 Ищем сообщения пользователя...")

        message_count = 0
        async for message in client.iter_messages(
            None,  # Все чаты
            from_user=user_id,
            limit=500  # Большой лимит
        ):
            message_count += 1

            if message_count % 50 == 0:
                print(f"   ⏳ Обработано сообщений: {message_count}")

            # Если сообщение из группового чата
            if hasattr(message, 'chat_id'):
                chat_id = message.chat_id

                if chat_id and chat_id not in group_ids:
                    group_ids.add(chat_id)

                    # Получаем информацию о чате
                    try:
                        chat = await client.get_entity(chat_id)

                        if hasattr(chat, 'title'):  # Это группа или канал
                            chat_type = 'группа'
                            if isinstance(chat, types.Channel):
                                if chat.megagroup:
                                    chat_type = 'супергруппа'
                                else:
                                    chat_type = 'канал'

                            group_info = {
                                'id': chat_id,
                                'title': chat.title,
                                'username': getattr(chat, 'username', None),
                                'type': chat_type,
                                'from_messages': True
                            }

                            groups.append(group_info)
                            print(f"   ✅ Найдена группа через сообщения: {chat.title} ({chat_type})")

                    except Exception as e:
                        pass

        print(f"   📊 Найдено групп через сообщения: {len(groups)}")

        return groups

    except Exception as e:
        print(f"   ❌ Ошибка анализа сообщений: {e}")
        return []

async def check_forwards(client, user_id):
    """Проверяем пересылки от пользователя"""
    print("\n↩️ [5/6] Анализируем пересылки...")

    groups = set()

    try:
        print("   🔍 Ищем пересылки от пользователя...")

        message_count = 0
        async for message in client.iter_messages(
            None,
            from_user=user_id,
            limit=300
        ):
            message_count += 1

            if message.fwd_from:
                # Проверяем откуда переслано
                if message.fwd_from.chat_id:
                    chat_id = message.fwd_from.chat_id

                    try:
                        chat = await client.get_entity(chat_id)

                        if hasattr(chat, 'title'):
                            chat_type = 'группа'
                            if isinstance(chat, types.Channel):
                                if chat.megagroup:
                                    chat_type = 'супергруппа'
                                else:
                                    chat_type = 'канал'

                            groups.add((chat_id, chat.title, chat_type, getattr(chat, 'username', None)))

                    except Exception as e:
                        pass

        print(f"   📊 Найдено источников пересылок: {len(groups)}")

        result = []
        for chat_id, title, chat_type, username in groups:
            result.append({
                'id': chat_id,
                'title': title,
                'username': username,
                'type': chat_type
            })

        return result

    except Exception as e:
        print(f"   ❌ Ошибка анализа пересылок: {e}")
        return []

async def get_user_participated_groups(client, user_id):
    """Пытаемся получить группы через различные методы"""
    print("\n🎯 [6/6] Финальный анализ всеми методами...")

    all_groups = {}
    methods_used = []

    # Метод 1: Общие чаты
    common_chats = await get_common_chats(client, user_id)
    for group in common_chats:
        all_groups[group['id']] = group
        all_groups[group['id']]['method'] = 'common_chats'
    methods_used.append('GetCommonChats')

    # Метод 2: Сканирование диалогов
    print("\n   ⚠️ Внимание: сканирование диалогов может занять 5-10 минут!")
    dialogs_groups = await scan_all_dialogs(client, user_id)
    for group in dialogs_groups:
        if group['id'] not in all_groups:
            all_groups[group['id']] = group
            all_groups[group['id']]['method'] = 'dialogs_scan'
    methods_used.append('Dialogs Scan')

    # Метод 3: Сообщения пользователя
    message_groups = await scan_user_messages(client, user_id)
    for group in message_groups:
        if group['id'] not in all_groups:
            all_groups[group['id']] = group
            all_groups[group['id']]['method'] = 'user_messages'
    methods_used.append('User Messages')

    # Метод 4: Пересылки
    forward_groups = await check_forwards(client, user_id)
    for group in forward_groups:
        if group['id'] not in all_groups:
            all_groups[group['id']] = group
            all_groups[group['id']]['method'] = 'forwards'
    methods_used.append('Forwards')

    print(f"\n   ✅ Использовано методов: {', '.join(methods_used)}")
    print(f"   🎯 Итого уникальных групп найдено: {len(all_groups)}")

    return list(all_groups.values())

async def main():
    """Основная функция"""
    if len(sys.argv) < 2:
        print("Использование: python telethon-full-analysis.py <user_id или username>")
        sys.exit(1)

    target = sys.argv[1]
    print("=" * 70)
    print("🔍 ПОЛНЫЙ АНАЛИЗ ВСЕХ ГРУПП ПОЛЬЗОВАТЕЛЯ")
    print("=" * 70)
    print(f"🎯 Анализируем: {target}")

    # Создаем клиент
    client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

    try:
        await client.connect()
        if not await client.is_user_authorized():
            print("❌ Не авторизован!")
            return

        me = await client.get_me()
        print(f"✅ Подключен как: {me.first_name} (@{me.username})")

        # Получаем пользователя
        try:
            user = await client.get_entity(target)
            user_id = user.id
            print(f"👤 Анализируем: {user.first_name} (@{user.username}) ID: {user_id}")
        except Exception as e:
            print(f"❌ Не удалось найти пользователя: {e}")
            return

        # Получаем полную информацию
        user_info, full_info = await get_user_info(client, user_id)

        # ПОЛНЫЙ АНАЛИЗ ВСЕХ ГРУПП
        all_groups = await get_user_participated_groups(client, user_id)

        # ИТОГОВЫЙ ОТЧЕТ
        print("\n" + "=" * 70)
        print("📊 ИТОГОВЫЙ ОТЧЕТ - ВСЕ ГРУППЫ ПОЛЬЗОВАТЕЛЯ")
        print("=" * 70)

        if user_info:
            print(f"\n👤 Пользователь: {user.first_name} (@{user.username})")
            print(f"🆔 ID: {user_id}")
            if full_info:
                print(f"📝 Bio: {full_info.full_user.about}")
                print(f"💬 Общих чатов (официально): {full_info.full_user.common_chats_count}")

        print(f"\n🎯 НАЙДЕНО ГРУПП ВСЕГО: {len(all_groups)}")

        if all_groups:
            print("\n📋 Список всех групп:")
            for i, group in enumerate(sorted(all_groups, key=lambda x: x['title']), 1):
                username_str = f" (@{group['username']})" if group['username'] else " (приватная)"
                method_str = f" [найдено: {group.get('method', 'unknown')}]"
                print(f"   {i}. {group['title']} - {group['type']}{username_str}{method_str}")

            # Группируем по методам
            methods = {}
            for group in all_groups:
                method = group.get('method', 'unknown')
                if method not in methods:
                    methods[method] = []
                methods[method].append(group['title'])

            print(f"\n📊 Сводка по методам:")
            for method, titles in methods.items():
                print(f"   • {method}: {len(titles)} групп")

        else:
            print("\n❌ Группы не найдены")
            print("💡 Возможные причины:")
            print("   • Слишком строгие настройки приватности")
            print("   • Пользователь скрывает группы")
            print("   • Ограничения API")

        # Сохраняем в файл
        with open(f'user_{user_id}_full_groups.json', 'w', encoding='utf-8') as f:
            json.dump({
                'user': {
                    'id': user_id,
                    'first_name': user.first_name,
                    'username': user.username,
                    'bio': full_info.full_user.about if full_info else None,
                    'common_chats_count': full_info.full_user.common_chats_count if full_info else None
                },
                'total_groups': len(all_groups),
                'groups': all_groups,
                'methods_used': list(set([g.get('method', 'unknown') for g in all_groups]))
            }, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Результат сохранен в файл: user_{user_id}_full_groups.json")

        print("\n✅ Полный анализ завершен!")

    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await client.disconnect()
        print("\n👋 Отключен от Telegram")

if __name__ == '__main__':
    asyncio.run(main())

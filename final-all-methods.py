#!/usr/bin/env python3
"""
ФИНАЛЬНЫЙ АНАЛИЗ - ВСЕ МЕТОДЫ ПОЛУЧЕНИЯ ГРУПП ПОЛЬЗОВАТЕЛЯ
Проверяем абсолютно все возможные подходы
"""

import asyncio
import json
from telethon import TelegramClient, functions, types
from telethon.sessions import StringSession

API_ID = 94892
API_HASH = 'cacf9ad137d228611b49b2ecc6d68d43'
SESSION_STRING = '1ApWapzMBu7_l3Ag6iecyMij5-mFLMmQvi5axSimPVoH2QcUb9FBcWJ8Sq3aqEEri2kYJKts-fd2pUYKGWNYxQ10YrBmP7oN-Yoedb1HO1VFolcvKrqFciy63SowMnk80GRLmrqQ7ZHxVmGbd0uO1NhoDG2sBuvCC_B_9CxCpHo8WBL_83yjJND0OaAvXAfedTrPWgjFUn7h_Fn_5B5GnrWsj6g-u14J26NqEqg0bwa1o9TfHTzH0A5xhnUC5-WqdcU23jq_4lfWtwiCafzWf7g16Rm3R48io53Sho2dKL8nyQeAtNWSXmBvcrSmVnfrXQz0EC0qA0XzriuXoHzE-fukmXns725g='

async def method_1_get_own_dialogs(client):
    """Метод 1: Получаем ВСЕ свои диалоги"""
    print("\n🎯 [1] Получаем ВСЕ диалоги (messages.getDialogs)...")

    try:
        result = await client(functions.messages.GetDialogsRequest(
            offset_date=0,
            offset_peer=types.InputPeerEmpty(),
            offset_id=0,
            limit=1000,
            hash=0
        ))

        print(f"   ✅ Найдено: {len(result.chats)} чатов, {len(result.users)} пользователей")
        return result.chats, result.users

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return [], []

async def method_2_user_info(client, user_id):
    """Метод 2: Получаем информацию о пользователе"""
    print(f"\n🎯 [2] Получаем info о пользователе {user_id}...")

    try:
        user = await client.get_entity(user_id)
        full = await client(functions.users.GetFullUserRequest(
            id=types.InputUser(user_id=user_id, access_hash=user.access_hash)
        ))

        info = {
            'id': user.id,
            'first_name': user.first_name,
            'username': user.username,
            'about': full.full_user.about,
            'common_chats_count': full.full_user.common_chats_count
        }

        print(f"   ✅ {info['first_name']} (@{info['username']})")
        print(f"   💬 Общих чатов: {info['common_chats_count']}")
        return info

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return None

async def method_3_common_chats(client, user_id):
    """Метод 3: Общие чаты - известный метод"""
    print(f"\n🎯 [3] Общие чаты (messages.GetCommonChats) для {user_id}...")

    try:
        user = await client.get_entity(user_id)
        result = await client(functions.messages.GetCommonChatsRequest(
            user_id=types.InputUser(user_id=user_id, access_hash=user.access_hash),
            max_id=0,
            limit=100
        ))

        print(f"   ✅ Найдено: {len(result.chats)} общих чатов")
        return result.chats

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return []

async def method_4_search_messages(client, user_id, limit=500):
    """Метод 4: Ищем сообщения пользователя во всех чатах"""
    print(f"\n🎯 [4] Ищем сообщения пользователя {user_id}...")

    user_groups = {}

    try:
        print(f"   🔍 Анализируем {limit} сообщений...")

        async for message in client.iter_messages(None, from_user=user_id, limit=limit):
            if message.chat_id and message.chat_id not in user_groups:
                try:
                    chat = await client.get_entity(message.chat_id)
                    if hasattr(chat, 'title'):
                        user_groups[message.chat_id] = {
                            'id': chat.id,
                            'title': chat.title,
                            'type': 'группа' if hasattr(chat, 'title') else 'чаты'
                        }
                except Exception:
                    pass

        print(f"   ✅ Найдено: {len(user_groups)} групп через сообщения")
        return list(user_groups.values())

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return []

async def method_5_forwards_analysis(client, user_id, limit=300):
    """Метод 5: Анализируем пересылки"""
    print(f"\n🎯 [5] Анализируем пересылки от {user_id}...")

    forward_groups = {}

    try:
        async for message in client.iter_messages(None, from_user=user_id, limit=limit):
            if message.fwd_from:
                try:
                    if hasattr(message.fwd_from, 'channel_id') and message.fwd_from.channel_id:
                        chat = await client.get_entity(message.fwd_from.channel_id)
                        if hasattr(chat, 'title'):
                            forward_groups[chat.id] = {
                                'id': chat.id,
                                'title': chat.title,
                                'type': 'канал/группа'
                            }
                except Exception:
                    pass

        print(f"   ✅ Найдено: {len(forward_groups)} групп через пересылки")
        return list(forward_groups.values())

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return []

async def method_6_participants_check(client, user_id, chats):
    """Метод 6: Проверяем участников в наших группах"""
    print(f"\n🎯 [6] Проверяем участников в {len(chats)} группах...")

    found_groups = []

    try:
        for i, chat in enumerate(chats[:50]):  # Первые 50 чатов
            try:
                if i % 10 == 0:
                    print(f"   ⏳ Проверено: {i}/{min(50, len(chats))}")

                # Получаем участников
                participants = []
                async for participant in client.get_participants(chat, limit=200):
                    participants.append(participant)

                # Ищем пользователя
                found = any(p.id == user_id for p in participants)

                if found:
                    found_groups.append({
                        'id': chat.id,
                        'title': chat.title,
                        'type': 'супергруппа' if isinstance(chat, types.Channel) else 'группа'
                    })
                    print(f"   ✅ Найдена: {chat.title}")

            except Exception:
                # Игнорируем приватные группы
                pass

        print(f"   ✅ Найдено: {len(found_groups)} групп через участников")
        return found_groups

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return []

async def main():
    print("=" * 80)
    print("🔬 ФИНАЛЬНЫЙ АНАЛИЗ - ВСЕ МЕТОДЫ ПОЛУЧЕНИЯ ГРУПП ПОЛЬЗОВАТЕЛЯ")
    print("=" * 80)

    client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

    try:
        await client.connect()

        if not await client.is_user_authorized():
            print("❌ Не авторизован!")
            return

        me = await client.get_me()
        print(f"✅ Подключен: {me.first_name} (@{me.username})")

        # Тестируем для @yar0309 (ID: 404348060)
        user_id = 404348060
        username = 'yar0309'

        print("\n" + "=" * 80)
        print(f"🔍 АНАЛИЗ ПОЛЬЗОВАТЕЛЯ: @{username} (ID: {user_id})")
        print("=" * 80)

        results = {}

        # Метод 1: Получаем наши диалоги
        all_chats, all_users = await method_1_get_own_dialogs(client)
        results['own_dialogs'] = {'chats': len(all_chats), 'users': len(all_users)}

        # Метод 2: Информация о пользователе
        user_info = await method_2_user_info(client, user_id)
        results['user_info'] = user_info

        # Метод 3: Общие чаты
        common_groups = await method_3_common_chats(client, user_id)
        results['common_groups'] = len(common_groups)

        # Метод 4: Сообщения пользователя
        message_groups = await method_4_search_messages(client, user_id, 1000)
        results['message_groups'] = len(message_groups)

        # Метод 5: Пересылки
        forward_groups = await method_5_forwards_analysis(client, user_id)
        results['forward_groups'] = len(forward_groups)

        # Метод 6: Участники (только если есть наши диалоги)
        if all_chats:
            participant_groups = await method_6_participants_check(client, user_id, all_chats)
            results['participant_groups'] = len(participant_groups)
        else:
            results['participant_groups'] = 0

        # ИТОГОВЫЙ ОТЧЕТ
        print("\n" + "=" * 80)
        print("📊 ИТОГОВЫЙ ОТЧЕТ")
        print("=" * 80)

        if user_info:
            print(f"\n👤 Пользователь: {user_info['first_name']} (@{user_info['username']})")
            print(f"📝 Bio: {user_info['about']}")
            print(f"💬 Общих чатов (официально): {user_info['common_chats_count']}")

        print(f"\n🎯 РЕЗУЛЬТАТЫ ПО МЕТОДАМ:")
        print(f"   1. Наши диалоги: {results['own_dialogs']['chats']} чатов")
        print(f"   3. Общие чаты: {results['common_groups']} групп")
        print(f"   4. Через сообщения: {results['message_groups']} групп")
        print(f"   5. Через пересылки: {results['forward_groups']} групп")
        print(f"   6. Через участников: {results['participant_groups']} групп")

        # Объединяем все найденные группы
        all_found_groups = {}

        for group in common_groups:
            all_found_groups[group.id] = {'title': group.title, 'type': 'общая группа'}

        for group in message_groups:
            if group['id'] not in all_found_groups:
                all_found_groups[group['id']] = {'title': group['title'], 'type': 'через сообщения'}

        for group in forward_groups:
            if group['id'] not in all_found_groups:
                all_found_groups[group['id']] = {'title': group['title'], 'type': 'через пересылки'}

        if 'participant_groups' in locals():
            for group in participant_groups:
                if group['id'] not in all_found_groups:
                    all_found_groups[group['id']] = {'title': group['title'], 'type': 'через участников'}

        print(f"\n🎯 ИТОГО УНИКАЛЬНЫХ ГРУПП: {len(all_found_groups)}")

        if all_found_groups:
            print("\n📋 Полный список:")
            for i, (group_id, group) in enumerate(all_found_groups.items(), 1):
                print(f"   {i}. {group['title']} ({group['type']})")

        # Сохраняем результаты
        report = {
            'user': user_info,
            'methods_results': results,
            'total_groups': len(all_found_groups),
            'groups': all_found_groups
        }

        with open(f'/tmp/telegram-research/{username}_full_analysis.json', 'w') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Результат сохранен: {username}_full_analysis.json")

    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())

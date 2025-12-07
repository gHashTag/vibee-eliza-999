#!/usr/bin/env python3
"""
🔍 ПРОДВИНУТЫЙ АНАЛИЗ - ПОПЫТКА 2.0
Исследуем все возможные методы для получения ВСЕХ групп
"""

import asyncio
import sys
import os
from telethon import TelegramClient, functions, types, tl
from telethon.sessions import StringSession
import json

# Настройки
API_ID = int(os.environ.get('API_ID', '94892'))
API_HASH = os.environ.get('API_HASH', 'cacf9ad137d228611b49b2ecc6d68d43')
SESSION_STRING = os.environ.get('SESSION_STRING', '1ApWapzMBu7_l3Ag6iecyMij5-mFLMmQvi5axSimPVoH2QcUb9FBcWJ8Sq3aqEEri2kYJKts-fd2pUYKGWNYxQ10YrBmP7oN-Yoedb1HO1VFolcvKrqFciy63SowMnk80GRLmrqQ7ZHxVmGbd0uO1NhoDG2sBuvCC_B_9CxCpHo8WBL_83yjJND0OaAvXAfedTrPWgjFUn7h_Fn_5B5GnrWsj6g-u14J26NqEqg0bwa1o9TfHTzH0A5xhnUC5-WqdcU23jq_4lfWtwiCafzWf7g16Rm3R48io53Sho2dKL8nyQeAtNWSXmBvcrSmVnfrXQz0EC0qA0XzriuXoHzE-fukmXns725g=')

async def method_1_user_dialogs(client, user_id):
    """Метод 1: Получаем все диалоги пользователя напрямую"""
    print("\n🎯 [МЕТОД 1] Получаем ВСЕ диалоги пользователя через messages.getDialogs...")

    try:
        # Пытаемся получить диалоги пользователя
        # Это может не работать для пользователей без админских прав
        print("   📱 Пробуем messages.getDialogs для пользователя...")

        # Попробуем через InputUser
        user = await client.get_entity(user_id)

        # Пробуем разные варианты
        results = []

        # Вариант 1: Через channels.getDialogs (если пользователь админ)
        try:
            dialogs_result = await client(functions.messages.GetDialogsRequest(
                peer=types.InputUser(user_id=user_id, access_hash=user.access_hash),
                offset_id=0,
                offset_date=0,
                hash_id=0,
                limit=100
            ))
            print("   ✅ Метод channels.getDialogs сработал!")
            results.append(('channels_getDialogs', dialogs_result))
        except Exception as e:
            print(f"   ❌ channels.getDialogs не сработал: {e}")

        # Вариант 2: Через channels.getChannels
        try:
            channels_result = await client(functions.channels.GetChannelsRequest(
                id=[types.InputChannel(channel_id=user_id, access_hash=user.access_hash)]
            ))
            print("   ✅ Метод channels.getChannels сработал!")
            results.append(('channels_getChannels', channels_result))
        except Exception as e:
            print(f"   ❌ channels.getChannels не сработал: {e}")

        return results

    except Exception as e:
        print(f"   ❌ Ошибка в методе 1: {e}")
        return []

async def method_2_participants_discovery(client, user_id):
    """Метод 2: Ищем пользователя как участника в публичных каналах"""
    print("\n🎯 [МЕТОД 2] Ищем пользователя в публичных каналах...")

    # Список известных публичных каналов для поиска
    public_channels = [
        '@telegram',  # Официальный
        '@durov',     # Дурова
        '@news',      # Новости
        '@ru_news',   # Русские новости
        '@it',        # IT
        '@crypto',    # Криптовалюты
    ]

    found_groups = []

    try:
        for channel_username in public_channels:
            try:
                # Получаем канал
                channel = await client.get_entity(channel_username)

                # Пытаемся получить участников
                print(f"   🔍 Ищем в {channel_username}...")

                try:
                    participants = await client.get_participants(channel, limit=1000)

                    # Ищем нашего пользователя
                    for participant in participants:
                        if participant.id == user_id:
                            group_info = {
                                'id': channel.id,
                                'title': channel.title,
                                'username': getattr(channel, 'username', None),
                                'type': 'канал',
                                'method': 'participants_public',
                                'found_in': channel_username
                            }
                            found_groups.append(group_info)
                            print(f"   ✅ НАЙДЕН в {channel_username}!")

                except Exception as e:
                    print(f"   ⚠️ Не удалось получить участников {channel_username}: {str(e)[:50]}...")

            except Exception as e:
                continue

    except Exception as e:
        print(f"   ❌ Ошибка в методе 2: {e}")

    print(f"   📊 Найдено групп через публичные каналы: {len(found_groups)}")
    return found_groups

async def method_3_forwards_analysis(client, user_id):
    """Метод 3: Анализируем пересылки от пользователя"""
    print("\n🎯 [МЕТОД 3] Анализируем пересылки для обнаружения групп...")

    groups = {}

    try:
        print("   📢 Ищем сообщения пользователя с пересылками...")

        message_count = 0
        async for message in client.iter_messages(None, from_user=user_id, limit=1000):
            message_count += 1

            if message_count % 100 == 0:
                print(f"   ⏳ Проверено сообщений: {message_count}")

            # Анализируем пересылки
            if message.fwd_from:
                fwd = message.fwd_from

                # Если переслано из канала/группы
                if hasattr(fwd, 'channel_id') and fwd.channel_id:
                    try:
                        entity = await client.get_entity(fwd.channel_id)

                        if hasattr(entity, 'title'):
                            group_id = entity.id
                            if group_id not in groups:
                                chat_type = 'канал'
                                if isinstance(entity, types.Channel):
                                    if entity.megagroup:
                                        chat_type = 'супергруппа'
                                    elif not entity.broadcast:
                                        chat_type = 'группа'

                                groups[group_id] = {
                                    'id': group_id,
                                    'title': entity.title,
                                    'username': getattr(entity, 'username', None),
                                    'type': chat_type,
                                    'method': 'forwards',
                                    'count': 0
                                }

                            groups[group_id]['count'] += 1

                    except Exception:
                        pass

                # Если переслано от пользователя
                if hasattr(fwd, 'from_id'):
                    try:
                        forward_user = await client.get_entity(fwd.from_id)
                        if hasattr(forward_user, 'dialog_id'):
                            # Можем попробовать получить диалог
                            pass
                    except Exception:
                        pass

    except Exception as e:
        print(f"   ❌ Ошибка анализа пересылок: {e}")

    print(f"   📊 Найдено групп через пересылки: {len(groups)}")
    return list(groups.values())

async def method_4_bot_api_alternative(client, user_id):
    """Метод 4: Попытка получить доступ как бот API"""
    print("\n🎯 [МЕТОД 4] Исследуем Bot API возможности...")

    try:
        # Попробуем через bot.getChatMember для различных чатов
        print("   🤖 Пробуем методы Bot API...")

        # Получаем все диалоги
        dialogs = []
        async for dialog in client.iter_dialogs(limit=100):
            dialogs.append(dialog.entity)

        print(f"   📊 Получено диалогов: {len(dialogs)}")

        # Пробуем получить информацию о пользователе в каждом диалоге
        found_info = []

        for dialog in dialogs:
            try:
                if hasattr(dialog, 'id'):
                    # Пытаемся получить информацию о участнике
                    try:
                        member = await client.get_participant(dialog, user_id)

                        chat_type = 'группа'
                        if isinstance(dialog, types.Channel):
                            if dialog.megagroup:
                                chat_type = 'супергруппа'
                            elif not dialog.broadcast:
                                chat_type = 'группа'
                            else:
                                chat_type = 'канал'

                        found_info.append({
                            'id': dialog.id,
                            'title': dialog.title,
                            'username': getattr(dialog, 'username', None),
                            'type': chat_type,
                            'method': 'get_participant',
                            'member_status': 'admin' if member.admin else 'member'
                        })

                        print(f"   ✅ {dialog.title}: {chat_type} ({'admin' if member.admin else 'member'})")

                    except Exception as e:
                        # Пользователь не участник этого чата
                        pass

            except Exception:
                pass

        print(f"   📊 Найдено групп через get_participant: {len(found_info)}")
        return found_info

    except Exception as e:
        print(f"   ❌ Ошибка в методе 4: {e}")
        return []

async def method_5_raw_api_call(client, user_id):
    """Метод 5: Прямой вызов raw MTProto API"""
    print("\n🎯 [МЕТОД 5] Прямой вызов raw MTProto методов...")

    try:
        user = await client.get_entity(user_id)

        # Пробуем напрямую вызвать разные MTProto методы
        results = {}

        # Метод 1: contacts.Resolve
        try:
            from telethon.tl import functions as raw_functions

            resolve_result = await client(functions.contacts.ResolveRequest(
                username='@' + user.username if user.username else ''
            ))
            results['contacts_resolve'] = resolve_result
            print("   ✅ contacts.Resolve сработал")
        except Exception as e:
            print(f"   ❌ contacts.Resolve не сработал: {e}")

        # Метод 2: channels.GetMessages
        try:
            # Пробуем получить сообщения пользователя напрямую
            messages_result = await client(functions.messages.GetMessagesRequest(
                id=[types.InputMessageFwdFrom(from_id=types.InputUser(
                    user_id=user_id, access_hash=user.access_hash
                ))]
            ))
            results['channels_getMessages'] = messages_result
            print("   ✅ channels.GetMessages сработал")
        except Exception as e:
            print(f"   ❌ channels.GetMessages не сработал: {e}")

        return results

    except Exception as e:
        print(f"   ❌ Ошибка в методе 5: {e}")
        return {}

async def method_6_web_session(client, user_id):
    """Метод 6: Исследуем Web-версию Telegram (если возможно)"""
    print("\n🎯 [МЕТОД 6] Попытка Web API...")

    try:
        # Web версия может иметь другие ограничения
        print("   🌐 Попытка найти Web API методы...")

        # Telegram Web не имеет API для этого
        # Но можем попробовать найти через веб-ссылки

        # Проверяем, есть ли у пользователя публичные группы через веб-ссылки
        # Это сложный процесс, требующий парсинг веб-страниц

        print("   ⚠️ Web API не предоставляет доступа к групповым связям пользователей")

        return []

    except Exception as e:
        print(f"   ❌ Ошибка в методе 6: {e}")
        return []

async def main():
    """Основная функция"""
    if len(sys.argv) < 2:
        print("Использование: python telethon-advanced-analysis.py <user_id или username>")
        sys.exit(1)

    target = sys.argv[1]
    print("=" * 70)
    print("🔍 ПРОДВИНУТЫЙ АНАЛИЗ - МЕТОДЫ 1.0-6.0")
    print("=" * 70)
    print(f"🎯 Анализируем: {target}")

    client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

    try:
        await client.connect()
        if not await client.is_user_authorized():
            print("❌ Не авторизован!")
            return

        me = await client.get_me()
        print(f"✅ Подключен как: {me.first_name} (@{me.username})")

        try:
            user = await client.get_entity(target)
            user_id = user.id
            print(f"👤 Анализируем: {user.first_name} (@{user.username}) ID: {user_id}")
        except Exception as e:
            print(f"❌ Не удалось найти пользователя: {e}")
            return

        all_groups = {}
        methods_results = {}

        # Метод 1: Диалоги
        results_1 = await method_1_user_dialogs(client, user_id)
        methods_results['dialogs'] = results_1

        # Метод 2: Публичные каналы
        results_2 = await method_2_participants_discovery(client, user_id)
        for group in results_2:
            all_groups[group['id']] = group
        methods_results['public_channels'] = results_2

        # Метод 3: Пересылки
        results_3 = await method_3_forwards_analysis(client, user_id)
        for group in results_3:
            all_groups[group['id']] = group
        methods_results['forwards'] = results_3

        # Метод 4: Bot API
        results_4 = await method_4_bot_api_alternative(client, user_id)
        for group in results_4:
            if group['id'] not in all_groups:
                all_groups[group['id']] = group
        methods_results['bot_api'] = results_4

        # Метод 5: Raw API
        results_5 = await method_5_raw_api_call(client, user_id)
        methods_results['raw_api'] = results_5

        # Метод 6: Web API
        results_6 = await method_6_web_session(client, user_id)
        for group in results_6:
            all_groups[group['id']] = group
        methods_results['web_api'] = results_6

        # ИТОГОВЫЙ ОТЧЕТ
        print("\n" + "=" * 70)
        print("📊 ИТОГОВЫЙ ОТЧЕТ - ПРОДВИНУТЫЙ АНАЛИЗ")
        print("=" * 70)

        print(f"\n🎯 ВСЕГО НАЙДЕНО ГРУПП: {len(all_groups)}")

        if all_groups:
            print("\n📋 Найденные группы:")
            for i, (group_id, group) in enumerate(sorted(all_groups.items(), key=lambda x: x[1]['title']), 1):
                username_str = f" (@{group['username']})" if group['username'] else " (приватная)"
                method_str = f" [{group['method']}]"
                print(f"   {i}. {group['title']} - {group['type']}{username_str}{method_str}")

            # Сводка по методам
            methods_count = {}
            for group in all_groups.values():
                method = group.get('method', 'unknown')
                methods_count[method] = methods_count.get(method, 0) + 1

            print(f"\n📊 Сводка по методам:")
            for method, count in methods_count.items():
                print(f"   • {method}: {count} групп")
        else:
            print("\n❌ Дополнительные группы не найдены")

        print(f"\n💡 Детализация методов:")
        print(f"   • Всего методов протестировано: {len(methods_results)}")
        for method, result in methods_results.items():
            result_count = 0
            if isinstance(result, list):
                result_count = len(result)
            elif isinstance(result, dict):
                result_count = len(result)
            print(f"   • {method}: {result_count} результатов")

        # Сохраняем подробный отчет
        with open(f'user_{user_id}_advanced_analysis.json', 'w', encoding='utf-8') as f:
            json.dump({
                'user': {
                    'id': user_id,
                    'first_name': user.first_name,
                    'username': user.username,
                    'total_found': len(all_groups)
                },
                'methods_tested': list(methods_results.keys()),
                'results_by_method': methods_results,
                'all_groups': all_groups
            }, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Подробный отчет сохранен в: user_{user_id}_advanced_analysis.json")

    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await client.disconnect()
        print("\n👋 Отключен от Telegram")

if __name__ == '__main__':
    asyncio.run(main())

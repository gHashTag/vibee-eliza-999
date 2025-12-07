#!/usr/bin/env python3
"""
Тест GramJS через Python для анализа приватных сообщений
"""

import os
import asyncio
from telegram import Client
from telegram.session import StringSession

async def test_gramjs():
    print("\n🔬 PYTHON GRAMJS TEST")
    print("=" * 60)
    
    # Получаем переменные
    api_id = os.getenv('TELEGRAM_API_ID')
    api_hash = os.getenv('TELEGRAM_API_HASH')
    session_string = os.getenv('TELEGRAM_SESSION_STRING')
    
    print("\n📊 Environment:")
    print(f"   API ID: {'✅ SET' if api_id else '❌ MISSING'}")
    print(f"   API HASH: {'✅ SET' if api_hash else '❌ MISSING'}")
    print(f"   SESSION: {'✅ SET' if session_string else '❌ MISSING'}")
    
    if not api_id or not api_hash:
        print("\n❌ Requires TELEGRAM_API_ID and TELEGRAM_API_HASH")
        return
    
    try:
        # Создаем клиент
        client = Client(
            'test',
            api_id=int(api_id),
            api_hash=api_hash,
            session_string=session_string
        )
        
        print("\n🔌 Connecting...")
        await client.start()
        print("✅ Connected!")
        
        # Получаем информацию о себе
        me = await client.get_me()
        print(f"\n👤 Account: @{me.username or 'no username'}")
        print(f"   ID: {me.id}")
        
        # Статистика
        stats = {
            'total': 0,
            'private': 0,
            'group': 0,
            'channel': 0,
            'dialogs': 0
        }
        
        print("\n📡 Getting dialogs...")
        async for dialog in client.get_dialogs():
            stats['dialogs'] += 1
            if stats['dialogs'] <= 5:
                print(f"   [{stats['dialogs']}] {dialog.name} ({dialog.chat.type})")
        
        print(f"\n📊 Total dialogs: {stats['dialogs']}")
        
        print("\n✅ SUCCESS: GramJS is working!")
        print("\n💡 Recommendations:")
        print("   1. GramJS can receive messages")
        print("   2. Use NewMessage events for groups/channels")
        print("   3. Use Raw events (UpdateShortMessage) for private messages")
        print("   4. Check plugin filter logic")
        
        await client.disconnect()
        print("\n👋 Disconnected")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_gramjs())

#!/bin/bash
# Исследование GitHub на предмет способов получения всех групп пользователя

echo "🔍 ИССЛЕДОВАНИЕ GITHUB"
echo "=" 70

echo "\n📋 ПОИСКОВЫЕ ЗАПРОСЫ:"

echo "\n1. Telegram user groups python"
echo "   https://github.com/search?q=telegram+user+groups+python"

echo "\n2. Telegram get all chats"
echo "   https://github.com/search?q=telegram+get+all+chats"

echo "\n3. Telegram MTProto user memberships"
echo "   https://github.com/search?q=telegram+mtproto+user+memberships"

echo "\n4. GetCommonChats alternative"
echo "   https://github.com/search?q=GetCommonChats+alternative"

echo "\n5. Telethon get all user groups"
echo "   https://github.com/search?q=telethon+get+all+user+groups"

echo "\n6. Telegram user enumeration"
echo "   https://github.com/search?q=telegram+user+enumeration"

echo "\n📦 ИНТЕРЕСНЫЕ РЕПОЗИТОРИИ:"

echo "\n1. grammY - Telegram Bot Framework"
echo "   https://github.com/grammyjs/grammy"

echo "\n2. TDLib examples"
echo "   https://github.com/tdlib/td"

echo "\n3. Telegram CLI"
echo "   https://github.com/vysheng/tg"

echo "\n4. Telegram API docs"
echo "   https://github.com/telegramdesktop/tdesktop"

echo "\n🔬 КЛЮЧЕВЫЕ СЛОВА ДЛЯ ПОИСКА:"

echo "\n- get_all_chats"
echo "- get_user_channels"
echo "- get_user_groups"
echo "- enumerate_user_groups"
echo "- mtproto_get_user_participants"
echo "- telegram_user_memberships"
echo "- get_common_dialogs"

echo "\n💡 ВОЗМОЖНЫЕ ПОДХОДЫ:"

echo "\n1. Публичные супергруппы"
echo "   - Пользователи могут быть найдены через публичные группы"
echo "   - Проверка всех публичных супергрупп на наличие пользователя"

echo "\n2. Админские права"
echo "   - Бот добавлен как админ в тысячи групп"
echo "   - Может видеть всех участников"

echo "\n3. MTProto raw методы"
echo "   - Прямой вызов методов API"
echo "   - Возможно, есть скрытые методы"

echo "\n4. Machine Learning"
echo "   - Анализ активности пользователя"
echo "   - Предсказание групп на основе поведения"

echo "\n5. Веб-скрапинг"
echo "   - Парсинг публичных данных"
echo "   - Анализ упоминаний и ссылок"

echo "\n✅ ИТОГ: Требуется глубокое исследование кода и API"

# Попробуем поискать через GitHub API
echo "\n🔍 ПОПЫТКА ПОИСКА ЧЕРЕЗ GITHUB API..."

curl -s "https://api.github.com/search/repositories?q=telegram+user+groups&sort=stars&order=desc" \
  -H "Accept: application/vnd.github.v3+json" | \
  python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'items' in data:
        print(f'Найдено репозиториев: {len(data[\"items\"])}')
        for repo in data['items'][:5]:
            print(f'  - {repo[\"full_name\"]}: {repo[\"description\"]}')
except:
    print('Ошибка парсинга')
" 2>/dev/null || echo "API недоступен или требует авторизации"

echo "\n"

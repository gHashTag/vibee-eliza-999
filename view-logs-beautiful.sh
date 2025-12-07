#!/bin/bash
# Красивый просмотр логов VIBEE агентов с multitail

echo "🎨 VIBEE Agents Logs Viewer - Beautiful Mode"
echo "============================================"
echo ""

# Проверяем multitail
if ! command -v multitail &> /dev/null; then
    echo "❌ multitail не найден!"
    echo "💡 Устанавливаю..."
    brew install multitail
    if [ $? -ne 0 ]; then
        echo "❌ Не удалось установить multitail"
        echo "💡 Используйте: ./view-logs.sh"
        exit 1
    fi
fi

echo "✅ multitail найден!"
echo ""
# Проверяем размер терминала
TERM_LINES=$(tput lines)
TERM_COLS=$(tput cols)

echo "📐 Размер терминала: ${TERM_COLS}x${TERM_LINES}"
echo ""

if [ $TERM_LINES -lt 30 ] || [ $TERM_COLS -lt 100 ]; then
    echo "⚠️  Терминал слишком маленький для красивого режима"
    echo "📺 Переключаюсь на стандартный режим..."
    echo ""
    sleep 2
    ./view-logs.sh
    exit 0
fi

echo "✅ Размер терминала подходит для multitail"
echo "🎯 Запуск красивого просмотра логов..."
echo "   🔵 VIBEE     - Синий"
echo "   🟡 KOLS      - Желтый"
echo "   🟣 NeuroPhoto - Розовый"
echo ""
echo "⌨️  Для выхода нажмите Ctrl+C"
echo ""

# Создаем цветные панели (упрощенная версия)
multitail \
    -cS bash \
    -t "🔵 VIBEE Agent" \
    logs/vibee.log \
    \
    -t "🟡 KOLS Agent" \
    logs/kols.log \
    \
    -t "🟣 NeuroPhoto Agent" \
    logs/neurophoto.log

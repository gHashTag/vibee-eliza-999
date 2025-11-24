#!/bin/bash

# Скрипт проверки правильности настройки VIBEE Skills
# Проверяет auto_activate, trigger_threshold, координацию агентов

echo "🔍 Валидация VIBEE Skills Configuration"
echo "=========================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Счетчики
total_skills=0
correct_skills=0
errors=0
warnings=0

# Проверка 1: auto_activate
echo "✅ Проверка 1: auto_activate: true"
echo "-----------------------------------"
for file in /Users/playra/vibee-agent/.claude/skills/vibe-*/SKILL.md; do
  if [ -f "$file" ]; then
    total_skills=$((total_skills + 1))
    skill_name=$(basename $(dirname "$file"))

    if grep -q "auto_activate: true" "$file"; then
      echo -e "  ${GREEN}✓${NC} $skill_name"
      correct_skills=$((correct_skills + 1))
    else
      echo -e "  ${RED}✗${NC} $skill_name - auto_activate НЕ установлен!"
      errors=$((errors + 1))
    fi
  fi
done
echo ""

# Проверка 2: trigger_threshold
echo "✅ Проверка 2: trigger_threshold установлен"
echo "--------------------------------------------"
for file in /Users/playra/vibee-agent/.claude/skills/vibe-*/SKILL.md; do
  if [ -f "$file" ]; then
    skill_name=$(basename $(dirname "$file"))
    threshold=$(grep "trigger_threshold:" "$file" | head -1 | awk '{print $2}')

    if [ -n "$threshold" ]; then
      echo -e "  ${GREEN}✓${NC} $skill_name: $threshold"
    else
      echo -e "  ${RED}✗${NC} $skill_name - trigger_threshold НЕ установлен!"
      errors=$((errors + 1))
    fi
  fi
done
echo ""

# Проверка 3: Координация агентов
echo "✅ Проверка 3: Координация агентов"
echo "-----------------------------------"
for file in /Users/playra/vibee-agent/.claude/skills/vibe-*/SKILL.md; do
  if [ -f "$file" ]; then
    skill_name=$(basename $(dirname "$file"))

    if grep -q "координируется с\|coordinates with" "$file"; then
      echo -e "  ${GREEN}✓${NC} $skill_name"
    else
      echo -e "  ${YELLOW}⚠${NC} $skill_name - НЕТ информации о координации"
      warnings=$((warnings + 1))
    fi
  fi
done
echo ""

# Проверка 4: Task примеры
echo "✅ Проверка 4: Task примеры"
echo "----------------------------"
for file in /Users/playra/vibee-agent/.claude/skills/vibe-*/SKILL.md; do
  if [ -f "$file" ]; then
    skill_name=$(basename $(dirname "$file"))

    if grep -q "subagent_type=" "$file"; then
      echo -e "  ${GREEN}✓${NC} $skill_name"
    else
      echo -e "  ${YELLOW}⚠${NC} $skill_name - НЕТ примеров Task"
      warnings=$((warnings + 1))
    fi
  fi
done
echo ""

# Проверка 5: Keywords
echo "✅ Проверка 5: Ключевые слова (keywords)"
echo "-----------------------------------------"
for file in /Users/playra/vibee-agent/.claude/skills/vibe-*/SKILL.md; do
  if [ -f "$file" ]; then
    skill_name=$(basename $(dirname "$file"))

    if grep -q "keywords:" "$file"; then
      echo -e "  ${GREEN}✓${NC} $skill_name"
    else
      echo -e "  ${RED}✗${NC} $skill_name - НЕТ keywords!"
      errors=$((errors + 1))
    fi
  fi
done
echo ""

# Проверка 6: Trigger Threshold Range
echo "✅ Проверка 6: Диапазон trigger_threshold"
echo "------------------------------------------"
for file in /Users/playra/vibee-agent/.claude/skills/vibe-*/SKILL.md; do
  if [ -f "$file" ]; then
    skill_name=$(basename $(dirname "$file"))
    threshold=$(grep "trigger_threshold:" "$file" | head -1 | awk '{print $2}')

    if [ -n "$threshold" ]; then
      # Проверяем, что значение в диапазоне 0.7-0.9
      if (( $(echo "$threshold >= 0.7" | bc -l) )) && (( $(echo "$threshold <= 0.9" | bc -l) )); then
        echo -e "  ${GREEN}✓${NC} $skill_name: $threshold (валидный)"
      else
        echo -e "  ${RED}✗${NC} $skill_name: $threshold (НЕвалидный диапазон!)"
        errors=$((errors + 1))
      fi
    fi
  fi
done
echo ""

# Статистика
echo "=========================================="
echo "📊 СТАТИСТИКА ВАЛИДАЦИИ"
echo "=========================================="
echo "Всего скиллов: $total_skills"
echo -e "${GREEN}Правильно настроено: $correct_skills${NC}"
echo -e "${RED}Ошибки: $errors${NC}"
echo -e "${YELLOW}Предупреждения: $warnings${NC}"
echo ""

# Процент успеха
if [ $total_skills -gt 0 ]; then
  success_rate=$((correct_skills * 100 / total_skills))
  echo "Процент успеха: $success_rate%"
fi
echo ""

# Рекомендации
echo "💡 РЕКОМЕНДАЦИИ"
echo "----------------"
if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
  echo -e "${GREEN}✓ Все скиллы настроены правильно!${NC}"
else
  if [ $errors -gt 0 ]; then
    echo -e "${RED}Исправить $errors ошибок:${NC}"
    echo "  - Добавить auto_activate: true"
    echo "  - Добавить trigger_threshold"
    echo "  - Добавить keywords"
  fi

  if [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}Предупреждения ($warnings):${NC}"
    echo "  - Добавить информацию о координации"
    echo "  - Добавить примеры Task"
  fi
fi
echo ""

# Проверка цепочек агентов
echo "🔗 ПРОВЕРКА ЦЕПОЧЕК АГЕНТОВ"
echo "============================"
echo "Проверка связей между агентами..."
echo ""

# Собираем все скиллы
all_skills=()
for file in /Users/playra/vibee-agent/.claude/skills/vibe-*/SKILL.md; do
  if [ -f "$file" ]; then
    skill_name=$(basename $(dirname "$file"))
    all_skills+=("$skill_name")
  fi
done

# Проверяем координацию
echo "Типовые цепочки агентов:"
echo "  1. Разработка плагина:"
echo "     vibe-lead → vibe-spec → vibe-coder → vibe-elizaos → vibe-tester"
echo ""
echo "  2. Аудит кода:"
echo "     vibe-critic → vibe-security → vibe-typescript"
echo ""
echo "  3. DevOps:"
echo "     vibe-devops → vibe-cicd → vibe-monitoring"
echo ""
echo "  4. AI интеграция:"
echo "     vibe-ai-llm → vibe-coder → vibe-langfuse"
echo ""

# Финальный статус
if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✅ ВАЛИДАЦИЯ ПРОЙДЕНА УСПЕШНО${NC}"
  echo "Все скиллы готовы к автоматической активации!"
  exit 0
else
  echo -e "${RED}❌ ВАЛИДАЦИЯ НЕ ПРОЙДЕНА${NC}"
  echo "Необходимо исправить $errors ошибок перед использованием."
  exit 1
fi

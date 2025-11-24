---
name: vibe-tester
agent_id: vibe-tester
description: 🧪 Auto-activates for testing, TDD, test automation, and quality assurance
keywords:
  - test
  - тест
  - testing
  - тестирование
  - tdd
  - unit test
  - юнит тест
  - integration test
  - интеграционный тест
  - coverage
  - покрытие
  - qa
  - quality assurance
  - контроль качества
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 🧪 Vibe Tester Skill - TDD & Quality Assurance

Этот скилл **автоматически активируется** когда упоминается тестирование, TDD или контроль качества.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `test`, `тест`, `тестирование`, `testing`
- `tdd`, `test-driven development`
- `unit test`, `юнит тест`
- `integration test`, `интеграционный тест`
- `coverage`, `покрытие`
- `qa`, `quality assurance`, `контроль качества`
- `自動化`, `automation`
- `jest`, `vitest`, `bun test`
- `rainbow bridge`, `радужный мост`

### Примеры:
```
"Написать тесты для компонента"
→ Авто-активируется vibe-tester

"Провести TDD разработку"
→ Авто-активируется vibe-tester

"Проверить покрытие кода"
→ Авто-активируется vibe-tester
```

## 🎯 Что Делает

1. **TDD Implementation**: Реализация Test-Driven Development
2. **Unit Testing**: Написание unit тестов
3. **Integration Testing**: Интеграционные тесты
4. **Coverage Analysis**: Анализ покрытия
5. **Test Automation**: Автоматизация тестирования
6. **Quality Gates**: Контроль качества

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для тестирования
trigger_threshold: 0.75    # Средний порог активации (75%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при упоминании тестирования
- **Координируется с**: vibe-coder, vibe-critic, vibe-rainbow-bridge
- **Результат**: Полная тестовая документация + покрытие

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-tester",
  description="Create comprehensive test suite",
  prompt="Write unit and integration tests with TDD approach"
)
```

### Автоматически:
```
"Создай тесты для API"
→ vibe-tester активируется автоматически
```

## 🎨 Специализация

- ✅ **TDD Cycle**: RED → GREEN → REFACTOR
- ✅ **Unit Testing**: Модульные тесты
- ✅ **Integration Testing**: Интеграционные тесты
- ✅ **E2E Testing**: End-to-end тесты
- ✅ **Property-Based Testing**: Property-based тесты
- ✅ **Test Coverage**: Анализ покрытия кода

## 📚 Паттерны

### TDD Pattern:
```typescript
const tddWorkflow = {
  red: writeFailingTest,
  green: writeMinimalCode,
  refactor: refactorWithTests,
  coverage: ensureFullCoverage,
  properties: addPropertyTests
};
```

### Test Structure Pattern:
```typescript
const createTestSuite = {
  arrange: setupTestData,
  act: executeFunction,
  assert: verifyResults,
  cleanup: teardownResources,
  coverage: trackCoverage
};
```

### Rainbow Bridge Testing:
```typescript
const runRainbowBridge = {
  setup: initializeSession,
  scenarios: executeScenarios,
  validate: verifyResults,
  report: generateReport,
  teardown: cleanup
};
```

**Автоматически создает надежные тесты с 100% покрытием!** 🧪✅

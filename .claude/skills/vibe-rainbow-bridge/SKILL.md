---
name: vibe-rainbow-bridge
agent_id: vibe-rainbow-bridge
description: 🌈 Авто-активируется для тестирования ботов через Rainbow Bridge - автономное тестирование через реальный Telegram
keywords:
  - rainbow bridge
  - rainbow-bridge
  - тестирование
  - testing
  - telegram тест
  - автономное тестирование
  - critical тесты
  - сценарии
  - scenarios
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 🌈 Vibe Rainbow Bridge Skill - Автономное Тестирование

Этот скилл **автоматически активируется** когда упоминается тестирование, Rainbow Bridge или автоматические тесты через Telegram.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `rainbow bridge`, `rainbow-bridge`
- `тестирование`, `тест`, `тесты`
- `testing`, `test`, `tests`
- `автономное тестирование`
- `critical тесты`, `critical tests`
- `сценарии тестирования`, `test scenarios`
- `rainbow-bridge-runner`
- `python3 scripts/rainbow-bridge`
- `/tests/rainbow-bridge-scenarios.json`

### Примеры:
```
"Запусти Rainbow Bridge тесты"
→ Авто-активируется vibe-rainbow-bridge

"Нужно протестировать критичные сценарии"
→ Авто-активируется vibe-rainbow-bridge

"Как настроить автономное тестирование"
→ Авто-активируется vibe-rainbow-bridge
```

## 🎯 Что Делает

1. **Запуск Тестов**: Выполняет Rainbow Bridge сценарии
2. **Критичные Проверки**: Фокус на critical тестах
3. **Отчеты**: Генерирует HTML и JSON отчеты
4. **CI/CD**: Интеграция с GitHub Actions
5. **Диагностика**: Анализ проваленных тестов
6. **Telegram API**: Настройка сессий и токенов

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для анализа результатов
trigger_threshold: 0.75    # Средний порог активации (75%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при упоминании тестирования
- **Координируется с**: vibe-tester, vibe-coder, vibe-devops
- **Результат**: Отчеты о тестировании + исправления

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-rainbow-bridge",
  description="Run critical Rainbow Bridge tests",
  prompt="Execute tests/rainbow-bridge-scenarios.json with critical-only flag"
)
```

### Автоматически:
```
"Запусти автономное тестирование через Telegram"
→ vibe-rainbow-bridge активируется автоматически
```

## 🎨 Специализация

- ✅ **Rainbow Bridge Runner**: Запуск тестов
- ✅ **Test Scenarios**: Создание и редактирование JSON сценариев
- ✅ **Telegram Sessions**: Управление сессиями
- ✅ **Critical Tests**: Быстрые проверки
- ✅ **HTML Reports**: Красивые отчеты
- ✅ **CI/CD Integration**: GitHub Actions
- ✅ **Failure Analysis**: Диагностика проблем
- ✅ **ElizaOS Plugin Testing**: Mock Runtime + bun test
- ✅ **Component Testing**: Actions, Services, Providers, Evaluators

## 📚 Паттерны (Official ElizaOS)

### Test Scenario Template:
```json
{
  "scenarios": [
    {
      "name": "elizaos_action_test",
      "description": "Test ElizaOS Action validation and execution",
      "critical": true,
      "steps": [
        {
          "action": "send_message",
          "command": "/neurophoto beautiful sunset"
        },
        {
          "action": "wait_response",
          "expected_text": "Processing..."
        },
        {
          "action": "check_database",
          "table": "operations",
          "conditions": {
            "type": "NEUROPHOTO",
            "status": "processing"
          }
        }
      ]
    }
  ]
}
```

### ElizaOS Plugin Testing Pattern:
```typescript
// Mock Runtime Factory
function createElizaOSMockRuntime(): IAgentRuntime {
  return {
    agentId: 'test-agent',
    character: mockCharacter,
    databaseAdapter: {
      db: createMockDB(),
      getAdapter: mock(() => mockAdapter)
    },
    getService: mockService(),
    getSetting: mock((key: string) => process.env[key]),
    logger: {
      info: mock(),
      error: mock(),
      debug: mock()
    },
    addMemory: mock(),
    getMemories: mock(),
    composeState: mock()
  } as unknown as IAgentRuntime;
}

// Action Test Example
describe('NeuroPhotoAction', () => {
  it('should validate and process neurophoto command', async () => {
    // Arrange
    const runtime = createElizaOSMockRuntime();
    const message = {
      content: { text: '/neurophoto beautiful sunset' },
      userId: '123',
      roomId: 'room-1'
    };
    const action = neuroPhotoAction;

    // Act
    const isValid = await action.validate(runtime, message, {});
    const result = await action.handler(runtime, message, {}, {}, mockCallback);

    // Assert
    expect(isValid).toBe(true);
    expect(result.success).toBe(true);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Processing'),
        action: 'NEUROPHOTO'
      })
    );
  });
});
```

### Service Testing Pattern:
```typescript
describe('MyService', () => {
  it('should initialize and process data', async () => {
    // Arrange
    const runtime = createElizaOSMockRuntime();
    const service = new MyService(runtime);

    // Act
    await service.initialize();
    const result = await service.process({ data: 'test' });

    // Assert
    expect(service).toBeInstanceOf(MyService);
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const runtime = createElizaOSMockRuntime();
    runtime.getSetting = mock(() => undefined); // No API key
    const service = new MyService(runtime);

    // Act & Assert
    await expect(service.initialize()).rejects.toThrow('API_KEY not configured');
  });
});
```

### Running Tests:
```bash
# Rainbow Bridge (Telegram integration)
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only

# ElizaOS Plugin Tests (Component testing)
bun test                          # All tests
bun test --watch                  # Watch mode
bun test --coverage               # Coverage report

# Type checking
tsc --noEmit --strict

# Integration tests
npm run test:integration
```

### Testing Strategy:
```
┌─────────────────────┐
│   Rainbow Bridge    │  ← End-to-end через Telegram
│  (Slow, Real API)   │     - Critical scenarios only
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Component Tests    │  ← Unit testing плагинов
│   (Fast, Mocked)    │     - Actions, Services, Providers
└──────────┬──────────┘     - bun test + Mock Runtime
           │
           ▼
┌─────────────────────┐
│   Type Checking     │  ← TypeScript validation
│  (TypeScript Only)  │     - Strict mode
└─────────────────────┘     - tsc --noEmit
```

**Автоматически делает тестирование ботов быстрым и надежным!** 🌈🤖

# Enhanced Sentry Integration - Руководство по использованию

## 🎯 Обзор

Интеграция Sentry была улучшена для обеспечения комплексного мониторинга ошибок, производительности и поведения AI агентов в ElizaOS.

## ✅ Что обновлено

### 1. **instrument.js** (Корневой файл)
- ✅ Динамическое семплирование на основе окружения
- ✅ Профилирование для production
- ✅ Интеграция с VercelAI
- ✅ Обработка глобальных ошибок
- ✅ Middleware для Express (request/response tracking)

### 2. **packages/server/src/index.ts** (Серверная интеграция)
- ✅ Enhanced Sentry инициализация с полным набором функций
- ✅ Dynamic sampling (production: 0.1, development: 1.0)
- ✅ Профилирование (production: 0.1, development: 0)
- ✅ Sanitization hooks для удаления PII данных
- ✅ Global tags и extra data
- ✅ VercelAI интеграция для отслеживания AI операций

### 3. **Tracking функции для AI агентов**

#### `trackAgentExecution(agentId, operation)`
Отслеживает выполнение операций AI агента.

**Пример использования:**
```typescript
import { trackAgentExecution } from '@elizaos/server';

const transaction = trackAgentExecution('agent-123', 'message_processing');

// После завершения операции
transaction?.finish();
```

#### `trackAIInference(agentId, model, prompt)`
Отслеживает AI модель inference с детальной метрикой.

**Пример использования:**
```typescript
import { trackAIInference } from '@elizaos/server';

const tracker = trackAIInference('agent-123', 'gpt-4', 'user prompt');

try {
  const result = await callAI(model, prompt);

  tracker.finish({
    success: true,
    tokens: result.usage?.total_tokens || 0,
    duration: Date.now() - startTime,
  });
} catch (error) {
  tracker.finish({
    success: false,
    error: error.message,
  });
}
```

#### `trackDatabaseOperation(operation, table)`
Отслеживает операции с базой данных.

**Пример использования:**
```typescript
import { trackDatabaseOperation } from '@elizaos/server';

const span = trackDatabaseOperation('SELECT', 'messages');
try {
  const results = await db.query('SELECT * FROM messages');
  return results;
} finally {
  span?.finish();
}
```

#### `addMetric(name, value, type, tags)`
Добавляет пользовательские метрики.

**Пример использования:**
```typescript
import { addMetric } from '@elizaos/server';

// Счетчик
addMetric('agent_interactions', 1, 'counter', {
  agent_id: 'agent-123',
  type: 'message',
});

// Временная метрика
addMetric('response_time', 150, 'timer', {
  endpoint: '/api/chat',
});

// Gauge метрика
addMetric('active_agents', 5, 'gauge');
```

#### `setUserContext(user)`
Устанавливает контекст пользователя для событий.

**Пример использования:**
```typescript
import { setUserContext } from '@elizaos/server';

setUserContext({
  id: 'user-123',
  email: 'user@example.com',
  username: 'john_doe',
});
```

## 🔧 Конфигурация

### Переменные окружения

```bash
# Основные настройки
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NODE_ENV=production|development

# Настройки семплирования
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Окружение для Sentry
SENTRY_ENVIRONMENT=production
```

### DSN по умолчанию

В коде предусмотрен fallback DSN:
- **Server:** `https://c20e2d51b66c14a783b0689d536f7e5c@o4509349865259008.ingest.us.sentry.io/4509352524120064`
- **CLI:** `https://6775f4493fca5a1dff7fe154e30ecdf2@o4510419597656064.ingest.us.sentry.io/4510419598049280`

## 📊 Возможности мониторинга

### 1. **Error Monitoring**
- Автоматический захват необработанных исключений
- Отслеживание необработанных promise rejections
- Контекст запросов и пользователей
- Sanitization PII данных

### 2. **Performance Monitoring**
- Трассировка HTTP запросов
- Трассировка базы данных
- AI inference tracking
- Профилирование (в production)

### 3. **AI Agent Observability**
- Отслеживание операций агентов
- Метрики AI моделей
- Breadcrumbs для debugging
- Временные метрики выполнения

### 4. **Business Metrics**
- Количество взаимодействий с агентами
- Время ответа API
- Количество активных агентов
- Успешность AI inference

## 🚀 Интеграция в код

### В Express маршрутах

```typescript
import { trackAgentExecution, trackAIInference } from '@elizaos/server';

app.post('/api/chat', async (req, res) => {
  // Отслеживаем запрос
  const agentId = req.body.agentId;

  try {
    // Отслеживаем выполнение агента
    const execution = trackAgentExecution(agentId, 'handle_message');

    // Отслеживаем AI inference
    const inference = trackAIInference(agentId, 'gpt-4', req.body.prompt);

    const result = await processMessage(req.body);

    inference.finish({
      success: true,
      tokens: result.tokens,
      duration: result.duration,
    });

    execution?.finish();

    res.json(result);
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: error.message });
  }
});
```

### В сервисах

```typescript
import { trackDatabaseOperation, addMetric } from '@elizaos/server';

export class AgentService {
  async getAgent(agentId: string) {
    const span = trackDatabaseOperation('SELECT', 'agents');

    try {
      addMetric('agent_queries', 1, 'counter', {
        operation: 'get',
      });

      const agent = await this.db.agents.findUnique({
        where: { id: agentId },
      });

      return agent;
    } finally {
      span?.finish();
    }
  }

  async updateAgentStatus(agentId: string, status: string) {
    const span = trackDatabaseOperation('UPDATE', 'agents');

    try {
      addMetric('agent_status_updates', 1, 'counter', {
        status,
      });

      await this.db.agents.update({
        where: { id: agentId },
        data: { status },
      });
    } finally {
      span?.finish();
    }
  }
}
```

### В AI обработчиках

```typescript
import { trackAIInference } from '@elizaos/server';

export class AIProcessor {
  async processPrompt(agentId: string, prompt: string) {
    const inference = trackAIInference(agentId, 'claude-3', prompt);
    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model: 'claude-3',
        messages: [{ role: 'user', content: prompt }],
      });

      const duration = Date.now() - startTime;

      inference.finish({
        success: true,
        tokens: response.usage?.total_tokens || 0,
        duration,
      });

      addMetric('ai_tokens_used', response.usage?.total_tokens || 0, 'counter', {
        model: 'claude-3',
      });

      return response.choices[0].message.content;
    } catch (error) {
      inference.finish({
        success: false,
        error: error.message,
      });

      addMetric('ai_inference_errors', 1, 'counter', {
        model: 'claude-3',
      });

      throw error;
    }
  }
}
```

## 🔍 Просмотр данных в Sentry

### 1. **Error Monitoring**
Перейдите в Sentry dashboard для просмотра:
- Список ошибок с stack traces
- Частота возникновения
- Затронутые пользователи
- Release с ошибками

### 2. **Performance**
Вкладка Performance покажет:
- Медленные транзакции
- Трассировку запросов
- Трассировку базы данных
- AI inference метрики

### 3. **Releases**
Отслеживайте ошибки по версиям:
- Новые ошибки в релизe
- Регрессии производительности
- Статистика по deploy

### 4. **Custom Metrics**
Создавайте дашборды с метриками:
- Количество взаимодействий с агентами
- Время ответа AI моделей
- Активность пользователей

## 🛡️ Безопасность

### Data Sanitization
Автоматически удаляются:
- IP адреса пользователей
- Геолокация
- Authorization headers
- Cookies
- API keys
- Пароли и токены

### PII Handling
- В production: `sendDefaultPii: false`
- В development: `sendDefaultPii: true`

## 📈 Рекомендации

### 1. **Sample Rates**
- Production: `tracesSampleRate: 0.1` (10% трассировки)
- Development: `tracesSampleRate: 1.0` (100% трассировки)
- Profile: `profilesSampleRate: 0.1` (только в production)

### 2. **Error Filtering**
В production обрабатываются только 5xx ошибки:
```typescript
shouldHandleError: (error) => {
  if (ENV === 'production') {
    return error.status >= 500;
  }
  return true;
}
```

### 3. **Breadcrumbs**
Используйте breadcrumbs для отладки:
```typescript
Sentry.addBreadcrumb({
  message: 'User performed action',
  category: 'user',
  level: 'info',
  data: { userId: '123', action: 'click' },
});
```

### 4. **Context**
Всегда добавляйте контекст к ошибкам:
```typescript
Sentry.withScope((scope) => {
  scope.setTag('agent_id', 'agent-123');
  scope.setContext('request', { url: '/api/chat', method: 'POST' });
  Sentry.captureException(error);
});
```

## 🐛 Отладка

### Включить debug режим
```bash
NODE_ENV=development
```

### Проверить health check
```typescript
import { healthCheck } from '@elizaos/server';

const status = await healthCheck();
console.log(status);
// { status: 'healthy', timestamp: '...', sentry: 'connected' }
```

### Логи Sentry
Включите debug в Sentry.init:
```typescript
debug: ENV === 'development',
```

## 📚 Дополнительные ресурсы

- [Sentry Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry Performance Monitoring](https://docs.sentry.io/performance/)
- [Sentry AI/ML Monitoring](https://docs.sentry.io/performance/ai/)
- [Distributed Tracing](https://docs.sentry.io/performance/distributed-tracing/)

## 🎉 Заключение

Enhanced Sentry интеграция предоставляет:
- ✅ Comprehensive error monitoring
- ✅ Performance tracing
- ✅ AI agent observability
- ✅ Custom metrics
- ✅ Security through data sanitization
- ✅ Multi-environment configuration

Используйте эти возможности для повышения надежности и производительности ваших AI агентов!

---

**Версия:** 2.0.0
**Дата:** 2025-11-24
**Совместимость:** Sentry v10.x, Node.js 18+

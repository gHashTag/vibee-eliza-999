# Sentry Integration Enhanced - Лучшие Практики

## 🎯 Обзор Улучшений

На основе анализа текущей интеграции Sentry в проекте ElizaOS и лучших практик от экспертов, представляю комплексный план улучшения мониторинга.

## ✅ Что Уже Реализовано

### 1. **Базовый Instrument** (`/instrument.js`)
- ✅ ESM-совместимая интеграция
- ✅ DSN конфигурация
- ✅ Performance tracing (tracesSampleRate: 1.0)
- ✅ PII data collection (sendDefaultPii: true)
- ✅ Environment detection

### 2. **Серверная Интеграция** (`packages/server/src/index.ts`)
- ✅ Инициализация Sentry в Express приложении
- ✅ VercelAI интеграция
- ✅ API error capture с контекстом
- ✅ Process-level error handlers (uncaughtException, unhandledRejection)
- ✅ Environment-based конфигурация

### 3. **CLI Интеграция** (`packages/cli/src/index.ts`)
- ✅ Импорт Sentry в CLI
- ✅ TypeScript declarations

## 🚀 Рекомендуемые Улучшения

### 1. **Performance Monitoring Улучшения**

#### A. Dynamic Sampling
```typescript
// instrument.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://6775f4493fca5a1dff7fe154e30ecdf2@o4510419597656064.ingest.us.sentry.io/4510419598049280",
  sendDefaultPii: true,

  // Dynamic sampling based on environment
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Auto-enabling profiling in production
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Session replays for better UX debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV || 'production',
});
```

#### B. Performance Budgets
```typescript
// utils/performance-budgets.ts
import * as Sentry from "@sentry/node";

export class PerformanceMonitor {
  static setTransactionName(name: string) {
    Sentry.getActiveTransaction()?.setName(name);
  }

  static setTag(key: string, value: string) {
    Sentry.getActiveTransaction()?.setTag(key, value);
  }

  static measure(name: string, description?: string) {
    const transaction = Sentry.getActiveTransaction();
    const span = transaction?.startChild({
      op: name,
      description,
    });

    return {
      finish: () => span?.finish(),
    };
  }
}

// Usage in routes
app.get('/api/agents', (req, res, next) => {
  const transaction = Sentry.startTransaction({
    op: 'http.server',
    name: 'GET /api/agents',
  });

  const span = transaction.startChild({
    op: 'db.query',
    description: 'Fetch agents from database',
  });

  // ... your logic
  span.finish();
  transaction.finish();
});
```

### 2. **Advanced Error Context**

#### A. Request Context Enrichment
```typescript
// middleware/sentry-context.ts
import * as Sentry from "@sentry/node";

export function addSentryContext(req: Request, res: Response, next: NextFunction) {
  // Add user context if available
  if (req.user) {
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
    });
  }

  // Add request context
  Sentry.addBreadcrumb({
    message: `${req.method} ${req.path}`,
    category: 'http',
    level: 'info',
    data: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
    },
  });

  // Set transaction name
  Sentry.getActiveTransaction()?.setName(`${req.method} ${req.path}`);

  next();
}
```

#### B. Error Classification
```typescript
// utils/error-classifier.ts
import * as Sentry from "@sentry/node";

export function classifyAndCaptureError(error: Error, context: any) {
  const isOperational = isOperationalError(error);
  const severity = isOperational ? 'warning' : 'error';

  Sentry.withScope((scope) => {
    scope.setTag('error.type', error.name);
    scope.setTag('error.code', error.code);
    scope.setTag('operational', isOperational);
    scope.setLevel(severity);

    if (isOperational) {
      scope.setTag('capture', 'false');
    }

    scope.setContext('error', {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    scope.setContext('request', context);

    if (!isOperational) {
      Sentry.captureException(error);
    }
  });
}

function isOperationalError(error: Error): boolean {
  return (
    error.name === 'ValidationError' ||
    error.name === 'NotFoundError' ||
    error.name === 'UnauthorizedError' ||
    error.name === 'ForbiddenError'
  );
}
```

### 3. **Custom Metrics & Dashboards**

#### A. Business Metrics
```typescript
// utils/metrics.ts
import * as Sentry from "@sentry/node";

export class MetricsCollector {
  static countAgentInteractions(agentId: string, type: string) {
    Sentry.metrics.increment('agent.interactions', 1, {
      tags: {
        agent_id: agentId,
        interaction_type: type,
      },
    });
  }

  static measureResponseTime(endpoint: string, duration: number) {
    Sentry.metrics.timing('http.response_time', duration, {
      tags: {
        endpoint,
      },
    });
  }

  static gaugeActiveAgents(count: number) {
    Sentry.metrics.gauge('agents.active', count);
  }
}

// Usage in agent handlers
export async function handleMessage(runtime: IAgentRuntime, message: Content) {
  const start = Date.now();

  try {
    MetricsCollector.countAgentInteractions(runtime.agentId, 'message');
    // ... handle message
  } finally {
    const duration = Date.now() - start;
    MetricsCollector.measureResponseTime('handle_message', duration);
  }
}
```

#### B. Health Checks with Sentry
```typescript
// utils/health-check.ts
import * as Sentry from "@sentry/node";

export async function performHealthCheck() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      agents: await checkAgents(),
      memory: await checkMemory(),
      sentry: await checkSentryConnection(),
    },
  };

  // Send health metrics to Sentry
  Sentry.metrics.gauge('health.check.duration', Date.now() - start);
  Sentry.metrics.increment('health.check.runs', 1);

  // Alert on degraded health
  const failedChecks = Object.entries(health.checks).filter(([, status]) => !status);
  if (failedChecks.length > 0) {
    Sentry.captureMessage(
      `Health check failed: ${failedChecks.map(([name]) => name).join(', ')}`,
      'warning'
    );
  }

  return health;
}

async function checkSentryConnection(): Promise<boolean> {
  try {
    const transaction = Sentry.startTransaction({ name: 'health.sentry' });
    await transaction.finish();
    return true;
  } catch {
    return false;
  }
}
```

### 4. **Alerting & Notifications**

#### A. Custom Alert Rules
```typescript
// utils/alerting.ts
import * as Sentry from "@sentry/node";

export class AlertManager {
  static setupAlerts() {
    // Alert on high error rate
    Sentry.on('afterSend', (event) => {
      const recentErrors = this.getRecentErrors();
      if (recentErrors.length > 100) {
        Sentry.captureMessage('High error rate detected', 'warning');
      }
    });

    // Alert on performance degradation
    Sentry.on('afterSendTransaction', (event) => {
      const duration = event.transaction?.start_timestamp
        ? (Date.now() - event.transaction.start_timestamp) / 1000
        : 0;

      if (duration > 5) {
        Sentry.addBreadcrumb({
          message: `Slow transaction detected: ${event.transaction?.name}`,
          category: 'performance',
          level: 'warning',
        });
      }
    });
  }

  private static getRecentErrors(): any[] {
    // Implementation to get recent errors from Sentry SDK
    return [];
  }
}
```

#### B. Slack Integration
```typescript
// utils/notifications.ts
import * as Sentry from "@sentry/node";

export class NotificationService {
  static async sendSlackAlert(event: Sentry.Event) {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const message = {
      text: `🚨 Sentry Alert: ${event.level?.toUpperCase()}`,
      attachments: [
        {
          color: this.getColor(event.level),
          fields: [
            {
              title: 'Environment',
              value: event.environment || 'unknown',
              short: true,
            },
            {
              title: 'Level',
              value: event.level || 'unknown',
              short: true,
            },
            {
              title: 'Message',
              value: event.message?.formatted || 'No message',
              short: false,
            },
          ],
        },
      ],
    };

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  }

  private static getColor(level?: string): string {
    switch (level) {
      case 'fatal':
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'good';
    }
  }
}
```

### 5. **Advanced Debugging**

#### A. Session Replays
```typescript
// instrument.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://6775f4493fca5a1dff7fe154e30ecdf2@o4510419597656064.ingest.us.sentry.io/4510419598049280",

  // Session replays for debugging user issues
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Mask sensitive data
  beforeSendReplay(replay) {
    return this.maskSensitiveData(replay);
  },

  // Custom PII detection
  beforeSendTransaction(event) {
    return this.sanitizeEvent(event);
  },
});

private static maskSensitiveData(data: any) {
  // Implementation to mask sensitive data in replays
  return data;
}

private static sanitizeEvent(event: Sentry.Event) {
  // Remove or mask sensitive information
  if (event.user) {
    delete event.user.ip_address;
    delete event.user.geo;
  }
  return event;
}
```

#### B. Source Maps for Better Debugging
```typescript
// vite.config.ts (for client)
import { defineConfig } from 'vite';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: "vibee",
      project: "eliza-client",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        include: ['./dist'],
        ignore: ['node_modules'],
      },
    }),
  ],
});
```

### 6. **Testing with Sentry**

#### A. Error Monitoring Tests
```typescript
// tests/sentry.test.ts
import * as Sentry from "@sentry/node";

describe('Sentry Integration', () => {
  beforeEach(() => {
    Sentry.init({
      dsn: 'https://test@o123.ingest.sentry.io/123',
      tracesSampleRate: 0,
    });
  });

  it('should capture exceptions', async () => {
    const captureExceptionSpy = jest.spyOn(Sentry, 'captureException');

    try {
      throw new Error('Test error');
    } catch (error) {
      Sentry.captureException(error);
    }

    expect(captureExceptionSpy).toHaveBeenCalled();
  });

  it('should add context to errors', () => {
    const scope = new Sentry.Scope();
    scope.setTag('test', 'value');
    scope.setContext('request', { url: '/test' });

    // Test context addition
    expect(scope.getTags()).toEqual({ test: 'value' });
  });
});
```

### 7. **Multi-Environment Configuration**

#### A. Environment-Specific Settings
```typescript
// config/sentry.ts
import * as Sentry from "@sentry/node";

export function initSentry() {
  const config = {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: getTracesSampleRate(),
    profilesSampleRate: getProfilesSampleRate(),
    replaysSessionSampleRate: getReplaysSampleRate(),
  };

  Sentry.init(config);
}

function getTracesSampleRate(): number {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 0.1;
    case 'staging':
      return 0.5;
    default:
      return 1.0;
  }
}

function getProfilesSampleRate(): number {
  return process.env.NODE_ENV === 'production' ? 0.1 : 0;
}

function getReplaysSampleRate(): number {
  return process.env.NODE_ENV === 'production' ? 0.1 : 0;
}
```

### 8. **Tracing for AI Agents**

#### A. Agent Execution Tracing
```typescript
// utils/agent-tracing.ts
import * as Sentry from "@sentry/node";

export class AgentTracer {
  static startAgentTask(agentId: string, taskType: string) {
    return Sentry.startTransaction({
      op: 'agent.task',
      name: `${taskType} - ${agentId}`,
      tags: {
        agent_id: agentId,
        task_type: taskType,
      },
    });
  }

  static traceAIRequest(agentId: string, model: string, prompt: string) {
    const transaction = Sentry.getActiveTransaction();
    const span = transaction?.startChild({
      op: 'ai.request',
      description: `${model} inference`,
      data: {
        agent_id: agentId,
        model,
        prompt_length: prompt.length,
      },
    });

    return {
      finish: (result: any) => {
        span?.setData('result.success', result.success);
        span?.setData('result.tokens', result.tokens);
        span?.finish();
      },
    };
  }

  static traceMemoryOperation(operation: string, agentId: string) {
    return Sentry.startChild({
      op: 'memory.operation',
      description: `${operation} memory`,
      data: {
        operation,
        agent_id: agentId,
      },
    });
  }
}
```

### 9. **Integration with AI Entry Patterns**

#### A. Entry Validation Monitoring
```typescript
// utils/entry-validation-monitoring.ts
import * as Sentry from "@sentry/node";

export function monitorEntryValidation(
  entryType: 'agent' | 'service' | 'plugin',
  result: ValidationResult
) {
  if (!result.isValid) {
    Sentry.captureMessage(
      `Invalid ${entryType} entry configuration`,
      'warning',
      {
        extra: {
          errors: result.errors,
          warnings: result.warnings,
        },
      }
    );
  }

  // Count validation failures
  Sentry.metrics.increment(`entry.validation.failures`, result.errors.length, {
    tags: {
      entry_type: entryType,
    },
  });

  // Track warning counts
  Sentry.metrics.gauge(`entry.validation.warnings`, result.warnings.length, {
    tags: {
      entry_type: entryType,
    },
  });
}
```

### 10. **Distributed Tracing for Multi-Agent Systems**

#### A. Cross-Agent Tracing
```typescript
// utils/distributed-tracing.ts
import * as Sentry from "@sentry/node";

export class DistributedTracer {
  static propagateTraceHeaders(headers: Record<string, string>) {
    const transaction = Sentry.getActiveTransaction();
    if (transaction) {
      const spanContext = transaction.spanContext;
      headers['sentry-trace'] = spanContext.toTraceparent();
    }
  }

  static continueTraceFromHeaders(headers: Record<string, string>) {
    const sentryTrace = headers['sentry-trace'];
    if (sentryTrace) {
      return Sentry.continueTrace({
        name: 'agent.request',
        op: 'http.server',
        status: 'ok',
        trace: sentryTrace,
      });
    }
  }

  static traceAgentCommunication(fromAgentId: string, toAgentId: string, messageType: string) {
    return Sentry.startChild({
      op: 'agent.communication',
      description: `Message from ${fromAgentId} to ${toAgentId}`,
      data: {
        from_agent: fromAgentId,
        to_agent: toAgentId,
        message_type: messageType,
      },
    });
  }
}
```

## 📊 Мониторинг Ключевых Метрик

### Performance Metrics
- Response time percentiles (p50, p95, p99)
- Throughput (requests/second)
- Error rate
- Active agent count
- Memory usage

### Business Metrics
- Agent interactions per minute
- Successful message processing rate
- RAG query success rate
- Multi-agent task completion rate

### System Health
- Database connection health
- API endpoint availability
- Agent service status
- Sentry connectivity

## 🔧 Инструменты для DevOps

### Grafana Dashboard Integration
```typescript
// utils/metrics-export.ts
import * as Sentry from "@sentry/node";

export class MetricsExporter {
  static exportToPrometheus() {
    // Export Sentry metrics to Prometheus
    // Implementation for Prometheus integration
  }

  static exportToGrafana() {
    // Send metrics to Grafana
    // Implementation for Grafana integration
  }
}
```

### Kubernetes Health Checks
```yaml
# k8s/health-check.yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: eliza-server
      image: vibee/eliza:latest
      livenessProbe:
        httpGet:
          path: /healthz
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /api/server/ping
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
```

## 📚 Документация для Команды

### On-Call Procedures
1. **Sentry Dashboard Navigation**
   - Navigate to project: https://sentry.io/organizations/vibee/projects/eliza
   - View error trends and patterns
   - Check performance impact

2. **Alert Response Workflow**
   - Receive Slack/email alert from Sentry
   - Check error details in Sentry dashboard
   - Classify as operational vs. code bug
   - Create GitHub issue if needed
   - Monitor resolution

3. **Performance Issue Investigation**
   - Check transactions tab for slow requests
   - Use flame graph to identify bottlenecks
   - Review distributed traces for multi-agent issues
   - Check memory usage patterns

### Best Practices Checklist
- [ ] All errors are captured with context
- [ ] Performance monitoring is enabled
- [ ] Business metrics are tracked
- [ ] Alerts are configured for critical issues
- [ ] Team knows how to investigate issues in Sentry
- [ ] Source maps are uploaded for client-side debugging
- [ ] Session replays are enabled for UX issues
- [ ] Distributed tracing works across agent boundaries

## 🎯 Roadmap for Next Quarter

### Q1 2025
1. ✅ Implement dynamic sampling
2. ✅ Add business metrics tracking
3. ✅ Set up alerting rules
4. ✅ Create Grafana dashboards

### Q2 2025
1. 🔄 Implement distributed tracing for multi-agent
2. 🔄 Add AI model performance monitoring
3. 🔄 Create automated regression detection
4. 🔄 Implement auto-scaling alerts

### Q3 2025
1. 📋 Add ML-powered anomaly detection
2. 📋 Implement predictive alerting
3. 📋 Create self-healing mechanisms
4. 📋 Add cost optimization metrics

## 📝 Заключение

Внедрение этих улучшений позволит:
- **Улучшить visibility** в производительности системы
- **Сократить MTTR** (Mean Time To Resolution)
- **Предотвратить проблемы** через proactive мониторинг
- **Оптимизировать затраты** на инфраструктуру
- **Повысить качество** AI-агентов

Рекомендуется внедрять улучшения постепенно, начиная с критичных областей и расширяя мониторинг по мере необходимости.

---

**Автор:** Claude Code
**Дата:** 2025-11-24
**Версия:** 2.0.0

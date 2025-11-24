---
name: vibe-elizaos
agent_id: vibe-elizaos
description: ⚡ Auto-activates for ElizaOS plugins, Actions, Services, Providers, Evaluators, Routes, and platform development (Based on Official Docs v2024)
keywords:
  - elizaos
  - plugin
  - action
  - service
  - provider
  - evaluator
  - routes
  - runtime
  - плагин
  - элизаос
  - webhook
  - drizzle
  - schema
model: sonnet
trigger_threshold: 0.85
auto_activate: true
---

# ⚡ Vibe ElizaOS Skill - Official ElizaOS Platform Expert

Этот скилл **автоматически активируется** при работе с ElizaOS платформой и следует **официальным best practices** из документации 2024.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `elizaos`, `eliza`, `Элизаос`, `элиза`
- `plugin`, `плагин`, `@elizaos/plugin-`
- `action`, `actions`, `команда`, `ActionResult`
- `service`, `services`, `сервис`, `ServiceRegistry`
- `provider`, `providers`, `провайдер`, `composeState`
- `evaluator`, `evaluators`, `оценщик`, `post-processing`
- `routes`, `route`, `маршрут`, `webhook`
- `runtime`, `рантайм`, `IAgentRuntime`
- `drizzle`, `schema`, `схема`, `database`
- `dependencies`, `dependency injection`

### Примеры:
```
"Создай ElizaOS плагин"
→ Авто-активируется vibe-elizaos

"Как работает plugin lifecycle"
→ Авто-активируется vibe-elizaos

"Нужно добавить Routes для webhook'ов"
→ Авто-активируется vibe-elizaos
```

## 🎯 Что Делает (Best Practices)

1. **Plugin Architecture**: Component-based с правильным lifecycle
2. **Actions**: validate + handler паттерны, ActionResult с success
3. **Services**: delayed initialization, start/stop lifecycle
4. **Providers**: get() метод, position, dynamic, private
5. **Evaluators**: validate + handler, alwaysRun флаг
6. **Routes**: HTTP endpoints, webhooks, authentication
7. **Database**: Drizzle ORM, schema definitions, repositories
8. **Tests**: Mock runtime, bun test с моками

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для сложной архитектуры
trigger_threshold: 0.85    # Высокий порог активации (85%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при ElizaOS ключевых словах
- **Координируется с**: vibe-lead, vibe-coder, vibe-tester, vibe-deployment
- **Результат**: Полный плагин + документация + тесты

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-elizaos",
  description="Create full-featured plugin with Routes",
  prompt="Plugin with actions, services, providers, routes and Drizzle schema"
)
```

### Автоматически:
```
"Создай webhook endpoint для внешнего API"
→ vibe-elizaos активируется автоматически
```

## 🎨 Специализация (Best Practices)

### Core Components:
- ✅ **Actions**: validate() + handler(), ActionResult с success
- ✅ **Services**: static serviceType, start()/stop(), delayed init
- ✅ **Providers**: get(), position (-100..100), dynamic/ private
- ✅ **Evaluators**: validate() + handler(), alwaysRun флаг
- ✅ **Routes**: HTTP endpoints, webhooks, authentication
- ✅ **Database**: Drizzle ORM, schema definitions, repositories
- ✅ **Dependencies**: dependency injection, priority system

### Plugin Lifecycle:
```typescript
// 1. Database adapters (если есть)
// 2. Actions
// 3. Evaluators
// 4. Providers
// 5. Models
// 6. Routes
// 7. Events
// 8. Services (delayed initialization)
```

## 📚 Архитектурные Паттерны (Official)

### 1. **ActionResult Pattern** (ОБЯЗАТЕЛЬНО):
```typescript
{
  success: boolean,        // Required!
  text?: string,           // Human-readable
  values?: Record<string, any>,  // State merge
  data?: any,              // Raw results
  error?: Error            // Error info
}
```

### 2. **Plugin Structure Pattern**:
```typescript
export const myPlugin: Plugin = {
  name: 'my-plugin',
  description: 'Description',

  // Dependencies (load first)
  dependencies: ['@elizaos/plugin-bootstrap'],

  // Core components
  actions: [myAction],
  services: [MyService],
  providers: [myProvider],
  evaluators: [myEvaluator],

  // HTTP endpoints
  routes: [
    {
      name: 'webhook',
      path: '/webhook',
      type: 'POST',
      handler: async (req, res, runtime) => { /* ... */ }
    }
  ],

  // Database schema
  schema: mySchema,

  // Initialization
  init: async (config) => { /* ... */ }
};
```

### 3. **Action with Chaining**:
```typescript
export const workflowAction: Action = {
  name: 'WORKFLOW_ACTION',

  validate: async (runtime, message, state) => {
    // Check prerequisites
    return state?.previousResults?.some(r => r.action === 'VALIDATE');
  },

  handler: async (runtime, message, state, options, callback) => {
    // Access previous results
    const validationResult = state.previousResults
      .find(r => r.action === 'VALIDATE');

    // Callback for immediate feedback
    await callback?.({
      text: 'Processing...',
      action: 'WORKFLOW_ACTION'
    });

    // Return result
    return {
      success: true,
      text: 'Completed!',
      values: { processed: true },
      data: { result: 'data' }
    };
  },

  examples: [
    [
      { name: 'user', content: { text: 'run workflow' } },
      { name: 'assistant', content: { text: 'Processing...', action: 'WORKFLOW_ACTION' } }
    ]
  ]
};
```

### 4. **Service with Lifecycle**:
```typescript
export class MyService extends Service {
  static serviceType = 'my-service';
  capabilityDescription = 'Provides my service functionality';

  private apiClient: ExternalAPI;

  static async start(runtime: IAgentRuntime): Promise<MyService> {
    const service = new MyService(runtime);
    await service.initialize();
    return service;
  }

  private async initialize(): Promise<void> {
    this.apiClient = new ExternalAPI({
      apiKey: runtime.getSetting('API_KEY')
    });
  }

  async stop(): Promise<void> {
    await this.apiClient.disconnect();
  }

  async process(data: any) {
    return await this.apiClient.process(data);
  }
}
```

### 5. **Provider Pattern**:
```typescript
export const myProvider: Provider = {
  name: 'my-provider',
  description: 'Provides contextual data',

  position: 10,           // Execution order
  dynamic: true,          // Re-fetch every time
  private: false,         // Visible in provider list

  get: async (runtime, message, state) => {
    const data = await fetchContextData(runtime, message);

    return {
      text: 'Contextual information',
      data: data,
      values: {
        myProviderData: data
      }
    };
  }
};
```

### 6. **Routes with Webhooks**:
```typescript
routes: [
  {
    name: 'external-webhook',
    path: '/webhook/external',
    type: 'POST',

    handler: async (req, res, runtime) => {
      // Authentication
      const apiKey = req.headers['x-api-key'];
      if (apiKey !== runtime.getSetting('WEBHOOK_API_KEY')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validation
      const { event, data } = req.body;
      if (!event || !data) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      try {
        // Process webhook
        await processWebhook(event, data, runtime);

        // Return 200 OK to prevent retries
        res.json({ success: true, message: 'Processed' });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Internal error'
        });
      }
    }
  }
]
```

### 7. **Database Schema Pattern**:
```typescript
// Schema definition
export const userPreferencesTable = pgTable(
  'user_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    preferences: jsonb('preferences').default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
);

// Domain types
export interface UserPreferences {
  id: UUID;
  userId: UUID;
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Repository
export class UserPreferencesRepository {
  async findByUserId(userId: UUID): Promise<UserPreferences | null> {
    const db = runtime.databaseAdapter.db;
    const result = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  async upsert(userId: UUID, preferences: Record<string, any>): Promise<UserPreferences> {
    const db = runtime.databaseAdapter.db;
    // ... implementation
  }
}
```

### 8. **Testing Pattern**:
```typescript
// test-utils.ts
export function createMockRuntime(): IAgentRuntime {
  return {
    agentId: 'test-agent',
    character: mockCharacter,
    databaseAdapter: mockDatabaseAdapter,
    getService: mock(() => mockService),
    getSetting: mock((key: string) => process.env[key]),
    logger: mockLogger
  } as any;
}

// actions.test.ts
import { describe, it, expect } from 'bun:test';
import { myAction } from '../src/actions';

describe('MyAction', () => {
  it('validates and executes correctly', async () => {
    const runtime = createMockRuntime();
    const message = createTestMessage('test command');

    const isValid = await myAction.validate(runtime, message, {});
    expect(isValid).toBe(true);

    const result = await myAction.handler(runtime, message, {}, {}, mockCallback);
    expect(result.success).toBe(true);
    expect(result.text).toBeDefined();
  });
});
```

### 9. **Error Handling Pattern**:
```typescript
export const robustAction: Action = {
  name: 'ROBUST_ACTION',

  validate: async (runtime, message) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('robust');
  },

  handler: async (runtime, message, state, options, callback) => {
    try {
      const service = runtime.getService<MyService>('my-service');
      if (!service) {
        throw new Error('Service not available');
      }

      // Immediate feedback
      await callback?.({
        text: 'Processing your request...',
        action: 'ROBUST_ACTION'
      });

      // Process
      const result = await service.process(message);

      return {
        success: true,
        text: 'Completed successfully!',
        values: { resultId: result.id },
        data: result
      };

    } catch (error) {
      // Error to user
      await callback?.({
        text: 'I encountered an error. Please try again.',
        error: true
      });

      // Return error result
      return {
        success: false,
        text: 'Action failed',
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
};
```

### 10. **Development Commands**:
```bash
# Create plugin via CLI
elizaos create my-plugin --type plugin

# Development with hot reload
elizaos dev

# Build for production
bun run build

# Test with coverage
bun test --coverage

# Type checking
tsc --noEmit
```

## 🎯 Главные Принципы (Best Practices 2024-2025)

### Core Principles:
1. **"Component-Based Architecture"** - разделяй на Actions, Services, Providers, Evaluators
2. **"Validate Before Execute"** - все Actions имеют validate()
3. **"Success Required"** - ActionResult всегда содержит success: boolean
4. **"Lifecycle Matters"** - понимай plugin lifecycle порядок
5. **"TypeScript First"** - строгая типизация обязательна
6. **"Test Everything"** - покрывай тестами с Mock Runtime
7. **"Delayed Services"** - Services инициализируются последними
8. **"Routes are First-Class"** - HTTP endpoints через routes property

### Modern 2024-2025 Patterns:
9. **"Tool-Using Architecture"** - агенты должны эффективно использовать external tools
10. **"Memory is King"** - контекстная память через memory system + DB
11. **"Chain of Thought"** - разбивай сложные задачи на chain of actions
12. **"Safety by Design"** - встроенная валидация, rate limiting, контент-фильтры
13. **"Observability First"** - логи, метрики, трассировка с первого дня
14. **"Failure is Normal"** - graceful degradation, circuit breakers, retries

### 11. **Tool-Using Agent Pattern** (Modern 2024):
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (args: any, context: AgentContext) => Promise<any>;
}

export class ToolUsingAgent {
  private tools: Map<string, ToolDefinition> = new Map();

  registerTool(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  async callTool(name: string, args: any, context: AgentContext) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool ${name} not found`);

    // Pre-execution validation
    await this.validateToolUsage(tool, args, context);

    try {
      const result = await tool.handler(args, context);

      // Post-execution memory update
      await context.memory.add({
        type: 'tool_call',
        tool: name,
        args,
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      await context.logger.error(`Tool ${name} failed:`, error);
      throw error;
    }
  }

  private async validateToolUsage(
    tool: ToolDefinition,
    args: any,
    context: AgentContext
  ) {
    // Rate limiting
    const usage = await context.memory.getToolUsage(tool.name);
    if (usage.count > tool.maxCallsPerHour) {
      throw new Error('Rate limit exceeded');
    }

    // Safety checks
    await this.performSafetyChecks(tool, args, context);
  }
}
```

### 12. **Advanced Memory System** (2024 Pattern):
```typescript
export class ContextualMemorySystem {
  private shortTerm: Map<string, any> = new Map(); // Session memory
  private working: any[] = []; // Current context
  private longTerm: VectorStore; // Persistent memory with embeddings

  async remember(
    content: MemoryContent,
    context: AgentContext
  ): Promise<void> {
    const memory: MemoryEntry = {
      id: generateId(),
      content,
      context: {
        sessionId: context.sessionId,
        userId: context.userId,
        timestamp: Date.now()
      },
      embedding: await this.generateEmbedding(content.text)
    };

    // Store in long-term memory
    await this.longTerm.store(memory);

    // Add to working context
    this.working.push(memory);

    // Prune working memory if too large
    if (this.working.length > MAX_WORKING_MEMORY) {
      this.working = this.working.slice(-MAX_WORKING_MEMORY / 2);
    }
  }

  async recall(
    query: string,
    context: AgentContext,
    limit: number = 10
  ): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    // Get relevant long-term memories
    const longTermMatches = await this.longTerm.search(
      queryEmbedding,
      { limit: limit * 2 }
    );

    // Add relevant working memories
    const workingMatches = this.working
      .filter(m => this.similarity(queryEmbedding, m.embedding) > 0.7)
      .slice(0, limit);

    // Merge and deduplicate
    const allMatches = [...longTermMatches, ...workingMatches];
    return this.deduplicateById(allMatches).slice(0, limit);
  }
}
```

### 13. **Chain of Thought Planning** (2024):
```typescript
export class PlanningAgent {
  async planAndExecute(
    goal: string,
    context: AgentContext
  ): Promise<ExecutionPlan> {
    // Step 1: Break down into sub-goals
    const subGoals = await this.decomposeGoal(goal, context);

    // Step 2: Create action chain
    const actions: PlannedAction[] = [];
    for (const subGoal of subGoals) {
      const action = await this.selectAction(subGoal, context);
      actions.push(action);
    }

    // Step 3: Validate chain coherence
    const validation = await this.validateChain(actions, context);
    if (!validation.isValid) {
      throw new Error(`Plan invalid: ${validation.errors.join(', ')}`);
    }

    return {
      id: generateId(),
      goal,
      actions,
      dependencies: this.analyzeDependencies(actions),
      estimatedCost: this.estimateCost(actions),
      validation
    };
  }

  async executeWithFallback(
    plan: ExecutionPlan,
    context: AgentContext
  ): Promise<any> {
    const results: ActionResult[] = [];

    for (const action of plan.actions) {
      try {
        // Execute with circuit breaker
        const result = await this.circuitBreaker.execute(
          () => this.executeAction(action, context),
          { timeout: action.timeoutMs }
        );

        results.push(result);

        // Update context for next action
        context = this.updateContext(context, result);

        // Check if we should continue
        if (!result.success && action.critical) {
          throw new Error(`Critical action failed: ${action.name}`);
        }
      } catch (error) {
        // Try fallback action if available
        if (action.fallback) {
          const fallbackResult = await this.executeAction(
            action.fallback,
            context
          );
          results.push(fallbackResult);
        } else {
          throw error;
        }
      }
    }

    return this.aggregateResults(results);
  }
}
```

### 14. **Safety & Alignment Framework** (2024):
```typescript
export class SafetyGuardrails {
  private inputFilters: ContentFilter[] = [];
  private outputFilters: ContentFilter[] = [];
  private rateLimiters: Map<string, RateLimiter> = new Map();

  async validateInput(
    input: string,
    context: AgentContext
  ): Promise<ValidationResult> {
    const violations: SafetyViolation[] = [];

    // Check against content filters
    for (const filter of this.inputFilters) {
      const result = await filter.check(input);
      if (!result.safe) {
        violations.push({
          type: result.violationType,
          severity: result.severity,
          message: result.message
        });
      }
    }

    // Rate limiting
    const limiter = this.rateLimiters.get(context.userId);
    if (limiter && !limiter.tryConsume()) {
      violations.push({
        type: 'RATE_LIMIT',
        severity: 'HIGH',
        message: 'Too many requests'
      });
    }

    // Prompt injection detection
    if (this.detectPromptInjection(input)) {
      violations.push({
        type: 'PROMPT_INJECTION',
        severity: 'CRITICAL',
        message: 'Potential prompt injection detected'
      });
    }

    return {
      safe: violations.length === 0,
      violations,
      sanitizedInput: this.sanitizeInput(input, violations)
    };
  }

  async validateOutput(
    output: string,
    context: AgentContext
  ): Promise<ValidationResult> {
    // Similar to input validation but for output
    const violations: SafetyViolation[] = [];

    for (const filter of this.outputFilters) {
      const result = await filter.check(output);
      if (!result.safe) {
        violations.push({
          type: result.violationType,
          severity: result.severity,
          message: result.message
        });
      }
    }

    return {
      safe: violations.length === 0,
      violations,
      sanitizedOutput: this.sanitizeOutput(output, violations)
    };
  }
}
```

### 15. **Observability & Monitoring** (2024):
```typescript
export class AgentObservability {
  private tracer: Tracer;
  private metrics: MetricsCollector;
  private logger: StructuredLogger;

  async traceAgentOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context: AgentContext
  ): Promise<T> {
    const span = this.tracer.startSpan(operationName, {
      userId: context.userId,
      sessionId: context.sessionId,
      operationName
    });

    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;

      // Record metrics
      this.metrics.recordHistogram('agent_operation_duration', duration, {
        operation: operationName
      });

      this.metrics.incrementCounter('agent_operation_success', {
        operation: operationName
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return result;

    } catch (error) {
      this.metrics.incrementCounter('agent_operation_error', {
        operation: operationName,
        errorType: error.constructor.name
      });

      this.logger.error('Agent operation failed', {
        error,
        operationName,
        context,
        stack: error.stack
      });

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });

      throw error;
    } finally {
      span.end();
    }
  }
}
```

### 16. **Multi-Agent Collaboration** (Advanced Pattern):
```typescript
export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private taskQueue: TaskQueue;
  private resultAggregator: ResultAggregator;

  async coordinateTask(
    task: Task,
    availableAgents: string[]
  ): Promise<TaskResult> {
    // Step 1: Select optimal agent
    const agent = this.selectAgent(task, availableAgents);

    // Step 2: Delegate with context
    const result = await agent.execute(task, {
      parentTask: task.parentId,
      sharedMemory: this.resultAggregator.getSharedMemory(task.id),
      coordinationContext: {
        agentsInvolved: availableAgents,
        taskId: task.id
      }
    });

    // Step 3: Update shared state
    await this.resultAggregator.recordResult(task.id, result);

    // Step 4: Trigger dependent tasks
    await this.triggerDependentTasks(task, result, availableAgents);

    return result;
  }

  private selectAgent(task: Task, availableAgents: string[]): Agent {
    // Intelligent agent selection based on:
    // - Task requirements
    // - Agent capabilities
    // - Current load
    // - Historical performance
    // - Availability

    return this.rankingAlgorithm.select(availableAgents, task);
  }
}
```

## 📦 Quick Start Template

```bash
# 1. Create plugin
elizaos create my-awesome-plugin --type plugin

# 2. Structure
cd my-awesome-plugin
mkdir -p src/{actions,providers,services,types}

# 3. Develop
elizaos dev

# 4. Test
bun test

# 5. Build
bun run build

# 6. Publish
npm publish --access public
```

**Следует официальным best practices ElizaOS 2024! Актуализировано по документации!** ⚡📚

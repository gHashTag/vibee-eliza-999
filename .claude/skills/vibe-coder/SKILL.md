---
name: vibe-coder
agent_id: vibe-coder
description: 💻 Auto-activates for TypeScript, React, ElizaOS plugins, API development, and implementation tasks (TDD + Functional Programming)
keywords:
  - typescript
  - react
  - api
  - implementation
  - код
  - разработка
  - компонент
  - функция
  - elizaos
  - plugin
  - actions
  - services
  - drizzle
  - tdd
  - тестирование
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 💻 Vibe Coder Skill - Full-Stack Implementation Expert

Этот скилл **автоматически активируется** при разработке и реализации, включая **ElizaOS плагины**, **TypeScript**, **React** и **API**.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `typescript`, `типы`, `TS`, `strict mode`
- `react`, `компонент`, `component`, `tsx`
- `api`, `endpoint`, `REST`, `routes`
- `implementation`, `реализация`
- `код`, `coding`, `разработка`
- `функция`, `function`, `functional`
- `class`, `класс`, `OOP`
- `interface`, `интерфейс`, `типизация`
- `elizaos`, `плагин`, `plugin`, `@elizaos/`
- `actions`, `services`, `providers`, `evaluators`
- `drizzle`, `orm`, `schema`, `база данных`
- `tdd`, `тестирование`, `testing`, `bun test`
- `mock`, `моки`, `test utils`

### Примеры:
```
"Создай ElizaOS плагин с Actions"
→ Авто-активируется vibe-coder

"Напиши Service с типизацией"
→ Авто-активируется vibe-coder

"Реализуй Drizzle schema"
→ Авто-активируется vibe-coder
```

## 🎯 Что Делает (Best Practices)

1. **ElizaOS Architecture**: Actions, Services, Providers, Evaluators
2. **TypeScript Strict**: Полная типизация без any
3. **Functional Programming**: TaskEither, Either, pipe
4. **TDD Approach**: RED → GREEN → REFACTOR
5. **Database Design**: Drizzle ORM + PostgreSQL
6. **API Routes**: HTTP endpoints + webhooks
7. **Error Handling**: Robust patterns с логированием
8. **Testing**: Mock Runtime + bun test

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для сложной логики
trigger_threshold: 0.75    # Активация при 75% уверенности
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при разработке
- **Координируется с**: vibe-elizaos, vibe-tester, vibe-spec
- **Результат**: Полный код + тесты + типизация + документация

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-coder",
  description="Create ElizaOS plugin with TDD",
  prompt="Plugin with actions, services, Drizzle schema, and tests"
)
```

### Автоматически:
```
"Создай Action с validate + handler"
→ vibe-coder активируется автоматически
```

## 🎨 Специализация (Best Practices)

### Core Technologies:
- ✅ **ElizaOS Plugins**: Full component architecture
- ✅ **TypeScript**: Strict mode, no any, full typing
- ✅ **React**: Functional components, hooks, TypeScript
- ✅ **Drizzle ORM**: PostgreSQL schemas + repositories
- ✅ **Functional Programming**: TaskEither, Either, pipe
- ✅ **TDD**: Test-first development с Mock Runtime
- ✅ **API Routes**: HTTP endpoints, webhooks, authentication
- ✅ **Error Handling**: Try-catch + logging + user feedback

### Development Patterns:
```typescript
// 1. TDD Pattern (RED → GREEN → REFACTOR)
describe('MyAction', () => {
  it('should validate and execute', async () => {
    // RED: Write failing test
    // GREEN: Make it pass
    // REFACTOR: Improve code
  });
});

// 2. Functional Error Handling
import { left, right } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

const result = await pipe(
  validateInput(data),
  (input) => processData(input),
  (processed) => saveToDB(processed),
  (saved) => right(saved),
  (final) => /* handle result */
);

// 3. Type-Safe Action
export const myAction: Action = {
  name: 'MY_ACTION',
  description: 'Does something useful',

  validate: async (runtime, message, state) => {
    // Type-safe validation
    return Boolean(message.content.text?.trim());
  },

  handler: async (runtime, message, state, options, callback) => {
    // Immediate feedback
    await callback?.({
      text: 'Processing...',
      action: 'MY_ACTION'
    });

    try {
      // Business logic
      const service = runtime.getService<MyService>('my-service');
      const result = await service.process(message);

      // Type-safe return
      return {
        success: true,
        text: 'Completed successfully!',
        values: { resultId: result.id },
        data: result
      };

    } catch (error) {
      // Error to user
      await callback?.({
        text: 'Error occurred. Please try again.',
        error: true
      });

      return {
        success: false,
        text: 'Action failed',
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
};
```

### Database Patterns:
```typescript
// Type-safe Drizzle Schema
export const userTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Domain Types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Repository with Types
export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const db = runtime.databaseAdapter.db;
    const result = await db.select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    return result[0] || null;
  }

  async create(userData: { email: string }): Promise<User> {
    const db = runtime.databaseAdapter.db;
    const [result] = await db.insert(userTable)
      .values(userData)
      .returning();

    return result;
  }
}
```

### Service Patterns:
```typescript
// Type-Safe Service
export class MyService extends Service {
  static serviceType = 'my-service';
  capabilityDescription = 'Provides my functionality';

  private apiClient: ExternalAPI;

  constructor(private runtime: IAgentRuntime) {
    super();
  }

  async initialize(): Promise<void> {
    const apiKey = this.runtime.getSetting('API_KEY');
    if (!apiKey) {
      throw new Error('API_KEY not configured');
    }

    this.apiClient = new ExternalAPI({ apiKey });
  }

  async process(data: DataType): Promise<ResultType> {
    this.ensureInitialized();

    try {
      const result = await this.apiClient.process(data);
      this.runtime.logger.info('Processed successfully', { dataType: data.type });
      return result;

    } catch (error) {
      this.runtime.logger.error('Processing failed', { error });
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.apiClient) {
      throw new Error('Service not initialized');
    }
  }

  async stop(): Promise<void> {
    await this.apiClient.disconnect();
  }
}
```

### Testing Patterns:
```typescript
// Mock Runtime Factory
function createTestRuntime(): IAgentRuntime {
  return {
    agentId: 'test-agent',
    getService: mockService(),
    getSetting: mock((key) => process.env[key]),
    databaseAdapter: {
      db: createMockDB()
    },
    logger: createMockLogger()
  } as unknown as IAgentRuntime;
}

// Test Suite
describe('MyAction Integration', () => {
  let runtime: IAgentRuntime;
  let mockCallback: MockCallback;

  beforeEach(() => {
    runtime = createTestRuntime();
    mockCallback = vi.fn();
  });

  it('should process valid input', async () => {
    // Arrange
    const message = createMessage('valid command');
    const action = myAction;

    // Act
    const result = await action.handler(runtime, message, {}, {}, mockCallback);

    // Assert
    expect(result.success).toBe(true);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Processing...'),
        action: 'MY_ACTION'
      })
    );
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const message = createMessage('error command');
    const action = errorAction;

    // Act
    const result = await action.handler(runtime, message, {}, {}, mockCallback);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Error'),
        error: true
      })
    );
  });
});
```

### React Patterns:
```typescript
// Type-Safe React Component
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Button: FC<ButtonProps> = ({
  variant,
  size = 'md',
  onClick,
  children,
  disabled = false
}) => {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

## 🚀 Development Workflow

### 1. **TDD Cycle**:
```bash
# RED: Write failing test
bun test --watch

# GREEN: Make it pass
bun run build

# REFACTOR: Improve code
# Run tests again
```

### 2. **Type Checking**:
```bash
# Strict TypeScript
tsc --noEmit --strict

# Check all files
npm run type-check
```

### 3. **Testing**:
```bash
# Run all tests
bun test

# With coverage
bun test --coverage

# Watch mode
bun test --watch
```

### 4. **Linting & Formatting**:
```bash
# Format code
prettier --write src/

# Lint
eslint src/
```

## 📊 Code Quality Metrics

- ✅ **Type Coverage**: 100% (no `any`)
- ✅ **Test Coverage**: >90%
- ✅ **Cyclomatic Complexity**: <10 per function
- ✅ **Function Length**: <50 lines
- ✅ **Error Handling**: All async operations
- ✅ **Logging**: All external API calls
- ✅ **Documentation**: JSDoc for public APIs

## 🎯 Coding Standards

### TypeScript Rules:
- ❌ `any` - use `unknown` or specific types
- ❌ `!` non-null assertion - use proper checks
- ❌ `as` type assertions - use type guards
- ✅ Strict mode enabled
- ✅ NoImplicitAny: true
- ✅ NoImplicitReturns: true

### Error Handling:
```typescript
// ❌ Bad
async function processData(data: any) {
  const result = await api.call(data);
  return result; // May throw
}

// ✅ Good
async function processData(data: DataType): Promise<ResultType> {
  try {
    const result = await api.call(data);
    logger.info('Processed', { dataId: data.id });
    return result;
  } catch (error) {
    logger.error('Processing failed', { data, error });
    throw new ProcessingError('Failed to process data', error);
  }
}
```

### Function Design:
```typescript
// ❌ Bad: Too many parameters
function createUser(name: string, email: string, age: number, city: string) { }

// ✅ Good: Single responsibility
interface CreateUserInput {
  name: string;
  email: string;
  age: number;
  city: string;
}

function createUser(input: CreateUserInput): User { }
```

### Modern TypeScript Patterns (2024-2025):
```typescript
// Template Literal Types for API responses
type ApiResponse<T> = T extends { data: infer D }
  ? { data: D; status: 'success' }
  : { error: string; status: 'error' };

// Constrained Generics with branded types
type UserId = string & { readonly brand: unique symbol };
function createUserId(id: string): UserId {
  if (!id || id.length < 3) throw new Error('Invalid ID');
  return id as UserId;
}

// Utility Types for API design
type CreateUserRequest = RequestBody<{
  name: string;
  email: string;
  role: 'admin' | 'user';
}>;

type UserResponse = ResponseBody<{
  id: UserId;
  name: string;
  email: string;
  createdAt: Date;
}>;

// Zod for runtime validation
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(18).max(120)
});

type UserInput = z.infer<typeof UserSchema>;
```

### AI-Assisted Development Patterns:
```typescript
// Code Generation with AI assistance
export class AICodeGenerator {
  async generateAction(
    description: string,
    context: CodeContext
  ): Promise<Action> {
    const prompt = this.buildPrompt(description, context);
    const aiResponse = await this.ai.complete(prompt);

    // Validate generated code
    return this.validateAndExtract<Action>(aiResponse, {
      schema: ActionSchema,
      validator: this.validateActionStructure
    });
  }

  private buildPrompt(description: string, context: CodeContext): string {
    return `
      Generate an ElizaOS Action for: ${description}

      Requirements:
      - TypeScript strict mode
      - Include validate() method
      - Include handler() method
      - Return ActionResult with success field
      - Add error handling
      - Context: ${JSON.stringify(context)}
    `;
  }
}

// Automated Code Review
export class AutomatedCodeReview {
  async review(code: string, rules: ReviewRule[]): Promise<ReviewResult> {
    const violations: CodeViolation[] = [];

    // Static analysis
    const ast = this.parseAST(code);
    for (const rule of rules) {
      const issues = await rule.check(ast);
      violations.push(...issues);
    }

    // AI-powered security review
    const securityIssues = await this.scanSecurity(code);

    return {
      score: this.calculateScore(violations),
      violations,
      suggestions: await this.generateSuggestions(code),
      approved: violations.filter(v => v.severity === 'ERROR').length === 0
    };
  }
}
```

### Security by Design (2024):
```typescript
// Input sanitization
export class SecurityGuard {
  sanitizeInput(input: string): SanitizedInput {
    return {
      text: DOMPurify.sanitize(input),
      metadata: this.extractSafeMetadata(input)
    };
  }

  // CSRF protection
  validateCSRFToken(token: string, session: Session): boolean {
    const expectedToken = session.csrfToken;
    return timingSafeEqual(token, expectedToken);
  }

  // SQL injection prevention
  createParameterizedQuery(
    template: string,
    params: Record<string, any>
  ): ParameterizedQuery {
    const escapedParams = this.escapeParams(params);
    return {
      query: this.replacePlaceholders(template),
      params: escapedParams
    };
  }
}

// Rate Limiting
export class RateLimiter {
  private store: RedisStore;

  async checkLimit(
    key: string,
    limit: number,
    window: number
  ): Promise<boolean> {
    const current = await this.store.increment(key);

    if (current === 1) {
      await this.store.expire(key, window);
    }

    return current <= limit;
  }
}
```

### Performance Optimization:
```typescript
// Memoization for expensive operations
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Lazy loading with dynamic imports
export class LazyLoader {
  private modules = new Map<string, Promise<any>>();

  async loadModule<T>(name: string, loader: () => Promise<T>): Promise<T> {
    if (!this.modules.has(name)) {
      this.modules.set(name, loader());
    }
    return this.modules.get(name)!;
  }
}

// Streaming for large data
export async function streamLargeDataset(
  query: Query,
  processor: (chunk: DataChunk) => Promise<void>
): Promise<void> {
  const stream = query.execute();

  for await (const chunk of stream) {
    await processor(chunk);
    // Allow event loop to process other tasks
    await new Promise(resolve => setImmediate(resolve));
  }
}
```

### Observability & Debugging:
```typescript
// Structured logging with context
export class Logger {
  info(message: string, context: LogContext): void {
    this.log('INFO', message, {
      ...context,
      timestamp: new Date().toISOString(),
      service: this.serviceName
    });
  }

  error(message: string, error: Error, context?: LogContext): void {
    this.log('ERROR', message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }
}

// Performance profiling
export class Profiler {
  private marks = new Map<string, number>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark)!;
    const end = endMark ? this.marks.get(endMark)! : performance.now();
    const duration = end - start;

    this.metrics.record(name, duration);
    return duration;
  }
}
```

### Error Resilience:
```typescript
// Circuit Breaker pattern
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Graceful degradation
export class ResilientService {
  async process(data: Data): Promise<Result> {
    try {
      // Try primary method
      return await this.primaryMethod(data);
    } catch (error) {
      // Fallback to cache
      const cached = await this.cache.get(data.id);
      if (cached) return cached;

      // Return default/placeholder
      return this.getDefaultResult(data);
    }
  }
}
```

### Modern React Patterns:
```typescript
// Custom hooks with proper typing
function useAsync<T, Args extends any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  return { data, loading, error, execute };
}

// Server Components for data fetching
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <Suspense fallback={<UserStatsSkeleton />}>
        <UserStats userId={userId} />
      </Suspense>
    </div>
  );
}
```

## 📦 Project Structure

```
project/
├── src/
│   ├── actions/          # ElizaOS Actions
│   ├── services/         # Service classes
│   ├── providers/        # Data providers
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   └── __tests__/        # Test files
├── drizzle/              # Database schema
│   ├── schema.ts
│   └── migrations/
├── public/               # Static assets
└── package.json
```

## 🎯 Modern Development Principles (2024-2025)

1. **"AI-First Development"** - используй AI для генерации и ревью кода
2. **"Security by Default"** - валидация, санитизация, rate limiting с первого дня
3. **"Performance Matters"** - memoization, lazy loading, streaming
4. **"Observability is Essential"** - логи, метрики, профилирование
5. **"Resilience is Key"** - circuit breakers, graceful degradation, retries
6. **"Type Safety is Non-Negotiable"** - strict TypeScript, runtime validation
7. **"Test Everything"** - unit, integration, e2e, property-based testing
8. **"Clean Architecture"** - separation of concerns, dependency inversion

**Следует современным best practices 2024-2025! Быстрая, безопасная и качественная разработка!** 💻✨

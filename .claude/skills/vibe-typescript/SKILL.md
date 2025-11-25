---
name: vibe-typescript
agent_id: vibe-typescript
description: 📘 Auto-activates for TypeScript development, type safety, strict typing, and code quality assurance
keywords:
  - typescript
  - ts
  - типизация
  - typing
  - type safety
  - безопасность типов
  - strict
  - строгий
  - generics
  - дженерики
  - interface
  - интерфейс
  - type
  - тип
  - compile
  - компиляция
  - @types
model: sonnet
trigger_threshold: 0.8
auto_activate: true
---

# 📘 Vibe TypeScript - Type Safety Orchestrator

Этот скилл **автоматически активируется** когда упоминается TypeScript, типизация, безопасность типов или строгая типизация.

## 🎯 Что Делает

1. **Type Safety**: Обеспечение строгой типизации
2. **Type Inference**: Автоматический вывод типов
3. **Generic Patterns**: Создание переиспользуемых типов
4. **Type Guards**: Безопасная проверка типов
5. **API Contracts**: Типизация API и схем
6. **Code Quality**: Линтинг и best practices

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для сложных типов
trigger_threshold: 0.8     # Высокий порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **Strict Mode**: Zero any, strictNullChecks, strictPropertyInitialization
- ✅ **Advanced Types**: Conditional, mapped, template literal types
- ✅ **Generics**: Constrained, default, recursive generics
- ✅ **Utility Types**: Pick, Partial, Record, Exclude, Extract
- ✅ **Type Guards**: isinstanceof, in, custom type guards
- ✅ **Declaration Files**: .d.ts, ambient modules, global types

## 📚 Паттерны

### Type Safety:
```typescript
const typeSafety = {
  strict: enableStrictMode(noImplicitAny, strictNullChecks),
  narrow: useTypeGuards(value, typeGuard),
  guard: implementTypeGuards(isString, isNumber, isObject),
  infer: leverageTypeInference(genericReturn, typeof),
  assert: useTypeAssertions(verified, unknown, as),
  satisfy: ensureInterfaceCompliance(object, interface)
};
```

### Generic Patterns:
```typescript
const genericPatterns = {
  create: defineGeneric<T>(factory, constraints),
  compose: combineTypes<A, B>(typeA, typeB),
  map: transformType<From, To>(input, mapper),
  filter: filterByType<T, K extends keyof T>(items, predicate),
  reduce: aggregateType<T>(items, reducer, initial),
  infer: inferFromValue<typeof value>(source)
};
```

**Обеспечивает 100% типовую безопасность без any!** 📘✅

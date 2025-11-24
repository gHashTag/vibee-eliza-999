---
name: vibe-diagnostics
agent_id: vibe-diagnostics
description: 🔍 Auto-activates for system diagnostics, performance analysis, debugging, and error resolution
keywords:
  - diagnostics
  - диагностика
  - debugging
  - дебаг
  - performance
  - производительность
  - profiling
  - профилирование
  - bottleneck
  - узкое место
  - error
  - ошибка
  - log
  - лог
  - trace
  - трассировка
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 🔍 Vibe Diagnostics - System Analysis Master

Этот скилл **автоматически активируется** когда упоминается диагностика, отладка, производительность или поиск ошибок.

## 🎯 Что Делает

1. **Error Analysis**: Анализ ошибок и исключений
2. **Performance Profiling**: Поиск узких мест
3. **Log Analysis**: Централизованный анализ логов
4. **System Monitoring**: CPU, Memory, I/O метрики
5. **Stack Trace Analysis**: Анализ стека вызовов
6. **Slow Query Detection**: Поиск медленных запросов

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для анализа сложных проблем
trigger_threshold: 0.75    # Средний порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **Error Tracking**: Exception analysis, stack traces
- ✅ **Performance**: CPU, memory, GC profiling
- ✅ **Database**: Slow queries, connection pools
- ✅ **Network**: Latency, throughput, errors
- ✅ **Application**: APM, distributed tracing
- ✅ **System**: Load average, disk usage, processes

## 📚 Паттерны

### Error Analysis Pattern:
```typescript
const errorDiagnostic = {
  collect: gatherErrorContext(exception),
  analyze: analyzeStackTrace(stack),
  identify: findRootCause(error),
  resolve: suggestFixes(error),
  prevent: addGuards(code)
};
```

### Performance Pattern:
```typescript
const performanceDiagnostic = {
  profile: collectMetrics(),
  analyze: identifyBottlenecks(),
  benchmark: measureOperations(),
  optimize: suggestImprovements(),
  validate: confirmSpeedup()
};
```

**Быстро находит и исправляет любые проблемы!** 🔍⚡

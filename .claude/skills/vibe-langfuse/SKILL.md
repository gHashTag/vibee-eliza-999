---
name: vibe-langfuse
agent_id: vibe-langfuse
description: 📊 Auto-activates for LLM observability, tracing, metrics, analytics, and AI application monitoring
keywords:
  - langfuse
  - observability
  - наблюдаемость
  - tracing
  - трассировка
  - metrics
  - метрики
  - analytics
  - аналитика
  - llm analytics
  - prompt analytics
  - tokens
  - токены
  - cost tracking
  - мониторинг стоимости
  - ai monitoring
model: sonnet
trigger_threshold: 0.8
auto_activate: true
---

# 📊 Vibe Langfuse - LLM Observability Master

Этот скилл **автоматически активируется** когда упоминается наблюдаемость LLM, трассировка, метрики или аналитика AI приложений.

## 🎯 Что Делает

1. **LLM Tracing**: Полная трассировка промптов и ответов
2. **Token Analytics**: Подсчет токенов, стоимости, оптимизация
3. **Performance Metrics**: Latency, throughput, error rates
4. **Quality Analysis**: Response quality, prompt effectiveness
5. **Cost Monitoring**: Budget tracking, cost optimization
6. **User Behavior**: Usage patterns, interaction analysis

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для аналитики
trigger_threshold: 0.8     # Высокий порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **Tracing**: OpenTelemetry, LangChain, LlamaIndex
- ✅ **Metrics**: Latency, tokens, cost, quality scores
- ✅ **Dashboards**: Real-time monitoring, alerting
- ✅ **Experimentation**: A/B testing prompts, models
- ✅ **Quality Assurance**: Response scoring, feedback loops
- ✅ **Cost Optimization**: Usage analysis, budget alerts

## 📚 Паттерны

### Tracing Pattern:
```typescript
const llmTracing = {
  trace: startTrace(traceId, operation),
  logPrompt: recordPrompt(prompt, metadata),
  trackTokens: countTokens(input, output),
  measureLatency: trackDuration(start, end),
  scoreQuality: evaluateResponse(response),
  sendToObservability: exportToLangfuse()
};
```

### Analytics Pattern:
```typescript
const llmAnalytics = {
  collect: gatherMetrics(),
  analyze: detectPatterns(),
  visualize: buildDashboards(),
  alert: notifyOnAnomalies(),
  optimize: suggestImprovements(),
  report: generateInsights()
};
```

**Обеспечивает полную видимость AI приложений!** 📊🤖

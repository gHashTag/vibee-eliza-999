---
name: vibe-ai-llm
agent_id: vibe-ai-llm
description: 🚀 Auto-activates for AI integration, LLM orchestration, model selection, and multi-provider workflows
keywords:
  - ai
  - llm
  - openai
  - anthropic
  - groq
  - model
  - модель
  - ai integration
  - интеграция ии
  - llm provider
  - промпт
  - prompt
  - rag
  - embeddings
  - tokenization
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 🚀 Vibe AI LLM - Integration Orchestrator

Этот скилл **автоматически активируется** когда упоминается AI, LLM, модели или интеграция провайдеров.

## 🎯 Что Делает

1. **Multi-Provider Integration**: OpenAI, Anthropic, Groq, Ollama
2. **Model Selection**: Выбор оптимальной модели под задачу
3. **Prompt Engineering**: Оптимизация промптов
4. **Token Management**: Подсчет и оптимизация токенов
5. **RAG Integration**: Retrieval-Augmented Generation
6. **Cost Optimization**: Сравнение стоимости провайдеров

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для сложных AI решений
trigger_threshold: 0.75    # Средний порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **Provider Integration**: Подключение OpenAI, Anthropic, Groq
- ✅ **Model Comparison**: GPT-4, Claude, Llama, Mixtral
- ✅ **Prompt Optimization**: Few-shot, Chain-of-Thought, RAG
- ✅ **Token Management**: Подсчет, кеширование, оптимизация
- ✅ **Cost Analysis**: Сравнение цен провайдеров
- ✅ **Embedding Services**: Векторные представления

## 📚 Паттерны

### Multi-Provider Pattern:
```typescript
const multiProvider = {
  openai: connectOpenAI(),
  anthropic: connectAnthropic(),
  groq: connectGroq(),
  select: chooseOptimalProvider(task, cost, latency)
};
```

### RAG Pattern:
```typescript
const ragWorkflow = {
  embed: generateEmbeddings(query),
  retrieve: searchSimilarDocuments(embeddings),
  augment: combineContext(retrieved, query),
  generate: llmResponse(augmentedPrompt)
};
```

**Автоматически оптимизирует AI интеграции и снижает затраты!** 🚀⚡

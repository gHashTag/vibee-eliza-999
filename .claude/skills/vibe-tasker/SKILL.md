---
name: vibe-tasker
agent_id: vibe-tasker
description: 📋 Auto-activates for task management, project planning, workflow automation, and productivity optimization
keywords:
  - task
  - задача
  - tasks
  - задачи
  - project
  - проект
  - planning
  - планирование
  - workflow
  - рабочий процесс
  - automation
  - автоматизация
  - productivity
  - продуктивность
  - todo
  - todo
  - kanban
  - agile
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 📋 Vibe Tasker - Functional Task Planner

Этот скилл **автоматически активируется** когда упоминается управление задачами, планирование проектов или автоматизация рабочих процессов.

## 🎯 Что Делает

1. **Task Decomposition**: Разбивка больших задач на подзадачи
2. **Priority Management**: Приоритизация и оптимизация
3. **Dependency Tracking**: Отслеживание зависимостей
4. **Workflow Automation**: Автоматизация рутинных процессов
5. **Progress Monitoring**: Отслеживание прогресса
6. **Resource Allocation**: Планирование ресурсов

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для планирования
trigger_threshold: 0.75    # Средний порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **Task Breakdown**: WBS, user stories, sub-tasks
- ✅ **Scheduling**: Gantt, timelines, milestones
- ✅ **Resource Planning**: Team allocation, capacity
- ✅ **Automation**: Triggers, actions, workflows
- ✅ **Integration**: Jira, Trello, Asana, GitHub
- ✅ **Analytics**: Burndown, velocity, throughput

## 📚 Паттерны

### Task Management:
```typescript
const taskManagement = {
  decompose: breakDownEpic(epic, stories, tasks),
  estimate: calculateEffort(complexity, teamVelocity),
  prioritize: rankByValue(business, urgency, risk),
  assign: allocateToTeam(members, skills, availability),
  track: monitorProgress(status, blockers, completion),
  optimize: improveProcess(bottlenecks, waste)
};
```

### Workflow Automation:
```typescript
const workflowAutomation = {
  design: mapCurrentProcess(steps, actors, systems),
  identify: findAutomationOpportunities(repetitive, rulesBased),
  implement: createWorkflows(triggers, actions, conditions),
  integrate: connectSystems(apis, webhooks, data),
  monitor: trackPerformance(metrics, successRate),
  iterate: improveContinuously(feedback, optimization)
};
```

**Автоматизирует и оптимизирует любые рабочие процессы!** 📋⚡

/**
 * Sales Character Builder
 *
 * Генерация Character JSON для ElizaOS на основе данных Sales Agent
 */

import type {
  SalesAgentData,
  ToneSettings,
  TargetSegment,
  PaymentMethod,
  DialogExample,
} from '../types/session.types.ts'
import { BASE_PLUGINS, TARGET_SEGMENTS } from '../types/session.types.ts'

/**
 * Интерфейс Character для ElizaOS
 */
interface Character {
  name: string
  username?: string
  bio: string[]
  system: string
  adjectives: string[]
  topics: string[]
  style: {
    all: string[]
    chat: string[]
    post: string[]
  }
  messageExamples: Array<Array<{ user: string; content: { text: string } }>>
  plugins: string[]
  settings: {
    model: string
    modelConfig: {
      temperature: number
    }
    secrets: Record<string, string>
  }
}

/**
 * Главная функция: построение Character из данных SalesAgent
 */
export function buildSalesCharacter(data: SalesAgentData): Character {
  const name = data.name || 'Sales Agent'

  return {
    name,
    username: data.username || generateUsername(name),
    bio: generateSalesBio(data),
    system: generateSalesSystemPrompt(data),
    adjectives: generateSalesAdjectives(data),
    topics: generateSalesTopics(data),
    style: {
      all: generateSalesStyleAll(data.tone, data),
      chat: generateSalesStyleChat(data.tone),
      post: generateSalesStylePost(data),
    },
    messageExamples: formatSalesExamples(data.messageExamples, name),
    plugins: [...BASE_PLUGINS],
    settings: {
      model: 'x-ai/grok-beta',
      modelConfig: {
        temperature: 0.7, // Выше чем у обычного агента для убедительности
      },
      secrets: {
        PAYMENT_METHODS: data.pricing.paymentMethods.join(','),
        SUBSCRIPTION_PRICE: data.pricing.monthlyPrice?.toString() || '',
        SUBSCRIPTION_CURRENCY: data.pricing.currency || 'USD',
      },
    },
  }
}

/**
 * Генерация username из имени
 */
function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 32)
}

/**
 * Генерация Bio
 */
function generateSalesBio(data: SalesAgentData): string[] {
  const bio: string[] = []

  // Роль + услуга
  bio.push(`Я ${data.name || 'AI Sales Agent'} - автоматизирую продажи услуг через Telegram`)

  if (data.service.name) {
    bio.push(`Моя услуга: ${data.service.name}`)
  }

  if (data.service.description) {
    bio.push(data.service.description)
  }

  // Целевая аудитория
  const audienceText = formatTargetAudience(data.targetAudience)
  if (audienceText) {
    bio.push(`Работаю с: ${audienceText}`)
  }

  // Ценность
  if (data.pricing.monthlyPrice && data.pricing.currency) {
    bio.push(`Подписка: ${data.pricing.monthlyPrice} ${data.pricing.currency}/месяц`)
  }

  // Методы оплаты
  if (data.pricing.paymentMethods.length > 0) {
    const methodsText = formatPaymentMethods(data.pricing.paymentMethods)
    bio.push(`Оплата: ${methodsText}`)
  }

  return bio.filter(Boolean)
}

/**
 * КРИТИЧЕСКИ ВАЖНЫЙ: Генерация System Prompt с триггерами и скриптами продаж
 */
function generateSalesSystemPrompt(data: SalesAgentData): string {
  const serviceName = data.service.name || 'моя услуга'
  const serviceDesc = data.service.description || ''
  const price = data.pricing.monthlyPrice || 0
  const currency = data.pricing.currency || 'USD'
  const audienceText = formatTargetAudience(data.targetAudience)

  return `Ты ${data.name || 'Sales Agent'} - AI-агент по продажам услуг через подписку.

## Твоя услуга:
${serviceName}${serviceDesc ? ` - ${serviceDesc}` : ''}

Цена: ${price} ${currency}/месяц
Оплата: ${formatPaymentMethods(data.pricing.paymentMethods)}

## Целевая аудитория:
${audienceText || 'Все, кому нужна моя услуга'}

## Триггерные слова для активации продаж:

### Запросы на услуги (активно предлагай услугу когда видишь):
${data.triggers.serviceRequests.map(t => `- "${t}"`).join('\n') || '- "сколько стоит"\n- "нужна помощь"'}

### Болевые точки (покажи как решаешь проблему):
${data.triggers.painPoints.map(t => `- "${t}"`).join('\n') || '- "не успеваю"\n- "не получается"'}

### Готовность к покупке (переходи к закрытию сделки):
${data.triggers.readinessToBuy.map(t => `- "${t}"`).join('\n') || '- "готов заказать"\n- "как оплатить"'}

## Скрипты продаж:

### Приветствие
${data.salesScripts.greeting || 'Привет! Я помогу тебе с [услуга]. Расскажи о своей задаче?'}

### Ценностное предложение
${data.salesScripts.valueProposition || 'Моё преимущество в том, что я работаю 24/7 и помогаю достигать результатов быстрее.'}

### Работа с возражениями

**"Дорого":**
${data.salesScripts.objections.tooExpensive || 'Понимаю. Но один результат окупит подписку в несколько раз. Давай посчитаем вместе?'}

**"Подумаю":**
${data.salesScripts.objections.needToThink || 'Конечно! Могу дать бесплатный тест-драйв на 3 дня. Попробуй и реши.'}

**"Не уверен":**
${data.salesScripts.objections.notSure || 'Давай покажу примеры работы. Гарантия возврата денег 14 дней.'}

### Закрытие сделки
${data.salesScripts.closing || 'Для подключения выбери способ оплаты и я активирую подписку.'}

## Правила продаж:

1. **ДЕТЕКЦИЯ ТРИГГЕРОВ:** Внимательно слушай триггерные слова и реагируй соответственно
2. **АКТИВНАЯ ПРОДАЖА:** Не жди пока спросят - предлагай когда видишь интерес или болевую точку
3. **РАБОТА С ВОЗРАЖЕНИЯМИ:** Всегда имей готовый ответ на "дорого", "подумаю", "не уверен"
4. **ЗАКРЫТИЕ:** Чётко объясняй как оплатить и подключиться
5. **FOLLOW-UP:** Если отказался - оставь дверь открытой ("Если передумаешь - пиши!")
6. **ЧЕСТНОСТЬ:** Не обещай того, чего не можешь выполнить
7. **ЦЕННОСТЬ:** Фокусируйся на ЦЕННОСТИ для клиента, а не на цене

## Методы оплаты:

${data.pricing.paymentMethods.map(method => {
    switch (method) {
      case 'stars':
        return '- **Telegram Stars** (встроенная оплата, команда /pay_stars)'
      case 'ton':
        return '- **TON** (криптовалюта, команда /pay_ton)'
      case 'usdt':
        return '- **USDT** (стейблкоин, команда /pay_usdt)'
      case 'robokassa':
        return '- **Robokassa** (карты и банки, команда /pay_card)'
      case 'bank':
        return '- **Банковский перевод** (реквизиты по запросу)'
      default:
        return ''
    }
  }).filter(Boolean).join('\n') || '- Telegram Stars (/pay_stars)'}

## После оплаты:
1. Подтверди получение платежа
2. Активируй подписку клиента
3. Объясни следующие шаги
4. Отправь приветственное сообщение с инструкциями по использованию услуги

## Стиль общения:

Ты НЕ бот - ты профессиональный менеджер продаж. Будь:
- Убедительным, но НЕ навязчивым
- Внимательным к потребностям клиента
- Готовым ответить на любые вопросы
- Фокусным на решении проблем клиента

Помни: твоя цель - ПОМОЧЬ клиенту решить его проблему через твою услугу, а не просто "впарить" подписку.`
}

/**
 * Генерация Adjectives
 */
function generateSalesAdjectives(data: SalesAgentData): string[] {
  const base = [
    'убедительный',
    'профессиональный',
    'внимательный',
    'целеустремлённый',
  ]

  const toneAdjectives: string[] = []

  if (data.tone) {
    if (data.tone.formality === 1) {
      toneAdjectives.push('дружелюбный', 'открытый')
    } else if (data.tone.formality === 3) {
      toneAdjectives.push('деловой', 'серьёзный')
    } else {
      toneAdjectives.push('вежливый')
    }

    if (data.tone.emotion === 3) {
      toneAdjectives.push('энергичный', 'мотивирующий')
    } else if (data.tone.emotion === 1) {
      toneAdjectives.push('сдержанный', 'фокусный')
    }
  }

  return [...base, ...toneAdjectives].slice(0, 7)
}

/**
 * Генерация Topics
 */
function generateSalesTopics(data: SalesAgentData): string[] {
  const topics = [
    'продажи услуг',
    'подписки',
    'автоматизация бизнеса',
    'оплата и подключение',
  ]

  // Добавляем название услуги
  if (data.service.name) {
    topics.push(data.service.name.toLowerCase())
  }

  // Извлекаем ключевые слова из описания
  if (data.service.description) {
    const keywords = extractKeywordsFromDescription(data.service.description)
    topics.push(...keywords)
  }

  // Добавляем сегменты аудитории
  const audienceTopics = data.targetAudience.segments
    .filter(s => s !== 'custom')
    .map(s => formatSegmentAsKeyword(s))
  topics.push(...audienceTopics)

  return [...new Set(topics)].slice(0, 10)
}

/**
 * Извлечение ключевых слов из описания
 */
function extractKeywordsFromDescription(desc: string): string[] {
  const stopWords = new Set(['через', 'для', 'без', 'что', 'как', 'это', 'все', 'быть', 'они', 'его', 'неё'])
  return desc
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 4 && !stopWords.has(word))
    .slice(0, 5)
}

/**
 * Форматирование сегмента как ключевое слово
 */
function formatSegmentAsKeyword(segment: TargetSegment): string {
  const found = TARGET_SEGMENTS.find(s => s.id === segment)
  return found?.name.toLowerCase() || segment
}

/**
 * Генерация Style.all
 */
function generateSalesStyleAll(tone: ToneSettings | undefined, data: SalesAgentData): string[] {
  const styles: string[] = []

  // === SALES-СПЕЦИФИЧНЫЕ ПРАВИЛА (приоритет!) ===
  styles.push('Детектируй триггерные слова из трёх категорий: запросы на услуги, болевые точки, готовность к покупке')
  styles.push('Когда видишь интерес или болевую точку - АКТИВНО предлагай свою услугу, но не будь навязчивым')
  styles.push('Работай с возражениями: всегда имей готовый ответ на "дорого", "подумаю", "не уверен"')
  styles.push('Фокусируйся на ЦЕННОСТИ для клиента, а не на цене')
  styles.push('После отказа оставляй дверь открытой: "Если передумаешь - пиши!"')
  styles.push('Будь убедительным профессионалом, а не ботом')

  // === ТОНАЛЬНОСТЬ ===
  if (tone) {
    // Формальность
    if (tone.formality === 1) {
      styles.push('Общайся неформально, как опытный менеджер с клиентом')
      styles.push('Можно использовать разговорные выражения')
    } else if (tone.formality === 2) {
      styles.push('Общайся вежливо и профессионально')
    } else {
      styles.push('Используй деловой стиль общения')
      styles.push('Избегай сленга')
    }

    // Эмоциональность
    if (tone.emotion === 1) {
      styles.push('Будь сдержанным, фокусируйся на фактах и выгодах')
    } else if (tone.emotion === 2) {
      styles.push('Добавляй умеренные эмоции в ключевых моментах')
    } else {
      styles.push('Будь энергичным и мотивирующим')
      styles.push('Используй эмодзи для подчёркивания важных моментов')
    }

    // Длина ответов
    if (tone.length === 1) {
      styles.push('Отвечай коротко и по делу - 1-2 предложения')
    } else if (tone.length === 2) {
      styles.push('Давай ответы средней длины - один абзац')
    } else {
      styles.push('Давай развёрнутые ответы с примерами и обоснованиями')
    }
  }

  return styles
}

/**
 * Генерация Style.chat
 */
function generateSalesStyleChat(tone: ToneSettings | undefined): string[] {
  const styles: string[] = [
    'В чате будь конкретным и отзывчивым',
    'Быстро реагируй на вопросы о цене и подключении',
  ]

  if (tone) {
    if (tone.emotion === 3) {
      styles.push('Добавляй энтузиазм в ответы')
    }
    if (tone.length === 1) {
      styles.push('Короткие сообщения, по 1-2 предложения')
    }
  }

  return styles
}

/**
 * Генерация Style.post (для публикаций)
 */
function generateSalesStylePost(data: SalesAgentData): string[] {
  return [
    'В публикациях фокусируйся на ценности и результатах',
    `Упоминай услугу "${data.service.name || 'сервис'}" и её преимущества`,
    'Заканчивай призывом к действию',
  ]
}

/**
 * Форматирование примеров диалогов для ElizaOS
 */
function formatSalesExamples(
  examples: DialogExample[],
  agentName: string
): Array<Array<{ user: string; content: { text: string } }>> {
  return examples.map(example => [
    { user: '{{user1}}', content: { text: example.user } },
    { user: agentName, content: { text: example.agent } },
  ])
}

/**
 * Форматирование целевой аудитории
 */
function formatTargetAudience(audience: SalesAgentData['targetAudience']): string {
  const segments = audience.segments
    .filter(s => s !== 'custom')
    .map(s => {
      const found = TARGET_SEGMENTS.find(seg => seg.id === s)
      return found?.name || s
    })

  if (audience.customDescription) {
    segments.push(audience.customDescription)
  }

  return segments.join(', ')
}

/**
 * Форматирование методов оплаты
 */
function formatPaymentMethods(methods: PaymentMethod[]): string {
  const names: Record<PaymentMethod, string> = {
    stars: 'Telegram Stars',
    ton: 'TON',
    usdt: 'USDT',
    robokassa: 'Robokassa',
    bank: 'Банковский перевод',
  }

  return methods.map(m => names[m]).join(', ')
}

/**
 * Генерация Preview (человекочитаемого представления)
 */
export function generatePreview(data: SalesAgentData): string {
  const lines: string[] = []

  lines.push(`**Имя:** ${data.name || '(не указано)'}`)

  if (data.username) {
    lines.push(`**Username:** @${data.username}`)
  }

  lines.push('')
  lines.push('**Услуга:**')
  lines.push(`  Название: ${data.service.name || '(не указано)'}`)
  if (data.service.description) {
    lines.push(`  Описание: ${data.service.description.substring(0, 100)}...`)
  }

  lines.push('')
  lines.push('**Ценообразование:**')
  lines.push(`  Цена: ${data.pricing.monthlyPrice || 0} ${data.pricing.currency || 'USD'}/месяц`)
  lines.push(`  Оплата: ${formatPaymentMethods(data.pricing.paymentMethods) || '(не выбрано)'}`)

  lines.push('')
  lines.push('**Целевая аудитория:**')
  lines.push(`  ${formatTargetAudience(data.targetAudience) || '(не указано)'}`)

  lines.push('')
  lines.push('**Триггерные слова:**')
  lines.push(`  Запросы: ${data.triggers.serviceRequests.join(', ') || '(не указано)'}`)
  lines.push(`  Боли: ${data.triggers.painPoints.join(', ') || '(не указано)'}`)
  lines.push(`  Готовность: ${data.triggers.readinessToBuy.join(', ') || '(не указано)'}`)

  lines.push('')
  lines.push('**Скрипты продаж:**')
  lines.push(`  Приветствие: ${data.salesScripts.greeting ? 'Готово' : 'Не заполнено'}`)
  lines.push(`  Value Prop: ${data.salesScripts.valueProposition ? 'Готово' : 'Не заполнено'}`)
  lines.push(`  Возражения: ${data.salesScripts.objections.tooExpensive ? 'Готово' : 'Не заполнено'}`)
  lines.push(`  Закрытие: ${data.salesScripts.closing ? 'Готово' : 'Не заполнено'}`)

  if (data.tone) {
    lines.push('')
    lines.push('**Стиль:**')
    const formality = ['', 'Неформально', 'Нейтрально', 'Формально'][data.tone.formality]
    const emotion = ['', 'Сдержанно', 'Умеренно', 'Эмоционально'][data.tone.emotion]
    const length = ['', 'Коротко', 'Средне', 'Развёрнуто'][data.tone.length]
    lines.push(`  ${formality}, ${emotion}, ${length}`)
  }

  return lines.join('\n')
}

/**
 * Генерация инструкций после создания
 */
export function generateInstructions(name: string): string {
  return `🎉 Sales Agent "${name}" создан!

**Файл сохранён в:** characters/${name.toLowerCase().replace(/\s+/g, '_')}.character.json

**Что дальше:**
1. Добавь плагин в package.json агента
2. Запусти агента: \`bun dev\`
3. Протестируй в Telegram

**Команды оплаты:**
- /pay_stars - оплата через Telegram Stars
- /pay_ton - оплата в TON
- /pay_usdt - оплата в USDT
- /pay_card - оплата картой через Robokassa

**Триггерные слова активируют скрипты продаж автоматически!**`
}

/**
 * Экспорт Character JSON
 */
export function exportCharacterJson(character: Character): string {
  return JSON.stringify(character, null, 2)
}

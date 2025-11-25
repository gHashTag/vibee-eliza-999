# ТЕХНИЧЕСКОЕ ЗАДАНИЕ
## Система управления падел-клубом "Padel World Club"

---

## 📋 СОДЕРЖАНИЕ

1. [Общие сведения](#1-общие-сведения)
2. [Назначение и цели системы](#2-назначение-и-цели-системы)
3. [Описание системы](#3-описание-системы)
4. [Функциональные требования](#4-функциональные-требования)
5. [Технические требования](#5-технические-требования)
6. [Архитектура системы](#6-архитектура-системы)
7. [Модули и компоненты](#7-модули-и-компоненты)
8. [Интеграции](#8-интеграции)
9. [База данных](#9-база-данных)
10. [Безопасность](#10-безопасность)
11. [Производительность и масштабируемость](#11-производительность-и-масштабируемость)
12. [Развертывание](#12-развертывание)
13. [Тестирование](#13-тестирование)

---

## 1. ОБЩИЕ СВЕДЕНИЯ

### 1.1 Наименование системы
**Padel World Club** - Интеллектуальная система управления падел-клубом с голосовым AI-интерфейсом

### 1.2 Назначение документа
Данный документ является техническим заданием на разработку аналогичной системы управления падел-клубом, описывающим функциональные и технические требования, архитектуру и компоненты системы.

### 1.3 Термины и определения
- **Padel** - вид спорта, комбинация тенниса и сквоша
- **Корт** - игровая площадка для падел
- **Слот** - временной интервал для бронирования корта
- **Daily Game** - система групповых игр, организуемых администратором
- **Telegram Bot** - автоматизированный интерфейс в мессенджере Telegram
- **Inngest** - система обработки фоновых задач и событий
- **Webhook** - механизм получения обновлений от внешних сервисов

### 1.4 Основные характеристики проекта
- **Тип системы**: Web-приложение + Telegram Bot
- **Целевая аудитория**: Владельцы падел-клубов, администраторы, игроки
- **Масштаб**: От малых клубов (2-4 корта) до крупных центров (10+ кортов)
- **Язык интерфейса**: Русский, Английский, Иврит (мультиязычность)

---

## 2. НАЗНАЧЕНИЕ И ЦЕЛИ СИСТЕМЫ

### 2.1 Основные цели
1. **Автоматизация бронирования** - упрощение процесса резервирования кортов
2. **Голосовой интерфейс** - инновационное бронирование через голосовые сообщения
3. **Управление платежами** - интегрированная система оплаты
4. **Аналитика и отчетность** - данные для принятия бизнес-решений
5. **Социальная составляющая** - Daily Game для формирования комьюнити

### 2.2 Бизнес-задачи
- Увеличение загрузки кортов
- Снижение административных издержек
- Улучшение клиентского опыта
- Автоматизация рутинных операций
- Формирование базы постоянных клиентов

### 2.3 Целевая аудитория

#### Администраторы клуба
- Управление расписанием
- Контроль платежей
- Аналитика загрузки
- Организация мероприятий

#### Игроки
- Быстрое бронирование
- Голосовой интерфейс
- Управление бронями
- Участие в Daily Game

---

## 3. ОПИСАНИЕ СИСТЕМЫ

### 3.1 Общее описание
Padel World Club - это современная система управления падел-клубом, построенная на микросервисной архитектуре с использованием event-driven подхода. Система предоставляет:

- **Telegram Bot** с AI-ассистентом для голосового бронирования
- **REST API** для веб-интеграций
- **Админ-панель** для управления клубом
- **Систему платежей** через Telegram Stars и традиционные методы
- **Event-driven архитектуру** на базе Inngest
- **Real-time аналитику** и мониторинг

### 3.2 Ключевые особенности

#### 🎤 Голосовой AI-интерфейс
- Распознавание речи через OpenAI Whisper
- Обработка намерений с помощью GPT-4
- Автоматическое создание бронирований
- Естественный диалог на нескольких языках

#### 📅 Умное бронирование
- Поиск свободных слотов по фильтрам
- Быстрое бронирование в один клик
- Календарный интерфейс (React Big Calendar)
- Telegram Mini App для визуального выбора

#### 🎮 Daily Game - Социальная механика
- Админы создают игровые планы
- Автоматическая рассылка приглашений
- Формирование групп игроков
- Упрощенная оплата и управление

#### 💳 Гибкие платежи
- Telegram Stars (внутренняя валюта)
- Наличные с подтверждением чеком
- Банковский перевод
- Админское подтверждение

---

## 4. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 4.1 Модуль аутентификации

#### FR-AUTH-001: Регистрация пользователей
- Автоматическая регистрация через Telegram Bot
- Сбор базовой информации (имя, username, язык)
- Выбор игрового уровня (новичок, средний, продвинутый, про)
- Создание уникального ID пользователя

#### FR-AUTH-002: Аутентификация
- Автоматическая аутентификация по Telegram ID
- Управление сессиями через Redis
- Поддержка разблокировки заблокированных пользователей

### 4.2 Модуль бронирования

#### FR-BOOK-001: Поиск доступных слотов
- Фильтрация по типу корта (падел/теннис)
- Фильтрация по длительности (60/90/120 минут)
- Фильтрация по дате (сегодня/завтра)
- Отображение цен для каждого слота
- Пагинация результатов

#### FR-BOOK-002: Создание бронирования
- Выбор корта, даты и времени
- Указание длительности
- Автоматический расчет стоимости
- Создание записи в базе данных
- Статус: "pending_payment"

#### FR-BOOK-003: Голосовое бронирование
- Загрузка голосового файла из Telegram
- Конвертация в текст (Whisper API)
- Извлечение намерения (GPT-4)
- Параметры: дата, время, тип корта, длительность
- Автоматическое создание бронирования

#### FR-BOOK-004: Управление бронированиями
- Просмотр активных броней
- Отмена бронирования
- История бронирований
- Уведомления об изменениях

#### FR-BOOK-005: Календарный интерфейс
- React Big Calendar для визуального выбора
- Telegram Mini App интеграция
- Отображение занятости кортов
- Быстрое бронирование из календаря

### 4.3 Модуль платежей

#### FR-PAY-001: Telegram Stars
- Создание инвойса в Telegram
- Обработка pre_checkout_query
- Подтверждение successful_payment
- Обновление статуса бронирования

#### FR-PAY-002: Оплата наличными
- Выбор оплаты наличными
- Запрос на загрузку чека
- Отправка чека админам
- Ожидание подтверждения

#### FR-PAY-003: Админское подтверждение
- Просмотр чеков от пользователей
- Кнопки "Подтвердить" / "Отклонить"
- Отправка уведомления пользователю
- Обновление статуса платежа

#### FR-PAY-004: Таймауты платежей
- Автоматическая отмена через 30 минут
- Уведомление о приближении таймаута
- Освобождение слота после отмены

### 4.4 Модуль Daily Game

#### FR-DAILY-001: Создание игровых планов (Админ)
- Визард для создания плана
- Выбор даты, времени, корта
- Выбор уровня игры
- Указание стоимости
- Сохранение плана

#### FR-DAILY-002: Рассылка приглашений
- Автоматическая рассылка по расписанию
- Фильтрация по уровню игры
- Inline-кнопки для выбора слота
- Предотвращение дублирования

#### FR-DAILY-003: Формирование групп
- Выбор слота игроком
- Автоматическое добавление в группу
- Проверка лимита участников (4 человека)
- Расчет стоимости на человека

#### FR-DAILY-004: Оплата Daily Game
- Аналогично обычной оплате
- Специальные callback_data для Daily Game
- Админское подтверждение чеков
- Изменение статуса группы

### 4.5 Модуль администрирования

#### FR-ADMIN-001: Управление кортами
- CRUD операции для кортов
- Настройка рабочих часов
- Ценовая политика
- Блокировка времени

#### FR-ADMIN-002: Управление ценами
- Динамическое ценообразование
- Ценовые политики по времени
- Скидки и акции
- Мультивалютность (THB, USD, Stars)

#### FR-ADMIN-003: Аналитика
- Dashboard с загрузкой кортов
- Отчеты по платежам
- Статистика по пользователям
- Просмотр активных бронирований

#### FR-ADMIN-004: Daily Game управление
- Просмотр созданных планов
- Статус групп
- Прогресс заполнения
- История рассылок

### 4.6 Модуль уведомлений

#### FR-NOTIF-001: Telegram уведомления
- Подтверждение бронирования
- Напоминание об оплате
- Подтверждение оплаты
- Отмена бронирования
- Daily Game приглашения

#### FR-NOTIF-002: Админские уведомления
- Новые бронирования
- Чеки на подтверждение
- Критические ошибки
- Отчеты по активности

### 4.7 Модуль интернационализации

#### FR-I18N-001: Мультиязычность
- Поддержка русского, английского, иврита
- Автоопределение языка по Telegram
- Возможность смены языка
- Локализация дат и времени

### 4.8 Модуль системных команд

#### FR-SYS-001: Команды пользователя
- `/start` - главное меню
- Быстрое бронирование
- Мои брони
- Помощь

#### FR-SYS-002: Админские команды
- `/admin_daily_game` - создание планов
- `/admin_daily_status` - статус групп
- `/debug_performance` - диагностика

---

## 5. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ

### 5.1 Технологический стек

#### Backend
- **Runtime**: Bun v1.0+ (быстрая альтернатива Node.js)
- **Framework**: Express.js v5.1.0
- **TypeScript**: v5.9.2 (строгая типизация)
- **Database**: PostgreSQL (через Neon serverless)
- **ORM**: Drizzle ORM v0.44.5
- **Cache**: Redis (для сессий и кэша)

#### AI & ML
- **OpenAI API**: v5.1.1
  - GPT-4 для обработки намерений
  - Whisper для распознавания речи
- **AI SDK**: Vercel AI SDK v5.0.23

#### Messaging
- **Telegram Bot**: Telegraf v4.16.3
- **Bot Framework**: Custom PadelBot class

#### Background Jobs
- **Inngest**: v3.40.1
  - Event-driven функции
  - Автоматическая retry логика
  - Отложенные задачи

#### Frontend (Админ панель)
- **React**: v18.2.0
- **React Big Calendar**: v1.8.2
- **Moment.js**: v2.29.4

#### DevOps & Infrastructure
- **Deployment**: Railway (production)
- **CI/CD**: GitHub Actions
- **Monitoring**: Custom health checks
- **Containerization**: Docker (опционально)

### 5.2 Требования к производительности

#### API Response Time
- GET запросы: < 200ms
- POST запросы: < 500ms
- Telegram webhook: < 3 секунды
- Voice processing: < 15 секунд

#### Throughput
- Обработка 100+ одновременных запросов
- 1000+ бронирований в день
- Поддержка 10,000+ пользователей

#### Availability
- Uptime: 99.5%
- Graceful degradation при недоступности внешних сервисов
- Automatic retry для критических операций

### 5.3 Требования к безопасности

#### Аутентификация
- Telegram ID как primary identifier
- JWT токены для API (опционально)
- Session management через Redis

#### Авторизация
- Role-based access (admin, user)
- Telegram ID verification
- Admin commands protection

#### Data Protection
- HTTPS для всех соединений
- Encrypted secrets в .env
- Валидация всех входных данных (Zod)
- SQL injection prevention (parametrized queries)

### 5.4 Требования к масштабируемости

#### Горизонтальное масштабирование
- Stateless API design
- Database connection pooling
- Redis для распределенного состояния

#### Вертикальное масштабирование
- Оптимизированные SQL запросы
- Индексы на критичных полях
- Lazy loading данных

---

## 6. АРХИТЕКТУРА СИСТЕМЫ

### 6.1 Общая архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Telegram   │  │   Web App    │  │  Admin Panel │ │
│  │     Bot      │  │  Mini App    │  │   Calendar   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   API GATEWAY                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │    Express.js + CORS + Rate Limiting             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                APPLICATION LAYER                        │
│ ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│ │  Telegram Bot │  │   REST API    │  │  Inngest    │ │
│ │   Handlers    │  │   Routes      │  │  Functions  │ │
│ └───────────────┘  └───────────────┘  └─────────────┘ │
│                                                         │
│ ┌──────────────────────────────────────────────────┐  │
│ │           BUSINESS LOGIC SERVICES                │  │
│ │  • Booking Service    • Payment Service          │  │
│ │  • Slot Service       • AI Voice Service         │  │
│ │  • Pricing Service    • Daily Game Service       │  │
│ └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER                             │
│ ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│ │  PostgreSQL   │  │     Redis     │  │    Drizzle  │ │
│ │    (Neon)     │  │   (Session)   │  │     ORM     │ │
│ └───────────────┘  └───────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL INTEGRATIONS                      │
│ ┌───────────┐  ┌───────────┐  ┌────────────────────┐  │
│ │  OpenAI   │  │ Telegram  │  │  Telegram Stars    │  │
│ │   API     │  │  Bot API  │  │     Payment        │  │
│ └───────────┘  └───────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Архитектурные паттерны

#### Event-Driven Architecture (Inngest)
- Асинхронная обработка задач
- Декомпозиция бизнес-логики на функции
- Автоматический retry и мониторинг
- Temporal scheduling

#### Repository Pattern
- Абстракция работы с БД
- Тестируемый код
- Легкая смена источника данных

#### Service Layer
- Инкапсуляция бизнес-логики
- Переиспользуемые компоненты
- Разделение ответственности

#### Middleware Pattern (Express)
- Authentication
- Validation
- Error handling
- Logging

### 6.3 Ключевые потоки данных

#### 1. Голосовое бронирование
```
User → Voice Message → Telegram Bot → Webhook →
→ Inngest Function (voice/processing.requested) →
→ Voice AI Service (Whisper + GPT-4) →
→ Slot Service → Booking Created →
→ Response to User
```

#### 2. Быстрое бронирование
```
User → Inline Button → Telegram Bot → Webhook →
→ Inngest Function (booking/instant.requested) →
→ Slot Service → Booking Created →
→ Payment Buttons → User
```

#### 3. Daily Game Flow
```
Admin → Creates Plan → Saved to DB →
→ Inngest Function (send-daily-game-invites) →
→ Fetches Users by Level →
→ Sends Invites via Telegram →
→ User Selects Slot →
→ Daily Game Group Created →
→ Payment → Confirmation
```

#### 4. Payment Flow (Telegram Stars)
```
User → Pay Button → Telegram Stars Invoice →
→ pre_checkout_query → Validation →
→ successful_payment → Webhook →
→ Inngest Function (payment/stars.completed) →
→ Update Booking Status → Confirmation
```

---

## 7. МОДУЛИ И КОМПОНЕНТЫ

### 7.1 Telegram Bot Module

#### PadelBot Class (`src/bot/bot.ts`)
Основной класс бота с инициализацией handlers и middleware.

**Ключевые компоненты:**
- **StartHandler** - обработка `/start` и поиск слотов
- **BookingHandler** - создание и управление бронированиями
- **PaymentHandler** - обработка платежей
- **DailyGameHandler** - Daily Game механика
- **I18nService** - мультиязычность

**Actions (callback_data):**
- `ib:*` - instant booking
- `duration_*` - выбор длительности
- `pay_booking_baht:*` - оплата наличными
- `pay_booking_stars:*` - оплата Stars
- `daily_game_select:*` - выбор Daily Game слота
- `more_slots_*` - пагинация слотов

#### Button Service (`src/bot/services/button-service.ts`)
Генерация Telegram inline keyboards.

**Методы:**
- `createMainMenuButtons()` - главное меню
- `createBookingButtons()` - кнопки бронирования
- `createPaymentButtons()` - варианты оплаты
- `createDailyGameButtons()` - Daily Game кнопки

#### Message Service (`src/bot/services/message-service.ts`)
Форматирование сообщений для Telegram с i18n.

#### Pricing Display Service (`src/bot/services/pricing-display-service.ts`)
Отображение цен в разных валютах.

### 7.2 Inngest Functions Module

#### Структура (`src/inngest/functions/`)
- `book-court-direct.ts` - создание бронирования
- `cancel-booking.ts` - отмена бронирования
- `find-user.ts` - поиск пользователя
- `get-user-bookings.ts` - получение броней пользователя
- `process-voice-message.ts` - обработка голоса
- `send-daily-game-invites.ts` - Daily Game рассылка
- `payment-events.ts` - обработка платежей
- `payment-completed.ts` - завершение платежа
- `payment-timeout-handler.ts` - таймауты

#### Inngest Client (`src/utils/inngest.ts`)
```typescript
export const inngest = new Inngest({
  id: 'padel-world-club',
  eventKey: process.env.INNGEST_EVENT_KEY
});
```

#### InngestResponseManager (`src/services/inngest-response-manager.ts`)
Утилита для sendAndWait паттерна.

**Пример использования:**
```typescript
const result = await InngestResponseManager.sendAndWait(
  'booking/instant.requested',
  { userId, bookingData, sessionId },
  { timeout: 15000 }
);
```

### 7.3 Services Module

#### Voice AI Service (`src/services/voice-ai.service.ts`)
Обработка голосовых сообщений.

**Процесс:**
1. Download audio file от Telegram
2. Convert to text (Whisper API)
3. Extract intent (GPT-4)
4. Parse booking params (date, time, court, duration)
5. Create booking или return suggestions

#### Slot Service (`src/services/slot-service.ts`)
Поиск доступных слотов.

**Методы:**
- `getAvailableSlots(filters)` - поиск с фильтрами
- `isSlotAvailable(courtId, date, time)` - проверка доступности
- `calculatePrice(courtType, duration, time)` - расчет цены

#### Pricing Service (`src/services/pricing-service.ts`)
Динамическое ценообразование.

**Ценовые политики:**
- Peak hours (высокая цена)
- Off-peak hours (низкая цена)
- Weekend pricing
- Special events

#### Telegram Stars Service (`src/services/telegramStars.service.ts`)
Работа с платежами Telegram Stars.

**API Methods:**
- `createInvoice()` - создание инвойса
- `refundPayment()` - возврат платежа
- `getTransactionHistory()` - история

### 7.4 Database Module

#### Schema Definition (`src/db/schema/`)
Drizzle ORM схемы для всех таблиц:

- `user.ts` - пользователи
- `venue.ts` - клубы
- `court.ts` - корты
- `booking.ts` - бронирования
- `payment.ts` - платежи
- `dailyGameSelection.ts` - Daily Game
- `classDefinition.ts` - классы/уроки
- `tournament.ts` - турниры

#### Repository Pattern
Абстракция для работы с БД через репозитории.

### 7.5 API Module

#### Routes (`src/api/routes/`)
- `/api/calendar` - календарный API
- `/health` - health checks
- `/api/bookings` - REST API для бронирований (будущее)

#### Inngest Endpoint (`/api/inngest`)
Endpoint для Inngest dashboard и webhook.

### 7.6 Admin Module

#### React Calendar App (`src/calendar-app/`)
Admin-панель для визуального управления бронированиями.

**Features:**
- React Big Calendar integration
- Drag-and-drop бронирование
- Real-time updates
- Daily Game planning wizard

#### Telegram Mini App (`public/tma/`)
Web App для встраивания в Telegram.

---

## 8. ИНТЕГРАЦИИ

### 8.1 Telegram Bot API

#### Webhook Setup
```
POST /webhook/telegram
{
  "update_id": 123456,
  "message": { ... },
  "callback_query": { ... }
}
```

**Supported Update Types:**
- `message` - текстовые и голосовые
- `callback_query` - inline кнопки
- `pre_checkout_query` - подтверждение платежа
- `successful_payment` - успешный платеж
- `web_app_data` - данные от Mini App

#### Telegram Mini App
Web App для календарного интерфейса.

**URL Pattern:**
```
https://t.me/YourBot/calendar?startapp=booking
```

### 8.2 OpenAI API

#### Whisper API (Voice-to-Text)
```typescript
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'ru'
});
```

#### GPT-4 (Intent Extraction)
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: BOOKING_SYSTEM_PROMPT },
    { role: 'user', content: transcribedText }
  ]
});
```

### 8.3 Inngest Platform

#### Event Publishing
```typescript
await inngest.send({
  name: 'booking/instant.requested',
  data: { userId, bookingData, sessionId }
});
```

#### Function Definition
```typescript
inngest.createFunction(
  { id: 'book-court-direct' },
  { event: 'booking/instant.requested' },
  async ({ event, step }) => {
    // Business logic here
  }
);
```

### 8.4 PostgreSQL (Neon)

#### Connection String
```
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

#### Drizzle ORM
```typescript
import { db } from './db';
import { bookings } from './db/schema';

const newBooking = await db.insert(bookings).values({
  userId,
  courtId,
  startTime,
  duration,
  status: 'pending_payment'
});
```

### 8.5 Redis (Session Store)

#### Session Management
```typescript
this.bot.use(session({
  defaultSession: () => ({
    messageHistory: [],
    starPayment: { awaitingPayment: false }
  })
}));
```

---

## 9. БАЗА ДАННЫХ

### 9.1 Схема базы данных

#### Таблица `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  language_code VARCHAR(10) DEFAULT 'ru',
  subscription_level VARCHAR(50) DEFAULT 'free',
  current_rating REAL DEFAULT 1000.0,
  game_level VARCHAR(50),
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Таблица `venues`
```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  opening_hours JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Таблица `courts`
```sql
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  court_type VARCHAR(50) NOT NULL, -- 'paddle' | 'tennis'
  court_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Таблица `court_pricing_policies`
```sql
CREATE TABLE court_pricing_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  time_from TIME NOT NULL,
  time_to TIME NOT NULL,
  price_per_hour NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'THB',
  allowed_durations TEXT[], -- ['60', '90', '120']
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Таблица `bookings`
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  court_id UUID REFERENCES courts(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_payment',
  total_price NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'THB',
  booking_type VARCHAR(50) DEFAULT 'regular', -- 'regular' | 'daily_game'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookings_court_time ON bookings(court_id, start_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

#### Таблица `payments`
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'telegram_stars' | 'cash' | 'bank_transfer'
  payment_status VARCHAR(50) DEFAULT 'pending',
  telegram_payment_charge_id VARCHAR(255),
  telegram_invoice_payload TEXT,
  receipt_url TEXT,
  admin_confirmed_by UUID REFERENCES users(id),
  admin_confirmation_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Таблица `daily_game_selections`
```sql
CREATE TABLE daily_game_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  game_date DATE NOT NULL,
  selected_time TIME NOT NULL,
  court_type VARCHAR(50) NOT NULL,
  player_level VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'invited', -- 'invited' | 'selected' | 'confirmed' | 'cancelled'
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Таблица `daily_game_groups`
```sql
CREATE TABLE daily_game_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_date DATE NOT NULL,
  selected_time TIME NOT NULL,
  court_type VARCHAR(50) NOT NULL,
  player_level VARCHAR(50) NOT NULL,
  player_ids UUID[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'forming', -- 'forming' | 'ready' | 'paid' | 'completed'
  total_amount NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'THB',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Таблица `daily_game_admin_schedule`
```sql
CREATE TABLE daily_game_admin_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  game_date DATE NOT NULL,
  selected_time TIME NOT NULL,
  court_id UUID REFERENCES courts(id),
  court_type VARCHAR(50) NOT NULL,
  player_level VARCHAR(50) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price_per_person NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'THB',
  status VARCHAR(50) DEFAULT 'planned', -- 'planned' | 'sent' | 'cancelled'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 9.2 Индексы для оптимизации

```sql
-- Bookings
CREATE INDEX idx_bookings_court_time ON bookings(court_id, start_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Daily Game
CREATE INDEX idx_daily_game_date_time ON daily_game_selections(game_date, selected_time);
CREATE INDEX idx_daily_game_user ON daily_game_selections(user_id);
CREATE INDEX idx_daily_game_groups_date ON daily_game_groups(game_date, selected_time);

-- Users
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_game_level ON users(game_level);

-- Payments
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
```

### 9.3 Миграции

#### Drizzle Kit
```bash
# Генерация миграций
bun run db:generate

# Применение миграций
bun run db:migrate

# Просмотр БД через UI
bun run db:studio
```

---

## 10. БЕЗОПАСНОСТЬ

### 10.1 Аутентификация

#### Telegram ID Verification
```typescript
// Автоматическая проверка через Telegram
const user = ctx.from;
if (!user || !user.id) {
  throw new Error('Unauthorized');
}
```

#### Admin Protection
```typescript
const ADMIN_IDS = [123456789, 987654321];

function isAdmin(telegramId: number): boolean {
  return ADMIN_IDS.includes(telegramId);
}
```

### 10.2 Валидация входных данных

#### Zod Schemas
```typescript
import { z } from 'zod';

const BookingSchema = z.object({
  courtId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().int().min(60).max(120)
});
```

### 10.3 SQL Injection Prevention

#### Parameterized Queries (Drizzle ORM)
```typescript
// ✅ БЕЗОПАСНО
const bookings = await db
  .select()
  .from(bookingsTable)
  .where(eq(bookingsTable.userId, userId));

// ❌ ОПАСНО (никогда не используйте)
// const bookings = await db.execute(`
//   SELECT * FROM bookings WHERE user_id = '${userId}'
// `);
```

### 10.4 Secrets Management

#### Environment Variables
```env
# КРИТИЧНО: НЕ КОМИТИТИТЬ В GIT!
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

#### .gitignore
```
.env
.env.local
.env.production
secrets/
```

### 10.5 Rate Limiting

#### Telegram Webhooks
- Max 30 requests/second per bot
- Graceful handling 429 Too Many Requests

#### API Endpoints
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 11. ПРОИЗВОДИТЕЛЬНОСТЬ И МАСШТАБИРУЕМОСТЬ

### 11.1 Оптимизация запросов

#### Database Indexes
- Индексы на `court_id`, `start_time` для быстрого поиска слотов
- Composite индексы для частых JOIN операций

#### Query Optimization
```typescript
// ❌ N+1 запросов
for (const booking of bookings) {
  const court = await db.select().from(courts).where(eq(courts.id, booking.courtId));
}

// ✅ Один запрос с JOIN
const bookingsWithCourts = await db
  .select()
  .from(bookings)
  .leftJoin(courts, eq(bookings.courtId, courts.id));
```

### 11.2 Кэширование

#### Redis Cache
```typescript
// Кэш доступных слотов на 5 минут
const CACHE_KEY = `slots:${courtType}:${date}`;
const cached = await redis.get(CACHE_KEY);

if (cached) return JSON.parse(cached);

const slots = await fetchAvailableSlots();
await redis.setex(CACHE_KEY, 300, JSON.stringify(slots));
```

### 11.3 Асинхронная обработка

#### Inngest для фоновых задач
- Voice processing (15+ секунд) - в фоне
- Daily Game рассылка - отложенная задача
- Payment timeouts - scheduled task

### 11.4 Горизонтальное масштабирование

#### Stateless Design
- Нет хранения состояния в памяти
- Session в Redis
- Можно запустить multiple instances

#### Load Balancing (Railway)
- Automatic load balancing
- Health checks

---

## 12. РАЗВЕРТЫВАНИЕ

### 12.1 Production Environment (Railway)

#### Требования
- Railway account
- PostgreSQL database (Neon)
- Redis instance
- Environment variables

#### Deployment Steps
```bash
# 1. Setup Railway CLI
npm install -g railway

# 2. Login
railway login

# 3. Link project
railway link

# 4. Set environment variables
railway variables set BOT_TOKEN=...
railway variables set DATABASE_URL=...

# 5. Deploy
railway up

# 6. Setup webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://your-app.railway.app/webhook/telegram"
```

#### Railway Configuration (`railway.toml`)
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "bun run start"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### 12.2 Development Environment

#### Local Setup
```bash
# 1. Clone repository
git clone https://github.com/yourusername/padel-world-club.git
cd padel-world-club

# 2. Install dependencies
bun install

# 3. Setup .env file
cp example.env .env
# Edit .env with your credentials

# 4. Run database migrations
bun run db:migrate

# 5. Start development server
bun run dev

# 6. (Optional) Start Inngest dev server
bun run inngest
```

### 12.3 Docker Setup (Optional)

#### Dockerfile
```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["bun", "run", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - BOT_TOKEN=${BOT_TOKEN}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: padel_club
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

---

## 13. ТЕСТИРОВАНИЕ

### 13.1 Unit Tests

#### Framework: Vitest
```typescript
import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../services/pricing-service';

describe('PricingService', () => {
  it('should calculate correct price for peak hours', () => {
    const price = calculatePrice('paddle', 60, '18:00');
    expect(price).toBe(800);
  });

  it('should apply discount for off-peak hours', () => {
    const price = calculatePrice('paddle', 60, '10:00');
    expect(price).toBe(600);
  });
});
```

#### Running Tests
```bash
# Run all tests
bun test

# Watch mode
bun test:watch

# Coverage report
bun test:coverage
```

### 13.2 Integration Tests

#### Database Tests
```typescript
import { db } from '../db';
import { bookings } from '../db/schema';

describe('Booking Repository', () => {
  it('should create booking successfully', async () => {
    const booking = await db.insert(bookings).values({
      userId: 'test-user-id',
      courtId: 'test-court-id',
      startTime: new Date(),
      duration: 60
    });

    expect(booking).toBeDefined();
  });
});
```

#### Telegram Bot Tests
```typescript
import { PadelBot } from '../bot/bot';

describe('Telegram Bot', () => {
  it('should handle /start command', async () => {
    const bot = new PadelBot(process.env.BOT_TOKEN);

    // Mock context
    const ctx = createMockContext({ command: 'start' });

    await bot.handleStart(ctx);

    expect(ctx.reply).toHaveBeenCalled();
  });
});
```

### 13.3 E2E Tests

#### Full Booking Flow
```typescript
describe('Booking E2E Flow', () => {
  it('should complete booking from search to payment', async () => {
    // 1. Search slots
    const slots = await searchAvailableSlots({ courtType: 'paddle' });
    expect(slots.length).toBeGreaterThan(0);

    // 2. Create booking
    const booking = await createBooking(slots[0]);
    expect(booking.status).toBe('pending_payment');

    // 3. Process payment
    const payment = await processPayment(booking.id);
    expect(payment.status).toBe('completed');

    // 4. Verify booking status
    const updatedBooking = await getBooking(booking.id);
    expect(updatedBooking.status).toBe('confirmed');
  });
});
```

### 13.4 Performance Tests

#### Autocannon (Load Testing)
```bash
# Install autocannon
bun add -d autocannon

# Run load test
bunx autocannon -c 100 -d 30 http://localhost:3000/health
```

### 13.5 Test Coverage Requirements

- **Unit Tests**: 85%+ coverage
- **Integration Tests**: Critical paths
- **E2E Tests**: Main user flows
- **Performance Tests**: Before production deploy

---

## 14. МОНИТОРИНГ И ЛОГИРОВАНИЕ

### 14.1 Logging

#### Custom Logger (`src/utils/logger.ts`)
```typescript
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta);
  }
};
```

#### Log Levels
- **INFO**: Обычные события
- **WARN**: Предупреждения (не критичные)
- **ERROR**: Ошибки (требуют внимания)
- **DEBUG**: Отладочная информация (только dev)

### 14.2 Health Checks

#### Endpoints
```typescript
// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  const dbStatus = await checkDatabase();
  const redisStatus = await checkRedis();

  res.json({
    status: 'ok',
    database: dbStatus,
    redis: redisStatus,
    uptime: process.uptime()
  });
});
```

### 14.3 Error Tracking

#### Sentry Integration (опционально)
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### 14.4 Metrics

#### Custom Metrics
- Booking creation rate
- Payment success rate
- Voice processing time
- Webhook response time
- Daily active users

---

## 15. ДОКУМЕНТАЦИЯ

### 15.1 API Documentation

#### OpenAPI/Swagger
```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Padel World Club API',
      version: '1.0.0',
      description: 'API for padel club management'
    }
  },
  apis: ['./src/api/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### 15.2 Code Documentation

#### JSDoc Comments
```typescript
/**
 * Создает новое бронирование корта
 * @param userId - ID пользователя
 * @param courtId - ID корта
 * @param startTime - Время начала
 * @param duration - Длительность в минутах
 * @returns Promise<Booking>
 */
async function createBooking(
  userId: string,
  courtId: string,
  startTime: Date,
  duration: number
): Promise<Booking> {
  // Implementation
}
```

---

## ЗАКЛЮЧЕНИЕ

Данное техническое задание описывает полнофункциональную систему управления падел-клубом с акцентом на:

1. **Инновационный UX** - голосовой интерфейс через AI
2. **Автоматизация** - минимум ручной работы для администраторов
3. **Масштабируемость** - от малых клубов до крупных центров
4. **Надежность** - event-driven архитектура с автоматическим retry
5. **Современный стек** - Bun, TypeScript, Drizzle, Inngest

Система готова к развертыванию и может быть адаптирована под специфические требования различных падел-клубов.

---

**Дата создания**: 2025-11-21
**Версия документа**: 1.0
**Автор**: Claude AI Assistant

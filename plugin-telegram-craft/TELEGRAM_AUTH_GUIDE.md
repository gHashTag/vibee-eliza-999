# ТЕХНИЧЕСКОЕ РУКОВОДСТВО
# Telegram аутентификация и хранение пользовательских секретов

**Версия:** 1.0
**Дата:** 2025-11-25
**Проект:** VIBEE Agent Platform

---

## 📋 ОГЛАВЛЕНИЕ

1. [Введение и цели](#1-введение-и-цели)
2. [Архитектура системы](#2-архитектура-системы)
3. [Telegram аутентификация](#3-telegram-аутентификация)
4. [Infisical для пользовательских данных](#4-infisical-для-пользовательских-данных)
5. [База данных и модели](#5-база-данных-и-модели)
6. [Система ограничения доступа](#6-система-ограничения-доступа)
7. [Интеграция с VIBEE](#7-интеграция-с-vibee)
8. [Пошаговая инструкция внедрения](#8-пошаговая-инструкция-внедрения)
9. [Безопасность и лучшие практики](#9-безопасность-и-лучшие-практики)
10. [Заключение](#10-заключение)

---

## 1. ВВЕДЕНИЕ И ЦЕЛИ

### 1.1 Задача

Необходимо реализовать систему **персонализированного хранения секретов** с аутентификацией через Telegram:

- ✅ Пользователь авторизуется через Telegram Login Widget
- ✅ Секреты привязаны к Telegram ID пользователя
- ✅ Доступ к сайту только после авторизации
- ✅ Персональное пространство для API ключей каждого пользователя
- ✅ Безопасное хранение через Infisical

### 1.2 Целевые пользователи

**Пример тестового пользователя:**
- **Telegram ID:** `144022504`
- **Имя:** Доступно после авторизации
- **Персональные секреты:** OpenAI ключ, Telegram бот токен, API ключи сервисов

### 1.3 Преимущества решения

- 🚀 **Быстрая авторизация** - вход через Telegram без регистрации
- 🔒 **Безопасность** - каждый пользователь видит только свои секреты
- 🎯 **Персонализация** - индивидуальные настройки и ключи
- 📊 **Audit Trail** - отслеживание доступа к секретам
- 🔄 **Масштабируемость** - легко добавить новых пользователей

---

## 2. АРХИТЕКТУРА СИСТЕМЫ

### 2.1 Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                         WEB FRONTEND                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Login Page    │  │   Dashboard     │  │   Settings      │ │
│  │  (Telegram      │  │  (User secrets) │  │  (API Keys)     │ │
│  │   Widget)       │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────┬─────────────────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────┴─────────────────────────────────────────┐
│                         BACKEND API                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Auth Middleware│  │  Telegram Auth  │  │  Secret Manager │ │
│  │  (JWT Check)    │  │  (Verification) │  │  (Infisical)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   Database      │  │  User Session   │                      │
│  │   (Users/Token) │  │   Management    │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
┌─────────────────────────┴─────────────────────────────────────────┐
│                     INFISICAL CLOUD                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  users/144022504/ (Telegram ID)                        │    │
│  │  ├── openai_api_key                                     │    │
│  │  ├── telegram_bot_token                                 │    │
│  │  ├── replicate_api_key                                  │    │
│  │  └── custom_secrets/                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Компоненты системы

| Компонент | Технологии | Назначение |
|-----------|-----------|------------|
| **Frontend** | React/Vue + Telegram Login Widget | Пользовательский интерфейс |
| **Backend** | Node.js/Express + TypeScript | API и бизнес-логика |
| **Database** | PostgreSQL | Хранение пользователей и сессий |
| **Secrets** | Infisical Cloud | Персональные секреты пользователей |
| **Auth** | Telegram Login Widget + JWT | Аутентификация |

---

## 3. TELEGRAM АУТЕНТИФИКАЦИЯ

### 3.1 Telegram Login Widget

**Официальная документация:** https://core.telegram.org/widgets/login

#### Создание бота:

```bash
1. Написать @BotFather в Telegram
2. Создать бота: /newbot
3. Выбрать имя: VIBEE Agent Platform
4. Выбрать username: vibee_platform_bot
5. Получить токен: 123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
6. Установить домен: /setdomain yourdomain.com
```

#### Интеграция на фронтенде:

```html
<!-- В HTML/JSX -->
<script src="https://telegram.org/js/telegram-widget.js?22"></script>

<script>
window.Telegram.Login.auth(
  {
    bot_id: 'YOUR_BOT_ID',  // Из @BotFather
    request_write_access: true,  // Опционально: для отправки сообщений
  },
  function(user) {
    if (user) {
      // Отправляем данные на backend для верификации
      fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Сохраняем JWT токен
          localStorage.setItem('jwt_token', data.token);
          // Перенаправляем в dashboard
          window.location.href = '/dashboard';
        } else {
          alert('Ошибка авторизации');
        }
      });
    } else {
      console.log('Пользователь отменил авторизацию');
    }
  }
);
</script>
```

#### Параметры виджета:

```javascript
// Базовый виджет
Telegram.Login.auth({
  bot_id: 'YOUR_BOT_ID'
});

// Расширенный виджет
Telegram.Login.auth({
  bot_id: 'YOUR_BOT_ID',
  request_write_access: true,
  show_user_photo: true,
  corner_radius: 5
}, callback);
```

### 3.2 Верификация на backend

#### Установка зависимостей:

```bash
npm install express crypto @types/crypto jsonwebtoken @types/jsonwebtoken
```

#### Серверная верификация:

```typescript
// src/middleware/telegramAuth.ts
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function verifyTelegramAuth(userData: TelegramUser, botToken: string): boolean {
  // 1. Проверяем auth_date (не старше 24 часов)
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 24 * 60 * 60; // 24 часа

  if (now - userData.auth_date > maxAge) {
    throw new Error('Auth data expired');
  }

  // 2. Проверяем hash
  // Создаем data_check_string из всех полей кроме hash
  const { hash, ...data } = userData;

  const dataCheckString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key as keyof TelegramUser]}`)
    .join('\n');

  // Создаем secret_key как SHA256 от bot_token
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();

  // Вычисляем HMAC-SHA256
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Сравниваем с полученным hash
  if (computedHash !== userData.hash) {
    throw new Error('Invalid hash');
  }

  return true;
}

export function telegramAuthMiddleware(botToken: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = req.body as TelegramUser;

      // Верифицируем данные
      verifyTelegramAuth(userData, botToken);

      // Проверяем/создаем пользователя в БД
      const user = await getOrCreateUser(userData);

      // Создаем JWT токен
      const token = jwt.sign(
        {
          userId: user.id,
          telegramId: user.telegram_id
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({ success: true, token, user });
    } catch (error) {
      console.error('Telegram auth error:', error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
```

#### Express маршрут:

```typescript
// src/routes/auth.ts
import express from 'express';
const router = express.Router();

// Telegram аутентификация
router.post('/telegram', telegramAuthMiddleware(process.env.TELEGRAM_BOT_TOKEN!));

// Проверка токена
router.get('/verify', authenticateToken, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;
```

---

## 4. INFISICAL ДЛЯ ПОЛЬЗОВАТЕЛЬСКИХ ДАННЫХ

### 4.1 Структура секретов в Infisical

#### Организация по пользователям:

```
vibee-agent/
├── users/                    # Персональные секреты пользователей
│   ├── 144022504/           # Telegram ID пользователя
│   │   ├── openai_api_key
│   │   ├── replicate_api_key
│   │   ├── fal_key
│   │   └── custom_secrets/
│   ├── 123456789/           # Другой пользователь
│   │   ├── telegram_bot_token
│   │   └── ...
│   └── ...
├── shared/                   # Общие секреты (для всех)
│   ├── database_url
│   └── redis_url
└── admin/                    # Админские функции
    └── admin_api_key
```

#### Environment'ы в Infisical:

- **dev** - для тестирования и разработки
- **staging** - для staging окружения
- **prod** - для production

### 4.2 Создание структуры в Infisical

#### CLI команды:

```bash
# Инициализация проекта
infisical init --projectId=fd763fa3-35d5-4045-93bd-1795c5f00fc3

# Создание папки для пользователей
infisical secrets create --path=users --env=dev

# Создание папки для конкретного пользователя
infisical secrets create --path=users/144022504 --env=dev

# Добавление секретов для пользователя
infisical secrets create \
  --env=dev \
  --path=users/144022504/openai_api_key \
  --value="sk-..."

infisical secrets create \
  --env=dev \
  --path=users/144022504/telegram_bot_token \
  --value="123456789:ABC..."

# Список секретов пользователя
infisical secrets list --path=users/144022504 --env=dev

# Удаление секретов
infisical secrets delete \
  --path=users/144022504/openai_api_key \
  --env=dev
```

### 4.3 API для работы с пользовательскими секретами

#### Node.js сервис:

```typescript
// src/services/secretService.ts
import { InfisicalClient } from '@infisical/sdk';

export class SecretService {
  private infisical: InfisicalClient;

  constructor() {
    this.infisical = new InfisicalClient({
      clientId: process.env.INFISICAL_CLIENT_ID!,
      clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
    });
  }

  /**
   * Получить секреты пользователя по Telegram ID
   */
  async getUserSecrets(telegramId: string, environment: string = 'dev') {
    try {
      const path = `users/${telegramId}`;

      const secrets = await this.infisical.listSecrets({
        environment,
        path,
      });

      return secrets.secrets;
    } catch (error) {
      console.error(`Failed to get secrets for user ${telegramId}:`, error);
      return [];
    }
  }

  /**
   * Получить конкретный секрет пользователя
   */
  async getUserSecret(telegramId: string, secretName: string, environment: string = 'dev') {
    try {
      const path = `users/${telegramId}/${secretName}`;

      const secret = await this.infisical.getSecret({
        environment,
        path,
      });

      return secret.secretValue;
    } catch (error) {
      console.error(`Failed to get secret ${secretName} for user ${telegramId}:`, error);
      return null;
    }
  }

  /**
   * Создать/обновить секрет пользователя
   */
  async setUserSecret(
    telegramId: string,
    secretName: string,
    secretValue: string,
    environment: string = 'dev'
  ) {
    try {
      const path = `users/${telegramId}/${secretName}`;

      await this.infisical.createSecret({
        environment,
        path,
        type: 'shared',
        secretKey: secretName,
        secretValue,
      });

      return { success: true };
    } catch (error) {
      // Если секрет существует, обновляем
      if (error.message.includes('already exists')) {
        return await this.updateUserSecret(telegramId, secretName, secretValue, environment);
      }
      throw error;
    }
  }

  /**
   * Обновить существующий секрет
   */
  async updateUserSecret(
    telegramId: string,
    secretName: string,
    secretValue: string,
    environment: string = 'dev'
  ) {
    const path = `users/${telegramId}/${secretName}`;

    await this.infisical.updateSecret({
      environment,
      path,
      secretKey: secretName,
      secretValue,
    });

    return { success: true };
  }

  /**
   * Удалить секрет пользователя
   */
  async deleteUserSecret(telegramId: string, secretName: string, environment: string = 'dev') {
    const path = `users/${telegramId}/${secretName}`;

    await this.infisical.deleteSecret({
      environment,
      path,
    });

    return { success: true };
  }

  /**
   * Получить все пути пользователя (для построения UI)
   */
  async getUserSecretPaths(telegramId: string, environment: string = 'dev') {
    try {
      const secrets = await this.infisical.listSecrets({
        environment,
        path: `users/${telegramId}`,
      });

      // Группируем по категориям
      const paths = secrets.secrets.map(s => ({
        name: s.secretKey,
        path: s.path,
        updatedAt: s.updatedAt,
      }));

      return paths;
    } catch (error) {
      return [];
    }
  }
}
```

#### Express API:

```typescript
// src/routes/secrets.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { SecretService } from '../services/secretService';

const router = express.Router();
const secretService = new SecretService();

// Все маршруты требуют авторизации
router.use(authenticateToken);

// Получить секреты пользователя
router.get('/', async (req: Request, res: Response) => {
  const telegramId = req.user.telegramId;
  const environment = req.query.env || 'dev';

  const secrets = await secretService.getUserSecrets(telegramId, environment);

  // Скрываем значения секретов в списке
  res.json({
    secrets: secrets.map(s => ({
      key: s.secretKey,
      path: s.path,
      updatedAt: s.updatedAt,
    }))
  });
});

// Получить конкретный секрет
router.get('/:secretName', async (req: Request, res: Response) => {
  const telegramId = req.user.telegramId;
  const secretName = req.params.secretName;
  const environment = req.query.env || 'dev';

  const value = await secretService.getUserSecret(telegramId, secretName, environment);

  res.json({ value });
});

// Создать/обновить секрет
router.post('/', async (req: Request, res: Response) => {
  const telegramId = req.user.telegramId;
  const { secretName, secretValue, environment = 'dev' } = req.body;

  if (!secretName || !secretValue) {
    return res.status(400).json({ error: 'secretName and secretValue are required' });
  }

  const result = await secretService.setUserSecret(
    telegramId,
    secretName,
    secretValue,
    environment
  );

  res.json(result);
});

// Удалить секрет
router.delete('/:secretName', async (req: Request, res: Response) => {
  const telegramId = req.user.telegramId;
  const secretName = req.params.secretName;
  const environment = req.query.env || 'dev';

  const result = await secretService.deleteUserSecret(telegramId, secretName, environment);

  res.json(result);
});

export default router;
```

---

## 5. БАЗА ДАННЫХ И МОДЕЛИ

### 5.1 Схема базы данных

#### Таблица users:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  photo_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Дополнительные поля
  settings JSONB DEFAULT '{}',
  usage_stats JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Таблица user_sessions:

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  jwt_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Дополнительная информация
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50)
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_jwt_token ON user_sessions(jwt_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

#### Таблица secret_access_logs:

```sql
CREATE TABLE secret_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  secret_path TEXT NOT NULL,
  action VARCHAR(50) NOT NULL, -- read, write, delete
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_secret_logs_user_id ON secret_access_logs(user_id);
CREATE INDEX idx_secret_logs_created_at ON secret_access_logs(created_at);
```

### 5.2 Prisma модели (TypeScript)

```typescript
// src/models/User.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface User {
  id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  settings: Record<string, any>;
  usageStats: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId: string;
  jwtToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
}

export class UserService {
  /**
   * Найти пользователя по Telegram ID
   */
  async findByTelegramId(telegramId: number): Promise<User | null> {
    return await prisma.users.findUnique({
      where: { telegram_id: telegramId }
    });
  }

  /**
   * Создать нового пользователя
   */
  async createUser(userData: {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
  }): Promise<User> {
    return await prisma.users.create({
      data: {
        telegram_id: userData.telegramId,
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        photo_url: userData.photoUrl,
      }
    });
  }

  /**
   * Обновить время последнего входа
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: { last_login_at: new Date() }
    });
  }

  /**
   * Создать сессию
   */
  async createSession(sessionData: {
    userId: string;
    jwtToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserSession> {
    return await prisma.user_sessions.create({
      data: {
        user_id: sessionData.userId,
        jwt_token: sessionData.jwtToken,
        expires_at: sessionData.expiresAt,
        ip_address: sessionData.ipAddress,
        user_agent: sessionData.userAgent,
      }
    });
  }

  /**
   * Найти сессию по JWT токену
   */
  async findSessionByToken(jwtToken: string): Promise<UserSession | null> {
    return await prisma.user_sessions.findUnique({
      where: { jwt_token: jwtToken }
    });
  }

  /**
   * Удалить сессию
   */
  async deleteSession(sessionId: string): Promise<void> {
    await prisma.user_sessions.delete({
      where: { id: sessionId }
    });
  }
}
```

---

## 6. СИСТЕМА ОГРАНИЧЕНИЯ ДОСТУПА

### 6.1 Middleware авторизации

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../models/User';

const userService = new UserService();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    telegramId: number;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Проверяем JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      telegramId: number;
    };

    // Проверяем, что сессия существует и не истекла
    const session = await userService.findSessionByToken(token);
    if (!session || session.expires_at < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Обновляем last_used_at
    await prisma.user_sessions.update({
      where: { id: session.id },
      data: { last_used_at: new Date() }
    });

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware для проверки premium доступа
 */
export function requirePremium(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Проверяем premium статус в БД
  userService.findByTelegramId(req.user.telegramId).then(user => {
    if (!user?.isPremium) {
      return res.status(403).json({
        error: 'Premium subscription required',
        upgradeUrl: '/pricing'
      });
    }
    next();
  }).catch(error => {
    console.error('Premium check error:', error);
    res.status(500).json({ error: 'Server error' });
  });
}
```

### 6.2 Защита маршрутов

```typescript
// src/routes/protected.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { SecretService } from '../services/secretService';

const router = express.Router();
const secretService = new SecretService();

// Все маршруты требуют авторизации
router.use(authenticateToken);

// Dashboard - только для авторизованных
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    message: 'Welcome to your dashboard!',
    user: req.user
  });
});

// Secrets - только для авторизованных
router.get('/secrets', async (req: AuthenticatedRequest, res: Response) => {
  const secrets = await secretService.getUserSecrets(req.user.telegramId);
  res.json({ secrets });
});

// Settings - только для авторизованных
router.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    message: 'Your settings',
    userId: req.user.userId
  });
});

export default router;
```

### 6.3 Frontend защита

#### React пример:

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');

    if (!token) {
      navigate('/login');
      return;
    }

    // Проверяем токен на backend
    fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Invalid token');
    })
    .then(data => {
      setUser(data.user);
      setLoading(false);
    })
    .catch(error => {
      console.error('Auth check failed:', error);
      localStorage.removeItem('jwt_token');
      navigate('/login');
    });
  }, [navigate]);

  return { user, loading };
}
```

#### React компонент для защиты:

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

#### Использование:

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публичная страница */}
        <Route path="/login" element={<LoginPage />} />

        {/* Защищенные маршруты */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Редирект по умолчанию */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 7. ИНТЕГРАЦИЯ С VIBEE

### 7.1 Архитектура интеграции

```
┌─────────────────────────────────────────────────────────────┐
│                    VIBEE PLATFORM                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │  Telegram Bot    │  │  Web Application                │ │
│  │  (VIBEE Agent)   │  │  (Telegram Auth + Secrets)      │ │
│  │                  │  │                                 │ │
│  │  - Handles /start│  │  - Login via Telegram           │ │
│  │  - /neurophoto   │  │  - Personal secret storage      │ │
│  │  - /face add     │  │  - API keys management          │ │
│  │  - /train        │  │  - User settings                │ │
│  └──────────────────┘  └─────────────────────────────────┘ │
│           │                        │                          │
│           │                        │                          │
│           └───────────┬────────────┘                          │
│                       │                                       │
│            ┌──────────▼────────────────────────────┐          │
│            │        INFISICAL CLOUD                │          │
│            │                                      │          │
│            │  users/144022504/                     │          │
│            │  ├── telegram_bot_token              │          │
│            │  ├── openai_api_key                  │          │
│            │  └── ...                             │          │
│            └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Интеграция секретов VIBEE агента

#### Получение пользовательских секретов для агента:

```typescript
// src/services/vibeeAgent.ts
import { SecretService } from './secretService';

export class VibeAgentService {
  private secretService: SecretService;

  constructor() {
    this.secretService = new SecretService();
  }

  /**
   * Инициализация агента с пользовательскими секретами
   */
  async initializeAgent(telegramId: number, agentType: 'vibee' | 'instagram' | 'kols') {
    const environment = process.env.NODE_ENV || 'dev';

    // Получаем секреты пользователя
    const userSecrets = await this.secretService.getUserSecrets(
      telegramId.toString(),
      environment
    );

    // Настраиваем агента с пользовательскими ключами
    const agentConfig = this.buildAgentConfig(agentType, userSecrets);

    return agentConfig;
  }

  /**
   * Построение конфигурации агента
   */
  private buildAgentConfig(agentType: string, userSecrets: any[]) {
    const config: any = {
      plugins: ['@elizaos/plugin-bootstrap', '@elizaos/plugin-sql']
    };

    // Настройка Telegram бота
    const telegramSecret = userSecrets.find(s => s.secretKey === 'telegram_bot_token');
    if (telegramSecret) {
      config.plugins.push({
        name: '@elizaos/plugin-telegram',
        config: {
          botToken: telegramSecret.secretValue
        }
      });
    }

    // Настройка AI провайдера
    const openaiSecret = userSecrets.find(s => s.secretKey === 'openai_api_key');
    const openrouterSecret = userSecrets.find(s => s.secretKey === 'openrouter_api_key');

    if (openaiSecret) {
      config.plugins.push({
        name: '@elizaos/plugin-openai',
        config: {
          apiKey: openaiSecret.secretValue
        }
      });
    } else if (openrouterSecret) {
      config.plugins.push({
        name: '@elizaos/plugin-openrouter',
        config: {
          apiKey: openrouterSecret.secretValue
        }
      });
    }

    return config;
  }
}
```

#### API для запуска агента:

```typescript
// src/routes/agent.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { VibeAgentService } from '../services/vibeeAgent';

const router = express.Router();
const agentService = new VibeAgentService();

// Запуск агента с пользовательскими секретами
router.post('/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { agentType = 'vibee' } = req.body;

  try {
    const config = await agentService.initializeAgent(req.user.telegramId, agentType);

    res.json({
      success: true,
      config,
      message: 'Agent initialized with your personal API keys'
    });
  } catch (error) {
    console.error('Agent initialization failed:', error);
    res.status(500).json({
      error: 'Failed to initialize agent',
      details: error.message
    });
  }
});

// Получение статуса агента
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  // Проверяем, какие секреты настроены
  const availableSecrets = await agentService.getAvailableSecrets(req.user.telegramId);

  res.json({
    telegramId: req.user.telegramId,
    availableSecrets,
    hasValidConfig: availableSecrets.length > 0
  });
});

export default router;
```

---

## 8. ПОШАГОВАЯ ИНСТРУКЦИЯ ВНЕДРЕНИЯ

### Шаг 1: Настройка Telegram бота

```bash
# 1. Создать бота через @BotFather
/newbot
# Ввести имя: VIBEE Platform
# Ввести username: vibee_platform_bot
# Получить токен: 123456789:ABC...

# 2. Установить домен
/setdomain yourdomain.com

# 3. Получить bot_id (первая часть токена)
bot_id = 123456789
bot_token = 123456789:ABC...
```

### Шаг 2: Настройка Infisical

```bash
# 1. Инициализация проекта
infisical init --projectId=fd763fa3-35d5-4045-93bd-1795c5f00fc3

# 2. Создать структуру папок
infisical secrets create --path=users --env=dev

# 3. Добавить тестового пользователя
infisical secrets create \
  --env=dev \
  --path=users/144022504/openai_api_key \
  --value="sk-test-key-for-user-144022504"
```

### Шаг 3: Backend setup

```typescript
// .env
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_BOT_ID=123456789
JWT_SECRET=your-super-secret-jwt-key-change-this
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=b377e7a60b669ea2317f339dc6cb79ce49d588a7bbed92433bb2a73dedff3314
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3
DATABASE_URL=postgresql://...
```

### Шаг 4: Frontend интеграция

```html
<!DOCTYPE html>
<html>
<head>
  <title>VIBEE Platform</title>
  <script src="https://telegram.org/js/telegram-widget.js?22"></script>
</head>
<body>
  <div id="login-container"></div>
  <div id="dashboard" style="display: none;"></div>

  <script>
    // Проверяем, авторизован ли пользователь
    const token = localStorage.getItem('jwt_token');

    if (token) {
      // Проверяем токен
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          showDashboard();
        } else {
          showLogin();
        }
      })
      .catch(() => showLogin());
    } else {
      showLogin();
    }

    function showLogin() {
      document.getElementById('login-container').style.display = 'block';
      document.getElementById('dashboard').style.display = 'none';

      // Создаем кнопку авторизации
      const button = document.createElement('script');
      button.textContent = `
        Telegram.Login.auth({
          bot_id: '123456789',
          request_write_access: true,
          show_user_photo: true
        }, function(user) {
          if (user) {
            // Отправляем на backend
            fetch('/api/auth/telegram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(user)
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                localStorage.setItem('jwt_token', data.token);
                location.reload();
              } else {
                alert('Ошибка авторизации');
              }
            });
          }
        });
      `;
      document.body.appendChild(button);
    }

    function showDashboard() {
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';

      // Загружаем секреты пользователя
      fetch('/api/secrets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      })
      .then(response => response.json())
      .then(data => {
        // Отображаем секреты
        console.log('User secrets:', data.secrets);
      });
    }
  </script>
</body>
</html>
```

### Шаг 5: Тестирование

```bash
# 1. Запустить backend
npm run dev

# 2. Открыть http://localhost:3000

# 3. Нажать "Войти через Telegram"

# 4. Разрешить доступ

# 5. Проверить dashboard и секреты
```

---

## 9. БЕЗОПАСНОСТЬ И ЛУЧШИЕ ПРАКТИКИ

### 9.1 Принципы безопасности

#### ✅ Hash Verification
```typescript
// ВСЕГДА проверяем hash от Telegram
function verifyTelegramAuth(userData: any, botToken: string): boolean {
  // ... проверка обязательна!
}
```

#### ✅ JWT Security
```typescript
// Используем сильный JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Ограничиваем время жизни токена
const token = jwt.sign(
  { userId, telegramId },
  JWT_SECRET,
  { expiresIn: '30d' } // Максимум 30 дней
);
```

#### ✅ Secret Isolation
```typescript
// Каждый пользователь видит только свои секреты
const path = `users/${telegramId}/${secretName}`;
await infisical.getSecret({ path });
```

#### ✅ Database Encryption
```sql
-- Шифруем чувствительные данные в БД
ALTER TABLE users ADD COLUMN encrypted_data BYTEA;

-- Используем AES-256-GCM для шифрования
```

### 9.2 Audit и мониторинг

```typescript
// Логируем все операции с секретами
async function logSecretAccess(userId: string, action: string, secretPath: string) {
  await prisma.secret_access_logs.create({
    data: {
      user_id: userId,
      action,
      secret_path: secretPath,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }
  });
}
```

### 9.3 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток авторизации
  message: 'Too many auth attempts, please try again later'
});

router.post('/telegram', authLimiter, telegramAuthMiddleware);
```

---

## 10. ЗАКЛЮЧЕНИЕ

### 10.1 Преимущества системы

- ✅ **Безопасность** - каждая операция верифицируется
- ✅ **Персонализация** - пользователи работают только со своими данными
- ✅ **Простота** - авторизация через Telegram без регистрации
- ✅ **Масштабируемость** - легко добавлять новых пользователей
- ✅ **Интеграция** - работает с VIBEE агентами

### 10.2 Результат внедрения

**Для пользователя с Telegram ID `144022504`:**
1. Вход на сайт через Telegram Login Widget
2. Персональная область для API ключей
3. Интеграция ключей с VIBEE агентами
4. Безопасное хранение через Infisical
5. Audit trail всех операций

### 10.3 Следующие шаги

1. **Создать бота** через @BotFather
2. **Настроить Infisical** структуру папок
3. **Реализовать backend** с аутентификацией
4. **Создать frontend** с Telegram виджетом
5. **Протестировать** с пользователем 144022504
6. **Развернуть** в production

### 10.4 Команды для быстрого старта

```bash
# Настройка бота
# 1. @BotFather: /newbot
# 2. @BotFather: /setdomain localhost:3000

# Настройка Infisical
infisical init --projectId=fd763fa3-35d5-4045-93bd-1795c5f00fc3
infisical secrets create --path=users/144022504 --env=dev

# Установка зависимостей
npm install express @types/express crypto @types/crypto \
           jsonwebtoken @types/jsonwebtoken \
           @infisical/sdk @prisma/client

# Запуск
npm run dev
```

---

**📧 Техподдержка:** dev-team@vibee.io
**📅 Дата создания:** 2025-11-25
**👤 Telegram ID тестового пользователя:** `144022504`

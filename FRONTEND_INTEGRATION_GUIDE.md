# 🎨 Интеграция аутентификации в Frontend

## 📋 Что создано

Система аутентификации работает на **backend API**. Frontend нужно интегрировать отдельно.

Созданные компоненты:
- ✅ `LoginPage.tsx` - Страница входа через Telegram
- ✅ `AuthGuard.tsx` - Защита маршрутов
- ✅ `DashboardPage.tsx` - Пример защищенной страницы

---

## 🚀 Как интегрировать

### 1. Установить зависимости

```bash
# В папке с frontend
npm install react-router-dom
# или
yarn add react-router-dom
```

### 2. Добавить Telegram Login Widget

В `index.html` добавьте:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- ... другие теги ... -->
  <script src="https://telegram.org/js/telegram-widget.js"></script>
</head>
<body>
  <div id="root"></div>
  <!-- ... -->
</body>
</html>
```

### 3. Создать страницу входа

`src/pages/LoginPage.tsx`:
```tsx
import React, { useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Проверяем наличие Telegram
    if (!window.Telegram?.Login) {
      setError('Telegram не загружен');
      return;
    }

    window.Telegram.Login.auth(
      {
        bot_id: 'YOUR_BOT_ID',
        request_access: true,
        lang: 'ru'
      },
      async (user) => {
        if (user) {
          try {
            const response = await fetch('/api/auth/telegram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(user)
            });

            const data = await response.json();

            if (data.success) {
              localStorage.setItem('token', data.token);
              window.location.href = '/dashboard';
            } else {
              setError(data.error);
            }
          } catch (err) {
            setError('Ошибка соединения');
          }
        }
      }
    );
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
        <h2>Вход в систему</h2>
        <p>Войдите через Telegram для доступа к системе</p>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button
          onClick={handleLogin}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#0088cc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Войти через Telegram
        </button>
      </div>
    </div>
  );
}
```

### 4. Создать компонент защиты

`src/components/AuthGuard.tsx`:
```tsx
import React, { useState, useEffect } from 'react';
import LoginPage from '../pages/LoginPage';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      localStorage.removeItem('token');
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div>
      <header style={{ padding: '1rem', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'space-between' }}>
        <h1>VIBEE</h1>
        <div>
          <span>{user.firstName} {user.lastName}</span>
          <button onClick={handleLogout} style={{ marginLeft: '1rem' }}>
            Выйти
          </button>
        </div>
      </header>
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
```

### 5. Защитить страницы

`src/App.tsx`:
```tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### 6. Создать страницу с секретами

`src/pages/DashboardPage.tsx`:
```tsx
import React, { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [secrets, setSecrets] = useState([]);
  const [newSecret, setNewSecret] = useState({ key: '', value: '' });

  const loadSecrets = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/secrets', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.success) {
      setSecrets(data.secrets);
    }
  };

  const createSecret = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const response = await fetch('/api/secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newSecret)
    });

    if (response.ok) {
      setNewSecret({ key: '', value: '' });
      loadSecrets();
    }
  };

  useEffect(() => {
    loadSecrets();
  }, []);

  return (
    <div>
      <h2>Панель управления</h2>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Мои секреты</h3>
        {secrets.length === 0 ? (
          <p>Нет секретов</p>
        ) : (
          <ul>
            {secrets.map((secret) => (
              <li key={secret.key}>{secret.key}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3>Создать секрет</h3>
        <form onSubmit={createSecret}>
          <input
            type="text"
            placeholder="Название"
            value={newSecret.key}
            onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value })}
          />
          <textarea
            placeholder="Значение"
            value={newSecret.value}
            onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
          />
          <button type="submit">Создать</button>
        </form>
      </div>
    </div>
  );
}
```

---

## 🔧 Настройка

### 1. Замените YOUR_BOT_ID

В `LoginPage.tsx` найдите:
```javascript
bot_id: 'YOUR_BOT_ID'
```

Замените на ID вашего бота (получите от @BotFather в Telegram).

### 2. Настройте роутинг

Если используете не React Router, а другой роутер - адаптируйте код.

---

## 🎯 Проверка

1. Откройте `http://localhost:3000/`
2. Должна открыться страница входа
3. Нажмите "Войти через Telegram"
4. После входа - переход на `/dashboard`
5. Страницы защищены - без токена не попасть

---

## 📝 API Endpoints

```javascript
// Аутентификация
POST /api/auth/telegram     // Вход
GET  /api/auth/verify       // Проверка токена
GET  /api/auth/me           // Информация о пользователе
POST /api/auth/logout       // Выход

// Секреты
GET  /api/secrets           // Список секретов
POST /api/secrets           // Создать секрет
```

---

## ✅ Готово!

После интеграции frontend страницы будут защищены системой аутентификации Telegram.

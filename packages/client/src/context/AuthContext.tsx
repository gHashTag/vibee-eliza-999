import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  is_premium: boolean;
  created_at: Date;
  last_login_at: Date;
  settings: any;
  usage_stats: any;
}

interface AuthContextType {
  user: User | null;
  login: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 [CHECKAUTH] Проверяем авторизацию...');
      const token = localStorage.getItem('authToken');
      console.log('🔍 [CHECKAUTH] Токен в localStorage:', token ? `${token.substring(0, 20)}...` : 'ОТСУТСТВУЕТ');

      if (token) {
        console.log('✅ [CHECKAUTH] Токен найден, проверяем на сервере...');

        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('📥 [CHECKAUTH] Ответ от сервера верификации:');
        console.log('  - Статус:', response.status);
        console.log('  - Статус текст:', response.statusText);
        console.log('  - OK:', response.ok);

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ [CHECKAUTH] Верификация успешна:', JSON.stringify(userData, null, 2));
          setUser(userData);
        } else {
          console.error('❌ [CHECKAUTH] Верификация не удалась, удаляем токен');
          localStorage.removeItem('authToken');
        }
      } else {
        console.log('ℹ️ [CHECKAUTH] Токен не найден, пользователь не авторизован');
      }
    } catch (error) {
      console.error('💥 [CHECKAUTH] Ошибка проверки авторизации:', error);
      console.error('💥 [CHECKAUTH] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
      console.log('✅ [CHECKAUTH] Проверка завершена, isLoading = false');
    }
  };

  const login = async (userData: any) => {
    try {
      console.log('🔐 [CLIENT] Начинаем процесс логина...');
      console.log('🔐 [CLIENT] Отправляемые данные:', JSON.stringify(userData, null, 2));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📥 [CLIENT] Получен ответ от сервера:');
      console.log('  - Статус:', response.status);
      console.log('  - Статус текст:', response.statusText);
      console.log('  - OK:', response.ok);
      console.log('  - Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      if (!response.ok) {
        console.error('❌ [CLIENT] response.ok === false');
        console.error('❌ [CLIENT] Статус:', response.status);
        console.error('❌ [CLIENT] Статус текст:', response.statusText);

        // Пытаемся прочитать тело ответа для диагностики
        let errorBody = '';
        try {
          errorBody = await response.text();
          console.error('❌ [CLIENT] Тело ошибки:', errorBody);
        } catch (e) {
          console.error('❌ [CLIENT] Не удалось прочитать тело ошибки:', e);
        }

        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [CLIENT] response.ok === true, парсим JSON...');

      let responseData;
      try {
        responseData = await response.json();
        console.log('✅ [CLIENT] JSON успешно распарсен:', JSON.stringify(responseData, null, 2));
      } catch (parseError) {
        console.error('❌ [CLIENT] Ошибка парсинга JSON:', parseError);
        console.error('❌ [CLIENT] Текст ответа:', await response.text());
        throw new Error('Invalid JSON response');
      }

      const { user: userInfo, token } = responseData;
      console.log('🔑 [CLIENT] Извлекаем данные:');
      console.log('  - userInfo:', JSON.stringify(userInfo, null, 2));
      console.log('  - token:', token ? `${token.substring(0, 20)}...` : 'ОТСУТСТВУЕТ');

      if (!token) {
        console.error('❌ [CLIENT] Токен отсутствует в ответе!');
        throw new Error('Token not found in response');
      }

      // Store token
      console.log('💾 [CLIENT] Сохраняем токен в localStorage...');
      localStorage.setItem('authToken', token);
      console.log('✅ [CLIENT] Токен сохранён');

      // Set user
      console.log('👤 [CLIENT] Устанавливаем пользователя в состояние...');
      setUser(userInfo);
      console.log('✅ [CLIENT] Пользователь установлен');
      console.log('🎉 [CLIENT] Логин завершён успешно!');

    } catch (error) {
      console.error('💥 [CLIENT] Общая ошибка в login():', error);
      console.error('💥 [CLIENT] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

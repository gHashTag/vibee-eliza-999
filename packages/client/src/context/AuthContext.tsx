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
      // Проверяем сохранённые данные пользователя
      const savedUser = localStorage.getItem('vibee_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('vibee_user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: any) => {
    try {
      // Сохраняем данные пользователя локально (для демо)
      localStorage.setItem('vibee_user', JSON.stringify(userData));

      // Устанавливаем пользователя
      setUser(userData);

      console.log('✅ Логин успешен:', userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('vibee_user');
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

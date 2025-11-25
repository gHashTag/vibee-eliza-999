import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiKeyDialog } from '@/components/api-key-dialog';
import clientLogger from '@/lib/logger';

interface User {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (telegramData: any) => Promise<void>;
  logout: () => void;
  openApiKeyDialog: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем токен при загрузке
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    }

    setIsLoading(false);
  };

  const login = async (telegramData: any) => {
    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramData)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('token');
    setUser(null);
  };

  const openApiKeyDialog = useCallback(() => {
    setIsApiKeyDialogOpen(true);
  }, []);

  const handleApiKeySaved = useCallback(() => {
    setIsApiKeyDialogOpen(false);
    clientLogger.info('API key saved via dialog, invalidating ping query.');
    queryClient.invalidateQueries({ queryKey: ['ping'] });
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      openApiKeyDialog
    }}>
      {children}
      <ApiKeyDialog
        open={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
        onApiKeySaved={handleApiKeySaved}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

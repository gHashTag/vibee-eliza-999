import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    Telegram: {
      Login: {
        auth: (params: any, callback: (user: any) => void) => void;
      };
    };
  }
}

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = () => {
    if (!window.Telegram?.Login) {
      setError('Telegram Login Widget не загружен. Проверьте подключение к интернету.');
      return;
    }

    const botId = import.meta.env.VITE_TELEGRAM_BOT_ID || 'YOUR_BOT_ID_HERE';

    setIsLoading(true);
    setError('');

    window.Telegram.Login.auth(
      {
        bot_id: botId,
        request_access: true,
        lang: 'ru'
      },
      async (user: any) => {
        setIsLoading(false);

        if (user) {
          try {
            await login(user);
          } catch (err: any) {
            setError(err.message || 'Ошибка входа');
          }
        } else {
          setError('Вход отменен');
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2">VIBEE</h1>
          <p className="text-gray-400">Система управления агентами</p>
        </div>

        {/* Форма входа */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            Вход в систему
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Войдите через Telegram для доступа к панели управления
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`w-full flex items-center justify-center px-6 py-4 rounded-lg font-semibold transition-all duration-200 ${
              isLoading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 hover:border-blue-400'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Выполняется вход...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Войти через Telegram
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Используя Telegram для входа, вы соглашаетесь с{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                политикой конфиденциальности
              </a>
            </p>
          </div>
        </div>

        {/* Подключаем Telegram Login Widget */}
        <script src="https://telegram.org/js/telegram-widget.js"></script>
      </div>
    </div>
  );
}

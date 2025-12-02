import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // Callback для Telegram Login Widget
  useEffect(() => {
    console.log('🔔 [LOGINPAGE] Регистрируем onTelegramAuth callback');
    window.onTelegramAuth = async (user: any) => {
      console.log('🔔 [LOGINPAGE] === ПОЛУЧЕНЫ ДАННЫЕ ОТ TELEGRAM ===');
      console.log('🔔 [LOGINPAGE] Данные пользователя:', JSON.stringify(user, null, 2));

      setIsLoading(true);
      setError('');

      try {
        console.log('🔔 [LOGINPAGE] Вызываем login()...');
        await login(user);
        console.log('🎉 [LOGINPAGE] login() завершён успешно!');
      } catch (err: any) {
        console.error('💥 [LOGINPAGE] Ошибка в login():', err);
        console.error('💥 [LOGINPAGE] Error message:', err.message);
        console.error('💥 [LOGINPAGE] Stack:', err.stack);
        setError(err.message || 'Ошибка входа');
      } finally {
        setIsLoading(false);
        console.log('✅ [LOGINPAGE] Устанавливаем isLoading = false');
      }
    };

    return () => {
      console.log('🧹 [LOGINPAGE] Удаляем onTelegramAuth callback');
      delete window.onTelegramAuth;
    };
  }, [login]);

  // Динамически загружаем Telegram Login Widget
  useEffect(() => {
    const container = document.getElementById('telegram-login-container');
    if (!container) return;

    // Очищаем контейнер
    container.innerHTML = '';

    // Создаем script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'agent_vibecoder_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    container.appendChild(script);
  }, []);


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

          {isLoading && (
            <div className="mb-6 p-4 bg-blue-900/50 border border-blue-800 rounded-lg flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-blue-400 text-sm">Выполняется вход...</p>
            </div>
          )}

          {/* Telegram Login Widget Container */}
          <div id="telegram-login-container" className="flex justify-center"></div>


          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Используя Telegram для входа, вы соглашаетесь с{' '}
              <a href="#" className="text-gray-400 hover:text-gray-300">
                политикой конфиденциальности
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

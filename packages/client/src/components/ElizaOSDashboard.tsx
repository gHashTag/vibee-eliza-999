import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface ElizaOSDashboardProps {
  className?: string;
}

const ElizaOSDashboard: React.FC<ElizaOSDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Определяем базовый URL - localhost для dev, текущий домен для production
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;

      // Для development: localhost:3000 (AgentServer)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Пробуем найти порт сервера (может быть 3000, 3001, 3002 и т.д.)
        // В dev режиме React dev server обычно на 5173, но AgentServer на 3000+
        return `${protocol}//${hostname}:3000`;
      }

      // Для production: тот же домен
      return `${protocol}//${hostname}`;
    }
    return '';
  };

  const baseUrl = getBaseUrl();
  const iframeSrc = `${baseUrl}/?token=${localStorage.getItem('authToken') || ''}`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log('✅ ElizaOS Dashboard iframe loaded');
      setIsLoaded(true);
      setHasError(false);
    };

    const handleError = () => {
      console.error('❌ Failed to load ElizaOS Dashboard');
      setHasError(true);
      setIsLoaded(false);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    // Проверяем через 3 секунды
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.log('⏰ Iframe load timeout');
        setHasError(true);
      }
    }, 3000);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      clearTimeout(timeout);
    };
  }, [isLoaded]);

  // Функция для передачи токена в iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isLoaded) return;

    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Отправляем токен в iframe через postMessage
        iframe.contentWindow?.postMessage({
          type: 'AUTH_TOKEN',
          token: token,
          user: user
        }, window.location.origin);

        console.log('📤 Sent auth token to iframe');
      } catch (error) {
        console.error('❌ Failed to send token to iframe:', error);
      }
    }
  }, [isLoaded, user]);

  return (
    <div className={`w-full h-screen bg-black ${className}`}>
      {/* Заголовок с информацией о пользователе */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-xl font-semibold">ElizaOS Dashboard</h1>
          <span className="text-gray-400">•</span>
          <span className="text-gray-300">
            Добро пожаловать, {user?.first_name || 'Пользователь'}!
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-green-400 text-sm">
            ✓ Авторизован через Telegram
          </span>
          <button
            onClick={() => {
              localStorage.removeItem('authToken');
              window.location.reload();
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Iframe с ElizaOS UI */}
      <div className="relative w-full h-[calc(100vh-73px)]">
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg">Загрузка ElizaOS Dashboard...</p>
              <p className="text-gray-400 text-sm mt-2">Подключение к {baseUrl}</p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center max-w-md">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-white text-lg mb-2">Ошибка загрузки Dashboard</p>
              <p className="text-gray-400 text-sm mb-4">
                Не удалось подключиться к AgentServer на {baseUrl}
              </p>
              <div className="space-y-2 text-left bg-gray-900 p-4 rounded">
                <p className="text-gray-300 text-sm">
                  <strong>URL:</strong> {baseUrl}
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Статус:</strong> Сервер недоступен
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Решение:</strong> Убедитесь что AgentServer запущен
                </p>
              </div>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoaded(false);
                  if (iframeRef.current) {
                    iframeRef.current.src = iframeSrc;
                  }
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-0"
          style={{ display: isLoaded || hasError ? 'block' : 'none' }}
          title="ElizaOS Dashboard"
          allow="microphone; camera; geolocation"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          onLoad={() => {
            console.log('📥 Iframe onLoad event');
          }}
        />
      </div>

      {/* Отладочная информация (только в development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 right-4 bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-400">
          <div>URL: {baseUrl}</div>
          <div>Token: {localStorage.getItem('authToken') ? '✓ Set' : '✗ Missing'}</div>
          <div>Loaded: {isLoaded ? '✓' : '✗'}</div>
        </div>
      )}
    </div>
  );
};

export default ElizaOSDashboard;
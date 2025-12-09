import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
    TelegramLoginWidget?: any;
  }
}

// ВАЖНО: Создаем callback ГЛОБАЛЬНО, до загрузки виджета!
// Используем IIFE для гарантии выполнения
(function initTelegramCallback() {
  if (typeof window === 'undefined') return;

  console.log('🔔 [INIT] Инициализация Telegram callback...');
  console.log('🔍 [INIT] Текущий URL:', window.location.href);
  console.log('🔍 [INIT] Родительское окно:', window.parent === window ? 'НЕТ (мы в iframe)' : 'ДА (мы в обычном окне)');
  console.log('🔍 [INIT] Origin:', window.location.origin);
  console.log('🔍 [INIT] User Agent:', navigator.userAgent);

  // Принудительно создаем/перезаписываем callback
  window.onTelegramAuth = function(user: any) {
    const callbackStart = '🔔 [CALLBACK] === ПОЛУЧЕНЫ ДАННЫЕ ОТ TELEGRAM ===';
    console.log(callbackStart);
    sendLogToServer(callbackStart);

    const timeMsg = `🔔 [CALLBACK] Время получения: ${new Date().toISOString()}`;
    console.log(timeMsg);
    sendLogToServer(timeMsg);

    const dataMsg = `🔔 [CALLBACK] Данные пользователя: ${JSON.stringify(user, null, 2)}`;
    console.log(dataMsg);
    sendLogToServer('Callback received user data', { user });

    const typeMsg = `🔔 [CALLBACK] Тип данных user: ${typeof user}`;
    console.log(typeMsg);
    sendLogToServer(typeMsg, { userType: typeof user });

    const idMsg = `🔔 [CALLBACK] Есть ли поле id: ${user && user.id ? 'ДА' : 'НЕТ'}`;
    console.log(idMsg);
    sendLogToServer(idMsg, { hasId: !!(user && user.id) });

    // Создаем событие для React компонента
    const event = new CustomEvent('telegramAuthSuccess', { detail: user });
    window.dispatchEvent(event);

    const eventMsg = '🔔 [CALLBACK] ✅ Событие telegramAuthSuccess отправлено';
    console.log(eventMsg);
    sendLogToServer(eventMsg);

    const finishMsg = '🔔 [CALLBACK] 🔚 Завершение обработки callback';
    console.log(finishMsg);
    sendLogToServer(finishMsg);
  };

  // Также добавляем глобальный обработчик для отладки
  window.onTelegramAuthProxy = function(user: any) {
    console.log('🔍 [PROXY] Прокси-обработчик вызван');
    if (typeof window.onTelegramAuth === 'function') {
      console.log('🔍 [PROXY] Вызываем основной обработчик...');
      window.onTelegramAuth(user);
    } else {
      console.error('❌ [PROXY] Основной обработчик не найден!');
    }
  };

  console.log('✅ [INIT] window.onTelegramAuth создан:', typeof window.onTelegramAuth);
  console.log('✅ [INIT] window.onTelegramAuthProxy создан:', typeof window.onTelegramAuthProxy);
})();

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const { login } = useAuth();

  // Проверяем URL-параметры при загрузке (для redirect-based авторизации)
  useEffect(() => {
    const checkUrlParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = urlParams.get('hash');
      const id = urlParams.get('id');

      console.log('🔍 [LOGINPAGE] Проверяем URL параметры...');
      console.log('🔍 [LOGINPAGE] URL:', window.location.href);
      console.log('🔍 [LOGINPAGE] hash:', hash ? 'присутствует' : 'отсутствует');
      console.log('🔍 [LOGINPAGE] id:', id);

      // Если есть параметры авторизации в URL
      if (hash && id) {
        console.log('🔔 [LOGINPAGE] Найдены данные авторизации в URL!');

        const userData = {
          id: parseInt(id),
          first_name: urlParams.get('first_name') || '',
          last_name: urlParams.get('last_name') || '',
          username: urlParams.get('username') || '',
          photo_url: urlParams.get('photo_url') || '',
          auth_date: urlParams.get('auth_date') || '',
          hash: hash
        };

        console.log('🔔 [LOGINPAGE] Данные из URL:', JSON.stringify(userData, null, 2));

        setIsLoading(true);
        try {
          await login(userData);
          console.log('🎉 [LOGINPAGE] Авторизация через URL успешна!');
          // Очищаем URL от параметров
          window.history.replaceState({}, '', window.location.pathname);
        } catch (err: any) {
          console.error('💥 [LOGINPAGE] Ошибка авторизации через URL:', err);
          setError(err.message || 'Ошибка входа');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkUrlParams();
  }, [login]);

  // Слушаем событие от глобального callback
  useEffect(() => {
    const handleAuthSuccess = async (event: any) => {
      const eventStart = '🔔 [HANDLER] ================== СОБЫТИЕ telegramAuthSuccess ПОЛУЧЕНО ==================';
      console.log(eventStart);
      sendLogToServer(eventStart);

      const timeMsg = `🔔 [HANDLER] Время получения события: ${new Date().toISOString()}`;
      console.log(timeMsg);
      sendLogToServer(timeMsg);

      const typeMsg = `🔔 [HANDLER] Тип события: ${event.type}`;
      console.log(typeMsg);
      sendLogToServer(typeMsg, { eventType: event.type });

      const detailMsg = `🔔 [HANDLER] Детали события: ${JSON.stringify(event.detail, null, 2)}`;
      console.log(detailMsg);
      sendLogToServer('Event detail received', { detail: event.detail });

      const isCustomMsg = `🔔 [HANDLER] Is CustomEvent: ${event instanceof CustomEvent}`;
      console.log(isCustomMsg);
      sendLogToServer(isCustomMsg, { isCustomEvent: event instanceof CustomEvent });

      const user = event.detail;
      console.log('🔔 [HANDLER] Переменная user:', user);
      console.log('🔔 [HANDLER] Тип user:', typeof user);
      console.log('🔔 [HANDLER] User keys:', user ? Object.keys(user) : 'N/A');
      sendLogToServer('User data in handler', {
        user,
        userType: typeof user,
        userKeys: user ? Object.keys(user) : 'N/A'
      });

      setIsLoading(true);
      setError('');

      console.log('🔔 [HANDLER] Устанавливаем isLoading = true');

      try {
        console.log('🔔 [HANDLER] >>> Вызываем login(user)...');
        console.log('🔔 [HANDLER] >>> Аргументы login():', user);
        console.log('🔔 [HANDLER] >>> Функция login:', login);

        // Таймаут для обнаружения зависания
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: login() не завершился за 30 секунд')), 30000);
        });

        await Promise.race([login(user), timeoutPromise]);
        console.log('🎉 [HANDLER] >>> login() завершён успешно!');

        // 🔄 IFRAME FIX: Отправляем данные авторизации в родительское окно
        console.log('🔔 [HANDLER] Проверяем iframe...');
        console.log('🔔 [HANDLER] window.parent:', window.parent);
        console.log('🔔 [HANDLER] window.parent === window:', window.parent === window);

        if (window.parent && window.parent !== window) {
          console.log('🟡 [IFRAME] Мы в iframe! Отправляем данные в родительское окно...');
          console.log('🟡 [IFRAME] Origin:', window.location.origin);
          console.log('🟡 [IFRAME] Parent origin:', window.parent.origin);
          console.log('🟡 [IFRAME] Отправляемые данные:', user);

          try {
            window.parent.postMessage({
              type: 'TELEGRAM_AUTH_SUCCESS',
              user: user
            }, window.location.origin);

            console.log('🟢 [IFRAME] ✅ postMessage отправлен успешно!');
            console.log('🔄 [IFRAME] Принудительно перезагружаем parent window...');
            window.parent.location.reload();
          } catch (postError) {
            console.error('🔴 [IFRAME] ❌ Ошибка при отправке postMessage:', postError);
          }
        } else {
          console.log('🟢 [NO IFRAME] Мы в обычном окне, не iframe');
          console.log('🔄 [NO IFRAME] Принудительно перезагружаем страницу...');
          window.location.reload();
        }
      } catch (err: any) {
        console.error('💥 [HANDLER] ================== ОШИБКА ==================');
        console.error('💥 [HANDLER] Error name:', err.name);
        console.error('💥 [HANDLER] Error message:', err.message);
        console.error('💥 [HANDLER] Error stack:', err.stack);
        console.error('💥 [HANDLER] Полный объект ошибки:', err);

        setError(err.message || 'Ошибка входа');
      } finally {
        console.log('🔔 [HANDLER] Устанавливаем isLoading = false');
        setIsLoading(false);
        console.log('🔔 [HANDLER] ✅ Обработчик события завершён');
      }
    };

    console.log('🔔 [HANDLER] Регистрируем обработчик события telegramAuthSuccess');
    window.addEventListener('telegramAuthSuccess', handleAuthSuccess);
    return () => {
      console.log('🔔 [HANDLER] Удаляем обработчик события telegramAuthSuccess');
      window.removeEventListener('telegramAuthSuccess', handleAuthSuccess);
    };
  }, [login]);

  // Функция отправки логов на сервер (для отладки через fly logs)
  const sendLogToServer = async (message: string, data?: any) => {
    try {
      await fetch('/api/debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          message,
          data: data ? JSON.stringify(data) : undefined,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.error('❌ Не удалось отправить лог на сервер:', error);
    }
  };

  // Функция загрузки виджета
  const loadTelegramWidget = () => {
    const container = document.getElementById('telegram-login-container');
    if (!container) {
      const errorMsg = '❌ [LOGINPAGE] Контейнер для виджета не найден!';
      console.error(errorMsg);
      sendLogToServer(errorMsg);
      return;
    }

    const initMsg = '📦 [LOGINPAGE] Загружаем Telegram Login Widget...';
    console.log(initMsg);
    sendLogToServer(initMsg);

    const callbackMsg = `🔍 [LOGINPAGE] Проверяем глобальный callback: ${typeof window.onTelegramAuth}`;
    console.log(callbackMsg);
    console.log('🔍 [LOGINPAGE] window.onTelegramAuth:', window.onTelegramAuth);
    sendLogToServer(callbackMsg, { callbackType: typeof window.onTelegramAuth });

    // Удаляем ВСЕ существующие скрипты виджета
    const existingScripts = document.querySelectorAll('script[src*="telegram-widget"]');
    existingScripts.forEach(script => {
      console.log('🗑️ [LOGINPAGE] Удаляем старый скрипт виджета');
      script.remove();
    });

    // Очищаем контейнер
    container.innerHTML = '';

    // Создаем script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'agent_vibecoder_bot');
    script.setAttribute('data-size', 'large');
    // Используем callback-based авторизацию
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'true');
    // Также добавляем auth-url как fallback (redirect-based)
    script.setAttribute('data-auth-url', window.location.origin + '/login');
    script.async = true;

    // Событие загрузки скрипта
    script.addEventListener('load', () => {
      console.log('✅ [LOGINPAGE] Скрипт виджета загружен успешно');
      console.log('✅ [LOGINPAGE] Проверяем callback после загрузки:', typeof window.onTelegramAuth);
      setWidgetLoaded(true);
    });

    // Событие ошибки загрузки
    script.addEventListener('error', (e) => {
      console.error('❌ [LOGINPAGE] Ошибка загрузки скрипта виджета:', e);
      setError('Ошибка загрузки виджета Telegram');
    });

    container.appendChild(script);
    console.log('✅ [LOGINPAGE] Скрипт добавлен в DOM');
  };

  // Загружаем виджет при монтировании (только один раз!)
  useEffect(() => {
    loadTelegramWidget();
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

          {/* Кнопка перезагрузки виджета (только если не загружен) */}
          {!widgetLoaded && (
            <div className="mt-4 text-center">
              <button
                onClick={loadTelegramWidget}
                className="text-sm text-yellow-500 hover:text-yellow-400 underline"
              >
                Перезагрузить виджет
              </button>
            </div>
          )}

          {/* Отладочная информация */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Callback: {typeof window.onTelegramAuth}</p>
            <p>Widget загружен: {widgetLoaded ? 'да' : 'нет'}</p>
          </div>


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

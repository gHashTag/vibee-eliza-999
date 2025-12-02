import { Application, Request, Response } from 'express';

/**
 * Регистрирует роуты для Telegram Login Widget
 */
export function registerTelegramAuthRoutes(app: Application) {
  // Handler для обработки Telegram Login Widget данных
  const handleTelegramLogin = async (req: Request, res: Response) => {
    console.log('=== [AUTH] Начало обработки запроса на логин ===');
    console.log('[AUTH] Request URL:', req.originalUrl);
    console.log('[AUTH] Request method:', req.method);
    console.log('[AUTH] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[AUTH] Request body:', JSON.stringify(req.body, null, 2));

    try {
      const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

      console.log('🔐 [AUTH] Получены данные от Telegram Login Widget:', {
        id,
        username,
        first_name,
        last_name,
        photo_url,
        auth_date,
        hash: hash ? 'присутствует' : 'отсутствует'
      });

      // Создаем простую сессию (для демо)
      const token = `telegram_${id}_${Date.now()}`;
      console.log('[AUTH] Сгенерирован токен:', token);

      const responsePayload = {
        success: true,
        user: {
          id,
          telegram_id: id,
          username,
          first_name,
          last_name,
          photo_url,
          is_premium: false,
          created_at: new Date(),
          last_login_at: new Date(),
          settings: {},
          usage_stats: {},
        },
        token
      };

      console.log('[AUTH] Отправляем ответ:', JSON.stringify(responsePayload, null, 2));
      console.log('[AUTH] HTTP Status: 200');

      res.status(200).json(responsePayload);

      console.log('✅ [AUTH] Ответ успешно отправлен');
      console.log('=== [AUTH] Конец обработки запроса на логин ===');
    } catch (error) {
      console.error('❌ [AUTH] Ошибка в обработчике логина:', error);
      console.error('[AUTH] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  };

  // Регистрируем оба endpoint для совместимости
  // POST /api/auth/telegram - используется compiled client (dist/)
  app.post('/api/auth/telegram', (req, res) => {
    console.log('📥 [ROUTE] Запрос на /api/auth/telegram');
    handleTelegramLogin(req, res);
  });

  // POST /api/auth/login - используется исходный код (src/)
  app.post('/api/auth/login', (req, res) => {
    console.log('📥 [ROUTE] Запрос на /api/auth/login');
    handleTelegramLogin(req, res);
  });

  // GET /api/auth/verify - проверяет токен
  app.get('/api/auth/verify', async (req: Request, res: Response) => {
    console.log('=== [VERIFY] Начало проверки токена ===');
    console.log('[VERIFY] Request headers:', JSON.stringify(req.headers, null, 2));

    try {
      const authHeader = req.headers.authorization;
      console.log('[VERIFY] Authorization header:', authHeader);

      if (!authHeader?.startsWith('Bearer ')) {
        console.log('[VERIFY] ❌ Токен не предоставлен или неверный формат');
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      console.log('[VERIFY] Извлечённый токен:', token);

      // Для демо просто проверяем, что токен начинается с telegram_
      if (!token.startsWith('telegram_')) {
        console.log('[VERIFY] ❌ Токен не начинается с telegram_');
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Извлекаем ID пользователя из токена
      const tokenParts = token.split('_');
      console.log('[VERIFY] Части токена:', tokenParts);

      const userId = parseInt(tokenParts[1]);
      console.log('[VERIFY] Извлечённый userId:', userId);

      if (isNaN(userId)) {
        console.log('[VERIFY] ❌ userId не является числом');
        return res.status(401).json({ error: 'Invalid token format' });
      }

      const userData = {
        id: userId,
        telegram_id: userId,
        username: null,
        first_name: 'Telegram User',
        last_name: null,
        photo_url: null,
        is_premium: false,
        created_at: new Date(),
        last_login_at: new Date(),
        settings: {},
        usage_stats: {},
      };

      console.log('[VERIFY] ✅ Возвращаем данные пользователя:', JSON.stringify(userData, null, 2));
      res.status(200).json(userData);

      console.log('=== [VERIFY] Конец проверки токена ===');
    } catch (error) {
      console.error('❌ [VERIFY] Ошибка:', error);
      console.error('[VERIFY] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  console.log('✅ [INIT] Зарегистрированы роуты: POST /api/auth/telegram, POST /api/auth/login, GET /api/auth/verify');
}

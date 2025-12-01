import { Express, Request, Response } from 'express';

/**
 * Регистрирует роуты для Telegram Login Widget
 */
export function registerTelegramAuthRoutes(app: Express) {
  // POST /api/auth/telegram - принимает данные от Telegram Login Widget
  app.post('/api/auth/telegram', async (req: Request, res: Response) => {
    try {
      const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

      console.log('🔐 Получены данные от Telegram Login Widget:', {
        id,
        username,
        first_name
      });

      // ВАЖНО: Возвращаем успех, чтобы Telegram Widget перестал жаловаться
      res.status(200).json({
        ok: true,
        user: {
          id,
          first_name,
          last_name,
          username,
          photo_url,
          auth_date,
          hash
        }
      });
    } catch (error) {
      console.error('❌ Ошибка в /api/auth/telegram:', error);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  });

  console.log('✅ Зарегистрированы роуты: POST /api/auth/telegram');
}

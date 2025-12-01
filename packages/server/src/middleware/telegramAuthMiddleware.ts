/**
 * Middleware для перехвата запросов Telegram Login Widget
 * Сохраняет данные пользователя в localStorage через cookie
 */

import { Request, Response, NextFunction } from 'express';

export function telegramAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Перехватываем только /api/auth/telegram
  if (req.path === '/api/auth/telegram' && req.method === 'POST') {
    console.log('🔐 Telegram auth request:', req.body);

    try {
      const userData = req.body;

      // Устанавливаем cookie с данными пользователя
      // (для демо - в реальном проекте нужна JWT аутентификация)
      res.cookie('telegram_user', JSON.stringify(userData), {
        httpOnly: false,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
      });

      // Возвращаем успех
      res.status(200).json({
        ok: true,
        user: userData
      });

      console.log('✅ Telegram auth successful:', userData);
    } catch (error) {
      console.error('❌ Telegram auth error:', error);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }

    return;
  }

  // Для остальных запросов - продолжаем
  next();
}

/**
 * Простой эндпоинт для Telegram Login Widget
 * Сохраняет данные пользователя в localStorage через cookie
 */

import { Request, Response } from 'express';

export async function telegramAuth(req: Request, res: Response) {
  try {
    // Получаем данные от Telegram Login Widget
    const userData = req.body;

    console.log('🔐 Получены данные от Telegram:', userData);

    // ВАЖНО: Для работы с Telegram Login Widget нужно вернуть 200
    res.status(200).json({
      ok: true,
      user: userData
    });
  } catch (error) {
    console.error('❌ Ошибка в telegramAuth:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}

import express from 'express';
import rateLimit from 'express-rate-limit';
import { TelegramAuthService } from '../../services/telegramAuthService';

const router = express.Router();
const telegramAuthService = new TelegramAuthService();

// Rate limiting для auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток авторизации
  message: 'Too many auth attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/telegram
 * Аутентификация через Telegram
 */
router.post('/telegram', authLimiter, async (req, res) => {
  try {
    const telegramData = req.body;

    // Верифицируем данные
    const verification = telegramAuthService.verifyTelegramAuth(telegramData);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.error || 'Invalid Telegram data'
      });
    }

    // Создаем/находим пользователя
    const user = await telegramAuthService.findOrCreateUser(telegramData);

    // Создаем JWT токен
    const token = telegramAuthService.createJWTToken(user);

    // Создаем сессию
    const session = await telegramAuthService.createUserSession(
      user.id,
      token,
      req.ip,
      req.get('user-agent')
    );

    res.json({
      success: true,
      token,
      user,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      }
    });
  } catch (error: any) {
    console.error('Telegram auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/verify
 * Проверка токена
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Проверяем JWT
    const verification = telegramAuthService.verifyJWTToken(token);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Проверяем сессию
    const session = await telegramAuthService.findSessionByToken(token);
    if (!session || session.expires_at < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    // Обновляем last_used_at
    await telegramAuthService.updateSessionLastUsed(session.id);

    res.json({
      success: true,
      user: {
        id: session.users.id,
        telegramId: session.users.telegram_id,
        username: session.users.username,
        firstName: session.users.first_name,
        lastName: session.users.last_name,
        photoUrl: session.users.photo_url,
        isPremium: (session.users as any).is_premium || false,
      }
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/logout
 * Выход из системы
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Находим и удаляем сессию
    const session = await telegramAuthService.findSessionByToken(token);
    if (session) {
      await telegramAuthService.deleteSession(session.id);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/me
 * Получить информацию о текущем пользователе
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const verification = telegramAuthService.verifyJWTToken(token);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const session = await telegramAuthService.findSessionByToken(token);
    if (!session || session.expires_at < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    res.json({
      success: true,
      user: {
        id: session.users.id,
        telegramId: session.users.telegram_id,
        username: session.users.username,
        firstName: session.users.first_name,
        lastName: session.users.last_name,
        photoUrl: session.users.photo_url,
        isPremium: (session.users as any).is_premium || false,
        createdAt: (session.users as any).created_at || new Date().toISOString(),
        lastLoginAt: (session.users as any).last_login_at || new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as authRouter };

import express from 'express';
import { eq, desc } from 'drizzle-orm';
import { TelegramAuthService } from '../../services/telegramAuthService';
import { InfisicalService } from '../../services/infisicalService';
import { db, secretAccessLogsTable } from '../../services/drizzle';

const router = express.Router();
const telegramAuthService = new TelegramAuthService();
const infisicalService = new InfisicalService();

// Тип для Request с пользователем
interface RequestWithUser extends express.Request {
  user?: {
    telegramId: number | string;
    userId: number;
  };
}

/**
 * Middleware для проверки аутентификации
 */
function authenticateToken(req: RequestWithUser, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
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
  telegramAuthService.findSessionByToken(token).then(session => {
    if (!session || session.expires_at < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    req.user = {
      telegramId: session.users.telegram_id,
      userId: session.user_id
    };

    next();
  }).catch(error => {
    console.error('Auth check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });
}

/**
 * GET /api/secrets
 * Получить список секретов пользователя
 */
router.get('/', authenticateToken, async (req: RequestWithUser, res: express.Response) => {
  try {
    const environment = req.query.env || 'dev';
    const telegramId = req.user!.telegramId.toString();

    const secrets = await infisicalService.getUserSecretPaths(telegramId, environment as string);

    // Логируем доступ
    await telegramAuthService.logSecretAccess(
      req.user!.userId,
      `users/${telegramId}`,
      'read',
      req.ip,
      req.get('user-agent')
    );

    res.json({
      success: true,
      secrets
    });
  } catch (error: any) {
    console.error('Get secrets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch secrets'
    });
  }
});

/**
 * GET /api/secrets/:secretName
 * Получить конкретный секрет
 */
router.get('/:secretName', authenticateToken, async (req: RequestWithUser, res: express.Response) => {
  try {
    const secretName = req.params.secretName;
    const environment = req.query.env || 'dev';
    const telegramId = req.user!.telegramId.toString();

    const value = await infisicalService.getUserSecret(telegramId, secretName, environment as string);

    // Логируем доступ
    await telegramAuthService.logSecretAccess(
      req.user!.userId,
      `users/${telegramId}/${secretName}`,
      'read',
      req.ip,
      req.get('user-agent')
    );

    res.json({
      success: true,
      value
    });
  } catch (error: any) {
    console.error('Get secret error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch secret'
    });
  }
});

/**
 * POST /api/secrets
 * Создать/обновить секрет
 */
router.post('/', authenticateToken, async (req: RequestWithUser, res: express.Response) => {
  try {
    const { secretName, secretValue, environment = 'dev' } = req.body;

    if (!secretName || !secretValue) {
      return res.status(400).json({
        success: false,
        error: 'secretName and secretValue are required'
      });
    }

    const telegramId = req.user!.telegramId.toString();
    const result = await infisicalService.setUserSecret(
      telegramId,
      secretName,
      secretValue,
      environment
    );

    // Логируем доступ
    await telegramAuthService.logSecretAccess(
      req.user!.userId,
      `users/${telegramId}/${secretName}`,
      'write',
      req.ip,
      req.get('user-agent')
    );

    res.json(result);
  } catch (error: any) {
    console.error('Set secret error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save secret'
    });
  }
});

/**
 * DELETE /api/secrets/:secretName
 * Удалить секрет
 */
router.delete('/:secretName', authenticateToken, async (req: RequestWithUser, res: express.Response) => {
  try {
    const secretName = req.params.secretName;
    const environment = req.query.env || 'dev';
    const telegramId = req.user!.telegramId.toString();

    const result = await infisicalService.deleteUserSecret(telegramId, secretName, environment as string);

    // Логируем доступ
    await telegramAuthService.logSecretAccess(
      req.user!.userId,
      `users/${telegramId}/${secretName}`,
      'delete',
      req.ip,
      req.get('user-agent')
    );

    res.json(result);
  } catch (error: any) {
    console.error('Delete secret error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete secret'
    });
  }
});

/**
 * GET /api/secrets/stats
 * Получить статистику секретов
 */
router.get('/stats', authenticateToken, async (req: RequestWithUser, res: express.Response) => {
  try {
    const telegramId = req.user!.telegramId.toString();

    // Получаем количество секретов
    const secrets = await infisicalService.getUserSecretPaths(telegramId);

    // Получаем последние логи доступа
    const recentLogs = await db
      .select()
      .from(secretAccessLogsTable)
      .where(eq(secretAccessLogsTable.user_id, req.user!.userId))
      .orderBy(desc(secretAccessLogsTable.created_at))
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalSecrets: secrets.length,
        recentAccess: recentLogs,
      }
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

export { router as secretsRouter };

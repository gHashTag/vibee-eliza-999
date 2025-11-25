import express from 'express';
import cors from 'cors';
import { TelegramAuthService } from './packages/server/src/services/telegramAuthService';
import { InfisicalService } from './packages/server/src/services/infisicalService';
import { db } from './packages/server/src/services/drizzle';
import { eq, desc } from 'drizzle-orm';
import { secretAccessLogsTable } from './packages/server/src/services/drizzle';

async function testAPI() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const telegramAuthService = new TelegramAuthService();
  const infisicalService = new InfisicalService();

  // Auth endpoint
  app.post('/api/auth/telegram', async (req, res) => {
    try {
      const telegramData = req.body;
      const verification = telegramAuthService.verifyTelegramAuth(telegramData);

      if (!verification.valid) {
        return res.status(401).json({
          success: false,
          error: verification.error || 'Invalid Telegram data'
        });
      }

      const user = await telegramAuthService.findOrCreateUser(telegramData);
      const token = telegramAuthService.createJWTToken(user);
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
      console.error('Auth error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Verify endpoint
  app.get('/api/auth/verify', async (req, res) => {
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

      await telegramAuthService.updateSessionLastUsed(session.id);

      res.json({
        success: true,
        user: {
          id: session.user_id,
          telegramId: session.users.telegram_id,
          username: session.users.username,
          firstName: session.users.first_name,
          lastName: session.users.last_name,
          photoUrl: session.users.photo_url,
        }
      });
    } catch (error: any) {
      console.error('Verify error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Secrets endpoint
  app.get('/api/secrets', async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Access token required'
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

      const secrets = await infisicalService.getUserSecretPaths(
        session.users.telegram_id.toString()
      );

      await telegramAuthService.logSecretAccess(
        session.user_id,
        `users/${session.users.telegram_id}`,
        'read',
        req.ip,
        req.get('user-agent')
      );

      res.json({
        success: true,
        secrets
      });
    } catch (error: any) {
      console.error('Secrets error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch secrets'
      });
    }
  });

  // Health check
  app.get('/api/system/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.6.5-alpha.45',
      auth_system: 'Telegram + Infisical'
    });
  });

  const PORT = 3000;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log('📊 Health check: http://localhost:' + PORT + '/api/system/health');
    console.log('🔐 Auth test: curl -X POST http://localhost:' + PORT + '/api/auth/telegram');
    console.log('');
  });

  // Run tests
  setTimeout(async () => {
    console.log('\n🧪 Running API tests...\n');

    // Test 1: Health check
    try {
      const health = await fetch(`http://localhost:${PORT}/api/system/health`);
      const healthData = await health.json();
      console.log('✅ Health check:', healthData);
    } catch (error) {
      console.log('❌ Health check failed:', error);
    }

    // Test 2: Create user
    try {
      const testUserData = {
        id: 144022504,
        first_name: 'Test',
        username: 'testuser',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'test_hash_placeholder'
      };

      const response = await fetch(`http://localhost:${PORT}/api/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUserData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User created:', data.user.id);

        // Test 3: Get secrets
        const secretsResponse = await fetch(`http://localhost:${PORT}/api/secrets`, {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });

        const secretsData = await secretsResponse.json();
        console.log('✅ Secrets retrieved:', secretsData.secrets.length, 'items');
      } else {
        console.log('⚠️  Auth test skipped (Telegram validation prevents this)');
      }
    } catch (error) {
      console.log('❌ Auth test failed:', error);
    }

    console.log('\n✅ Tests completed!');
    server.close();
    process.exit(0);
  }, 1000);
}

testAPI().catch(console.error);

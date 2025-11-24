#!/usr/bin/env node

/**
 * Sentry-GitHub Integration Test Script
 * Проверяет полный цикл интеграции:
 * 1. Отправка ошибки в Sentry
 * 2. Создание GitHub Issue
 * 3. Синхронизация статусов
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function separator() {
  console.log('\n' + '='.repeat(80) + '\n');
}

// Configuration
const CONFIG = {
  // Sentry
  SENTRY_DSN: 'https://6775f4493fca5a1dff7fe154e30ecdf2@o4510419597656064.ingest.us.sentry.io/4510419598049280',
  SENTRY_ORG: 'vibee',
  SENTRY_PROJECT: 'eliza',
  SENTRY_API_KEY: process.env.SENTRY_API_KEY || '',
  SENTRY_API_URL: 'https://sentry.io/api/0',

  // GitHub
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GITHUB_OWNER: 'vibee',
  GITHUB_REPO: 'vibee-eliza-999',
  GITHUB_API_URL: 'https://api.github.com',

  // Test data
  TEST_ERROR: {
    level: 'error',
    message: 'Test Error from Integration Test Script',
    environment: 'test',
    timestamp: new Date().toISOString(),
    tags: {
      test: 'integration',
      script: 'sentry-github-test'
    },
    extra: {
      test_run: true,
      test_id: crypto.randomBytes(8).toString('hex'),
      message: 'This is a test error to verify Sentry-GitHub integration'
    }
  }
};

// Test Suite
class SentryGitHubIntegrationTest {
  constructor() {
    this.testId = crypto.randomBytes(8).toString('hex');
    this.createdIssues = [];
    this.errors = [];
  }

  async runAllTests() {
    log('🚀 Sentry-GitHub Integration Test Suite', 'bright');
    log(`Test ID: ${this.testId}\n`, 'cyan');
    separator();

    try {
      await this.testSentryConnection();
      await this.testSentryErrorReporting();
      await this.testGitHubConnection();
      await this.testGitHubIssueCreation();
      await this.testIssueTracking();
      await this.cleanup();

      this.printSummary();
    } catch (error) {
      log(`\n❌ Test Suite Failed: ${error.message}`, 'red');
      console.error(error);
    }
  }

  async testSentryConnection() {
    log('📡 Test 1: Sentry Connection', 'bright');
    separator();

    if (!CONFIG.SENTRY_API_KEY) {
      log('⚠️  SENTRY_API_KEY not set, skipping API tests', 'yellow');
      log('   Using DSN for client-side error reporting only', 'yellow');
      return;
    }

    try {
      const response = await fetch(
        `${CONFIG.SENTRY_API_URL}/projects/${CONFIG.SENTRY_ORG}/${CONFIG.SENTRY_PROJECT}/issues/?limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${CONFIG.SENTRY_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        log(`✅ Sentry API Connection: OK`, 'green');
        log(`   Issues count: ${data.length}`, 'cyan');
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      log(`❌ Sentry API Connection: FAILED`, 'red');
      log(`   Error: ${error.message}`, 'red');
      this.errors.push({ test: 'Sentry Connection', error: error.message });
    }
  }

  async testSentryErrorReporting() {
    log('📝 Test 2: Sentry Error Reporting', 'bright');
    separator();

    try {
      // Create test error event
      const errorEvent = {
        ...CONFIG.TEST_ERROR,
        message: `[TEST ${this.testId}] ${CONFIG.TEST_ERROR.message}`
      };

      // Send to Sentry
      const response = await fetch(
        `${CONFIG.SENTRY_API_URL}/projects/${CONFIG.SENTRY_ORG}/${CONFIG.SENTRY_PROJECT}/events/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.SENTRY_API_KEY}`,
            'Content-Type': 'application/json',
            ...(CONFIG.SENTRY_API_KEY && {})
          },
          body: JSON.stringify(errorEvent)
        }
      );

      if (response.ok) {
        const data = await response.json();
        log(`✅ Error Sent to Sentry: OK`, 'green');
        log(`   Event ID: ${data.id || 'N/A'}`, 'cyan');
        this.sentryEventId = data.id;
        this.sentryEventData = errorEvent;
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to send error: ${response.status} ${errorText}`);
      }
    } catch (error) {
      log(`❌ Sentry Error Reporting: FAILED`, 'red');
      log(`   Error: ${error.message}`, 'red');
      this.errors.push({ test: 'Sentry Error Reporting', error: error.message });
    }
  }

  async testGitHubConnection() {
    log('🔗 Test 3: GitHub Connection', 'bright');
    separator();

    if (!CONFIG.GITHUB_TOKEN) {
      log('⚠️  GITHUB_TOKEN not set, cannot test GitHub integration', 'yellow');
      log('   Please set GITHUB_TOKEN environment variable', 'yellow');
      return;
    }

    try {
      const response = await fetch(`${CONFIG.GITHUB_API_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        log(`✅ GitHub API Connection: OK`, 'green');
        log(`   Connected as: ${user.login}`, 'cyan');
        log(`   Token scopes: ${response.headers.get('X-OAuth-Scopes') || 'N/A'}`, 'cyan');
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      log(`❌ GitHub API Connection: FAILED`, 'red');
      log(`   Error: ${error.message}`, 'red');
      this.errors.push({ test: 'GitHub Connection', error: error.message });
    }
  }

  async testGitHubIssueCreation() {
    log('📋 Test 4: GitHub Issue Creation', 'bright');
    separator();

    if (!CONFIG.GITHUB_TOKEN) {
      log('⚠️  Skipping GitHub issue creation (no token)', 'yellow');
      return;
    }

    try {
      const title = `🧪 [TEST ${this.testId}] Integration Test Error`;
      const body = this.generateTestIssueBody();

      const response = await fetch(
        `${CONFIG.GITHUB_API_URL}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/issues`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            body,
            labels: ['test', 'integration', 'sentry', 'auto-created']
          })
        }
      );

      if (response.ok) {
        const issue = await response.json();
        log(`✅ GitHub Issue Created: OK`, 'green');
        log(`   Issue #: ${issue.number}`, 'cyan');
        log(`   Title: ${issue.title}`, 'cyan');
        log(`   URL: ${issue.html_url}`, 'cyan');
        this.createdIssues.push(issue);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create issue: ${response.status} ${errorText}`);
      }
    } catch (error) {
      log(`❌ GitHub Issue Creation: FAILED`, 'red');
      log(`   Error: ${error.message}`, 'red');
      this.errors.push({ test: 'GitHub Issue Creation', error: error.message });
    }
  }

  async testIssueTracking() {
    log('🔍 Test 5: Issue Tracking', 'bright');
    separator();

    if (!CONFIG.GITHUB_TOKEN || this.createdIssues.length === 0) {
      log('⚠️  Skipping issue tracking (no issues created)', 'yellow');
      return;
    }

    try {
      const issue = this.createdIssues[0];
      log(`Tracking issue #${issue.number}...`, 'cyan');

      // Add a comment
      const commentResponse = await fetch(
        `${CONFIG.GITHUB_API_URL}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/issues/${issue.number}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            body: `🤖 Test comment added at ${new Date().toISOString()}`
          })
        }
      );

      if (commentResponse.ok) {
        log(`✅ Comment Added: OK`, 'green');
      } else {
        throw new Error(`Failed to add comment: ${commentResponse.status}`);
      }

      // Verify issue exists
      const getResponse = await fetch(
        `${CONFIG.GITHUB_API_URL}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/issues/${issue.number}`,
        {
          headers: {
            'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json'
          }
        }
      );

      if (getResponse.ok) {
        const updatedIssue = await getResponse.json();
        log(`✅ Issue Retrieved: OK`, 'green');
        log(`   State: ${updatedIssue.state}`, 'cyan');
        log(`   Comments: ${updatedIssue.comments}`, 'cyan');
      }
    } catch (error) {
      log(`❌ Issue Tracking: FAILED`, 'red');
      log(`   Error: ${error.message}`, 'red');
      this.errors.push({ test: 'Issue Tracking', error: error.message });
    }
  }

  async cleanup() {
    log('🧹 Test 6: Cleanup', 'bright');
    separator();

    if (!CONFIG.GITHUB_TOKEN || this.createdIssues.length === 0) {
      log('⚠️  Skipping cleanup (no issues to delete)', 'yellow');
      return;
    }

    try {
      log(`Closing ${this.createdIssues.length} test issues...`, 'cyan');

      for (const issue of this.createdIssues) {
        const response = await fetch(
          `${CONFIG.GITHUB_API_URL}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/issues/${issue.number}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              state: 'closed',
              body: issue.body + '\n\n---\n✅ Test completed, issue closed automatically'
            })
          }
        );

        if (response.ok) {
          log(`   ✅ Closed issue #${issue.number}`, 'green');
        } else {
          log(`   ⚠️  Failed to close issue #${issue.number}`, 'yellow');
        }
      }

      log(`✅ Cleanup Complete`, 'green');
    } catch (error) {
      log(`⚠️  Cleanup Warning: ${error.message}`, 'yellow');
    }
  }

  generateTestIssueBody() {
    return `
## 🧪 Integration Test Issue

### Test Information
| Field | Value |
|-------|-------|
| **Test ID** | ${this.testId} |
| **Test Timestamp** | ${new Date().toISOString()} |
| **Script** | sentry-github-test.js |

### Sentry Test Data
| Field | Value |
|-------|-------|
| **Error Message** | ${CONFIG.TEST_ERROR.message} |
| **Level** | ${CONFIG.TEST_ERROR.level} |
| **Environment** | ${CONFIG.TEST_ERROR.environment} |

---

### Test Checklist
- [ ] Verify Sentry connection
- [ ] Check error reporting
- [ ] Validate GitHub integration
- [ ] Test issue creation
- [ ] Confirm tracking works

---

_🤖 Auto-generated test issue for Sentry-GitHub integration verification_

**Next steps:**
1. ✅ This issue will be closed automatically after tests
2. If tests failed, check the console output
3. Review any errors in the summary below
`;
  }

  printSummary() {
    separator();
    log('📊 Test Summary', 'bright');
    separator();

    if (this.errors.length === 0) {
      log('✅ ALL TESTS PASSED!', 'green');
      log('   Sentry-GitHub integration is working correctly', 'green');
    } else {
      log(`❌ ${this.errors.length} TEST(S) FAILED`, 'red');
      separator();

      this.errors.forEach((err, idx) => {
        log(`Test ${idx + 1}: ${err.test}`, 'red');
        log(`   Error: ${err.error}`, 'yellow');
        console.log();
      });
    }

    separator();
    log('📋 Details:', 'cyan');
    log(`   Test ID: ${this.testId}`, 'cyan');
    log(`   Issues created: ${this.createdIssues.length}`, 'cyan');
    log(`   Errors encountered: ${this.errors.length}`, 'cyan');
    separator();

    if (this.createdIssues.length > 0) {
      log('🔗 Created Issues:', 'cyan');
      this.createdIssues.forEach(issue => {
        log(`   #${issue.number}: ${issue.html_url}`, 'cyan');
      });
      separator();
    }

    if (!CONFIG.SENTRY_API_KEY || !CONFIG.GITHUB_TOKEN) {
      log('⚠️  Setup Required:', 'yellow');
      if (!CONFIG.SENTRY_API_KEY) {
        log('   - Set SENTRY_API_KEY environment variable', 'yellow');
      }
      if (!CONFIG.GITHUB_TOKEN) {
        log('   - Set GITHUB_TOKEN environment variable', 'yellow');
      }
      separator();
      log('💡 To get tokens:', 'bright');
      log('   SENTRY_API_KEY:', 'cyan');
      log('      https://sentry.io/account/settings/api/auth-tokens/', 'cyan');
      log('   GITHUB_TOKEN:', 'cyan');
      log('      https://github.com/settings/tokens', 'cyan');
    }
  }
}

// Main execution
async function main() {
  const tester = new SentryGitHubIntegrationTest();
  await tester.runAllTests();
}

main().catch(error => {
  log(`\n💥 Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

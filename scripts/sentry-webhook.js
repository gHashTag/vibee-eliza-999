#!/usr/bin/env node

/**
 * Sentry Webhook Handler
 * Receives webhook events from Sentry and triggers GitHub Actions
 */

import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// Configuration
const {
  SENTRY_WEBHOOK_SECRET,
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_WORKFLOW_FILE = 'sentry-github-sync.yml'
} = process.env;

if (!SENTRY_WEBHOOK_SECRET) {
  console.error('❌ SENTRY_WEBHOOK_SECRET is required');
  process.exit(1);
}

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN is required');
  process.exit(1);
}

// Verify Sentry webhook signature
function verifySignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', SENTRY_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Handle different Sentry events
async function handleSentryEvent(event) {
  console.log('📦 Received Sentry event:', JSON.stringify(event, null, 2));

  const { action, data, actor } = event;

  switch (action) {
    case 'created':
      if (data.event) {
        await createGitHubIssue(data.event);
      }
      break;

    case 'resolved':
      if (data.issue) {
        await resolveGitHubIssue(data.issue);
      }
      break;

    default:
      console.log(`ℹ️ Unhandled action: ${action}`);
  }
}

// Create GitHub Issue from Sentry event
async function createGitHubIssue(sentryEvent) {
  try {
    const title = sentryEvent.title || sentryEvent.message || 'Unknown Error';
    const level = sentryEvent.level || 'error';
    const errorId = sentryEvent.eventID || sentryEvent.id;
    const environment = sentryEvent.environment || 'unknown';
    const firstSeen = sentryEvent.firstSeen || new Date().toISOString();

    // Check if issue already exists
    const existingIssue = await findExistingIssue(errorId);
    if (existingIssue) {
      console.log(`✅ Issue already exists: #${existingIssue.number}`);
      await updateExistingIssue(existingIssue.number, sentryEvent);
      return;
    }

    // Create new issue
    const formattedTitle = getFormattedTitle(title, level);
    const body = generateIssueBody(sentryEvent);

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formattedTitle,
          body,
          labels: getLabelsForLevel(level)
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${error}`);
    }

    const issue = await response.json();
    console.log(`✅ Created GitHub issue: #${issue.number} - ${issue.html_url}`);

    // Add initial comment
    await addIssueComment(issue.number, generateWelcomeComment());

  } catch (error) {
    console.error('❌ Error creating GitHub issue:', error);
    throw error;
  }
}

// Find existing GitHub issue by Sentry ID
async function findExistingIssue(sentryId) {
  const response = await fetch(
    `https://api.github.com/search/issues?q=Sentry ID: ${sentryId}+repo:${GITHUB_OWNER}/${GITHUB_REPO}+state:open`,
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
      }
    }
  );

  if (response.ok) {
    const data = await response.json();
    return data.items?.[0] || null;
  }

  return null;
}

// Update existing GitHub issue
async function updateExistingIssue(issueNumber, sentryEvent) {
  const comment = `🔄 **Sentry Event Update**

  - **Level:** ${sentryEvent.level}
  - **Environment:** ${sentryEvent.environment}
  - **Time:** ${new Date().toISOString()}

  [View in Sentry](https://sentry.io/organizations/vibee/issues/${sentryEvent.eventID}/)

  _Auto-generated update_`;

  await addIssueComment(issueNumber, comment);
}

// Add comment to GitHub issue
async function addIssueComment(issueNumber, body) {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body })
    }
  );

  if (!response.ok) {
    console.error('Failed to add comment:', await response.text());
  }
}

// Resolve GitHub issue when Sentry issue is resolved
async function resolveGitHubIssue(sentryIssue) {
  const existingIssue = await findExistingIssue(sentryIssue.id);
  if (existingIssue) {
    console.log(`🔄 Closing GitHub issue #${existingIssue.number}`);

    await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${existingIssue.number}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          state: 'closed',
          body: existingIssue.body + '\n\n---\n✅ **Marked as resolved in Sentry**'
        })
      }
    );
  }
}

// Helper functions
function getFormattedTitle(title, level) {
  const prefixes = {
    fatal: '💥',
    error: '🚨',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return `${prefixes[level] || 'ℹ️'} ${title}`;
}

function generateIssueBody(sentryEvent) {
  return `
## 🚨 Sentry Error Alert

### 📋 Error Information
| Field | Value |
|-------|-------|
| **Sentry ID** | ${sentryEvent.eventID || sentryEvent.id} |
| **Level** | ${sentryEvent.level} |
| **Environment** | ${sentryEvent.environment} |
| **Logger** | ${sentryEvent.logger || 'unknown'} |
| **First Seen** | ${sentryEvent.firstSeen || 'N/A'} |
| **Last Seen** | ${sentryEvent.lastSeen || 'N/A'} |

${sentryEvent.exception ? `
### 📊 Exception Details
\`\`\`
${sentryEvent.exception.values?.[0]?.type || 'Unknown'}: ${sentryEvent.exception.values?.[0]?.value || 'No details'}
\`\`\`
` : ''}

---

### 🎯 Actions Required
- [ ] 🔍 Investigate error in Sentry
- [ ] 🔎 Identify root cause
- [ ] 🛠️ Implement fix
- [ ] ✅ Test fix in staging
- [ ] 🚀 Deploy to production
- [ ] 📝 Update this issue with resolution details

---

### 🔗 Useful Links
- [View in Sentry](https://sentry.io/organizations/vibee/issues/${sentryEvent.eventID || sentryEvent.id}/)
- [Sentry Dashboard](https://sentry.io/organizations/vibee/projects/eliza/)
- [Sentry Performance](https://sentry.io/organizations/vibee/performance/)

---

_🤖 Auto-generated by Sentry-GitHub Sync Webhook_
`;
}

function generateWelcomeComment() {
  return `🤖 **Issue created automatically from Sentry error**

This issue was automatically generated because a new error was detected in Sentry.

**Next steps:**
1. Click the Sentry link above to investigate the error
2. Check the stack trace and identify the root cause
3. Implement a fix
4. Test the fix thoroughly
5. Close this issue when the fix is deployed

**For help:**
- Check the error timeline in Sentry
- Review recent deployments
- Look at related errors for patterns
- Use the search functionality to find similar issues

_Please keep this issue updated with your progress_`;
}

function getLabelsForLevel(level) {
  const labels = ['bug', 'sentry', 'auto-created'];

  switch (level) {
    case 'fatal':
      labels.push('priority-critical', 'fatal');
      break;
    case 'error':
      labels.push('priority-high', 'error');
      break;
    case 'warning':
      labels.push('priority-medium', 'warning');
      break;
    default:
      labels.push('info');
  }

  return labels;
}

// Main webhook handler
app.post('/webhook/sentry', async (req, res) => {
  try {
    const signature = req.headers['sentry-hook-signature'];
    const timestamp = req.headers['sentry-hook-timestamp'];

    if (!signature) {
      console.error('❌ Missing signature header');
      return res.status(401).send('Unauthorized');
    }

    // Verify signature
    if (!verifySignature(req.body, signature)) {
      console.error('❌ Invalid signature');
      return res.status(401).send('Unauthorized');
    }

    console.log(`✅ Verified webhook signature (timestamp: ${timestamp})`);

    // Handle the event
    await handleSentryEvent(req.body);

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sentry webhook handler running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook/sentry`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

export default app;

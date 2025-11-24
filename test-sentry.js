// Test file to verify Sentry integration
// This snippet contains an intentional error and can be used as a test to make sure that everything's working as expected.

import Sentry from "./instrument.js";

async function testSentry() {
  try {
    console.log('🧪 Testing Sentry integration...');

    // Capture a test exception
    Sentry.captureException(new Error('Test error for Sentry integration'));

    // Add a test breadcrumb
    Sentry.addBreadcrumb({
      message: 'Test breadcrumb',
      category: 'test',
      level: 'info',
    });

    // Flush the queue and send to Sentry
    await Sentry.flush(5000); // Wait up to 5 seconds

    console.log('✅ Test event sent to Sentry successfully!');
    console.log('📊 Check your Sentry dashboard for the test event.');
    console.log('🔗 https://sentry.io/organizations/vibee/issues');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending test event:', error);
    process.exit(1);
  }
}

testSentry();

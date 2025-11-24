// Type declaration for Sentry instrument.js module
declare module '*../../../instrument.js' {
  import * as SentryModule from '@sentry/node';
  const Sentry: typeof SentryModule;
  export default Sentry;
}

// Additional wildcard to catch any relative path to instrument.js
declare module '*/instrument.js' {
  import * as SentryModule from '@sentry/node';
  const Sentry: typeof SentryModule;
  export default Sentry;
}

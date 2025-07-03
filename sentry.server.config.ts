// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://efd4ea1352dfd5e8d8209d07f63492f6@o4509591348772864.ingest.us.sentry.io/4509591348903936",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable debug mode in development only
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Server-specific configuration
  integrations: [
    // Add server-specific integrations here if needed
  ],

  // Filter out noise in development
  beforeSend(event, hint) {
    // Skip certain error types in development
    if (process.env.NODE_ENV === 'development') {
      // Don't report ECONNRESET and similar network errors during development
      if (event.exception?.values?.[0]?.type === 'Error' && 
          event.exception?.values?.[0]?.value?.includes('ECONNRESET')) {
        return null;
      }
    }
    return event;
  },
});

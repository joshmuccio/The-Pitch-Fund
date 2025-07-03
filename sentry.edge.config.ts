// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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

  // Edge runtime specific configuration
  integrations: [
    // Edge runtime has limited integrations available
    Sentry.winterCGFetchIntegration(),
  ],

  // Filter out noise in development  
  beforeSend(event, hint) {
    // Skip certain error types in development
    if (process.env.NODE_ENV === 'development') {
      // Don't report initialization messages as errors
      if (event.message?.includes('Edge') && event.message?.includes('initialized')) {
        return null;
      }
    }
    return event;
  },
});

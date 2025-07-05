import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Modern Sentry v8+ server-side initialization
    Sentry.init({
      dsn: process.env.SENTRY_DSN || "https://efd4ea1352dfd5e8d8209d07f63492f6@o4509591348772864.ingest.us.sentry.io/4509591348903936",

      // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Enable debug mode in development only
      debug: process.env.NODE_ENV === 'development',

      // Environment
      environment: process.env.NODE_ENV || 'development',

      // Server-specific configuration with enhanced integrations
      integrations: [
        // OpenTelemetry-powered integrations (automatic with v8+)
        // httpIntegration, nativeNodeFetchIntegration, etc. are included by default
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
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Modern Sentry v8+ edge runtime initialization
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
  }
}

export const onRequestError = Sentry.captureRequestError;

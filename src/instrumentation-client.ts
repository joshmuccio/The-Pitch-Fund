// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://efd4ea1352dfd5e8d8209d07f63492f6@o4509591348772864.ingest.us.sentry.io/4509591348903936",

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Capture console logs, network activity, DOM changes
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing in development
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions in production, 100% in development
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture Replay for 100% of sessions with an error
  replaysOnErrorSampleRate: 1.0,

  // Enable debug mode in development only
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Automatically capture errors from React error boundaries
  beforeSend(event, hint) {
    // Filter out errors in development that aren't actionable
    if (process.env.NODE_ENV === 'development') {
      // Don't report errors from browser extensions
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('extension://') || frame.filename?.includes('moz-extension://')
      )) {
        return null;
      }
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart; 
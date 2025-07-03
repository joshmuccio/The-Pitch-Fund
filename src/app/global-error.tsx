"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture the error with additional context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
        section: 'root_layout',
      },
      contexts: {
        error_boundary: {
          name: 'GlobalError',
          digest: error.digest,
          componentStack: 'root layout',
        },
      },
      level: 'error',
    });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ 
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '2rem auto',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            Something went wrong!
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            We've been notified of this error and will work to fix it.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '1rem',
              marginRight: '1rem'
            }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Go home
          </button>
        </div>
        {/* Fallback to Next.js default error page */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
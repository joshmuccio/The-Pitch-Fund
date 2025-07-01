import { ImageResponse } from '@vercel/og';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'edge';              // run the handler at the Edge
export const contentType = 'image/png';     // optional, but explicit
export const revalidate = 3600;             // cache for 1 hour (3600 seconds)

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge OG API initialized"));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // ?title=... in the URL – fallback to a default headline
  const title = searchParams.get('title') ?? 'Backing founders you hear on The Pitch';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg,#FFE6AC 0%,#FDD35E 40%,#F4B323 100%)',
        }}
      >
        <h1
          style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: -2,
            color: '#ffffff',
            padding: '0 72px',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {title}
        </h1>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
} 
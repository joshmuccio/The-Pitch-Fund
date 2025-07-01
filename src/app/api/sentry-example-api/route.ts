import * as Sentry from '@sentry/nextjs';
import { NextResponse } from "next/server";

// Edge Runtime for global Sentry error testing
export const runtime = 'edge';
export const dynamic = "force-dynamic";

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge Sentry example API initialized"));

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}
// A faulty API route to test Sentry's error monitoring
export function GET() {
  throw new SentryExampleAPIError("This error is raised on the backend called by the example page.");
  return NextResponse.json({ data: "Testing Sentry Error..." });
}

// app/api/dev-log/route.ts
// -------------  Node runtime so Chalk works -------------
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import chalk from 'chalk';

// Map log levels coming from loglevel-plugin-remote → colours
const COLOURS: Record<string, any> = {
  TRACE: chalk.gray,
  DEBUG: chalk.gray,
  INFO:  chalk.cyan,
  WARN:  chalk.yellow,
  ERROR: chalk.redBright,
};

type BrowserPayload = {
  level: string;              // "INFO" | "WARN" | ...
  ts: number;                 // epoch ms from the client
  sid: string;                // sessionId we added in logger.ts
  url?: string;               // current pathname (nice for context)
  name?: string;              // optional logger name
  msgs: unknown[];            // arguments originally passed to console.log
};

// Helper function to safely format timestamp
const formatTimestamp = (ts: number): string => {
  try {
    if (!ts || typeof ts !== 'number' || !isFinite(ts)) {
      // Fallback to current time if timestamp is invalid
      return new Date().toISOString().slice(11, 19);
    }
    return new Date(ts).toISOString().slice(11, 19);
  } catch (error) {
    // Fallback to current time if anything goes wrong
    return new Date().toISOString().slice(11, 19);
  }
};

// Helper function to safely get log level
const getSafeLevel = (level: any): string => {
  if (typeof level === 'string' && level.trim()) {
    return level.trim().toUpperCase();
  }
  return 'INFO'; // Default fallback
};

// Helper function to safely get console method
const getConsoleMethod = (level: string): 'info' | 'warn' | 'error' => {
  const lowerLevel = level.toLowerCase();
  if (lowerLevel === 'error') return 'error';
  if (lowerLevel === 'warn') return 'warn';
  return 'info'; // Default for trace, debug, info, and unknown levels
};

export async function POST(req: NextRequest) {
  try {
    // Check if request has content
    const contentLength = req.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      console.warn('🔍 [DEV-LOG] Empty request body');
      return new NextResponse(null, { status: 204 });
    }

    let body: BrowserPayload | BrowserPayload[];
    try {
      body = (await req.json()) as BrowserPayload | BrowserPayload[];
    } catch (parseError) {
      console.error('🔍 [DEV-LOG] JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Handle the loglevel-plugin-remote format which sends { logs: [...] }
    let batch: BrowserPayload[];
    if (body && typeof body === 'object' && 'logs' in body) {
      // loglevel-plugin-remote sends { logs: [...] }
      batch = (body as any).logs;
    } else if (Array.isArray(body)) {
      // Direct array of payloads
      batch = body;
    } else {
      // Single payload
      batch = [body as BrowserPayload];
    }

    batch.forEach((payload, index) => {
      try {
        // Safely extract and validate all properties
        const level = getSafeLevel(payload?.level);
        const ts = payload?.ts || Date.now();
        const sid = payload?.sid || 'unknown';
        const url = payload?.url;
        const name = payload?.name;
        const msgs = payload?.msgs;

        const colour = COLOURS[level] ?? chalk.white;
        const timestamp = formatTimestamp(ts);
        const prefix = chalk.dim(`[${timestamp}  ${sid.slice(0, 8)}]`);

        // Build left-aligned label like "parseFounderDiligence"
        const label = name ? chalk.bold(name.padEnd(20)) : '';

        // Safely handle msgs array - check if it exists and has content
        const safeMessages = Array.isArray(msgs) ? msgs : [];
        const head = safeMessages.length > 0 && typeof safeMessages[0] === 'string' 
          ? colour(safeMessages[0] as string) 
          : safeMessages[0] || '';

        const rest = safeMessages.slice(1);

        const consoleMethod = getConsoleMethod(level);

        // Log the formatted message
        console[consoleMethod](
          prefix,
          label,
          head,
          ...rest,
          url ? chalk.magenta(`(${url})`) : ''
        );
      } catch (itemError) {
        // Log individual item errors but continue processing other items
        console.error('Error processing individual log item:', itemError, payload);
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error processing dev-log request:', error);
    return NextResponse.json({ error: 'Failed to process logs' }, { status: 500 });
  }
}
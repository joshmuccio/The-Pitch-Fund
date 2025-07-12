// Browser-only logger - completely lazy loaded with zero side effects
let logInstance: any = null;
let isInitialized = false;

// Safe initialization that only happens when needed
const initializeLogger = () => {
  if (typeof window === 'undefined') {
    // Server-side: return no-op logger immediately
    return {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
      trace: () => {},
    };
  }

  if (isInitialized && logInstance) {
    return logInstance;
  }

  try {
    // Only run this code in browser
    if (typeof window === 'undefined') {
      throw new Error('Server-side execution blocked');
    }

    // Dynamic imports to prevent server-side loading
    const loglevel = require('loglevel');
    const prefix = require('loglevel-plugin-prefix');

    const LOGGER_KEY = '__thePitchFundLoggerInitialized_v8';
    
    // Clear any existing logger instances to force re-initialization
    if (typeof window !== 'undefined') {
      // Clear all previous logger keys
      delete (window as any)['__thePitchFundLoggerInitialized'];
      delete (window as any)['__thePitchFundLoggerInitialized_v2'];
      delete (window as any)['__thePitchFundLoggerInitialized_v3'];
      delete (window as any)['__thePitchFundLoggerInitialized_v4'];
      delete (window as any)['__thePitchFundLoggerInitialized_v5'];
      delete (window as any)['__thePitchFundLoggerInitialized_v6'];
      delete (window as any)['__thePitchFundLoggerInitialized_v7'];
      
      // Reset our module-level state
      logInstance = null;
      isInitialized = false;
    }

    if (!(window as any)[LOGGER_KEY]) {
      (window as any)[LOGGER_KEY] = true;

      // 1️⃣  Give every browser session a short uid so we can group logs
      const sessionId = crypto.randomUUID();

      // Helper function to safely convert level to string
      const getLevelString = (level: any): string => {
        if (typeof level === 'string') {
          return level.toUpperCase();
        }
        if (typeof level === 'number') {
          // Map loglevel numeric levels to strings
          const levelMap: { [key: number]: string } = {
            0: 'TRACE',
            1: 'DEBUG', 
            2: 'INFO',
            3: 'WARN',
            4: 'ERROR',
            5: 'SILENT'
          };
          return levelMap[level] || 'UNKNOWN';
        }
        // Handle object levels (loglevel sometimes passes objects)
        if (level && typeof level === 'object') {
          // Check if it has a level property
          if (level.level !== undefined) {
            return getLevelString(level.level);
          }
          // Check if it has a toString method that returns something useful
          if (typeof level.toString === 'function') {
            const str = level.toString();
            if (str !== '[object Object]') {
              return str.toUpperCase();
            }
          }
          // Check common level object properties
          if (level.name) return level.name.toUpperCase();
          if (level.levelName) return level.levelName.toUpperCase();
        }
        return 'INFO'; // Fallback to INFO instead of converting to string
      };

      // Helper function to safely convert timestamp to valid Date
      const getTimestamp = (timestamp: any): Date => {
        try {
          let date: Date;
          
          if (timestamp instanceof Date) {
            date = timestamp;
          } else if (typeof timestamp === 'number') {
            date = new Date(timestamp);
          } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
          } else {
            // Fallback to current time for any other type
            return new Date();
          }
          
          // Check if the date is valid
          if (isNaN(date.getTime())) {
            // If invalid, return current time
            return new Date();
          }
          
          return date;
        } catch (error) {
          // Fallback to current time if anything goes wrong
          return new Date();
        }
      };

      // 2️⃣  Prefix messages in the *browser* console (optional prettiness)
      prefix.reg(loglevel);
      loglevel.setLevel('info');
      prefix.apply(loglevel, {
        format(level: any, name: string | undefined, timestamp: any) {
          const levelStr = getLevelString(level);
          const ts = getTimestamp(timestamp);
          return `[${ts.toISOString().slice(11, 19)} ${levelStr}]`;
        },
      });

      // 3️⃣  Create custom remote logging to avoid loglevel-plugin-remote retry issues
      const originalMethods = {
        trace: loglevel.trace,
        debug: loglevel.debug,
        info: loglevel.info,
        warn: loglevel.warn,
        error: loglevel.error,
      };

      // Override each method to send to our API
      Object.keys(originalMethods).forEach(level => {
        const originalMethod = (originalMethods as any)[level];
        (loglevel as any)[level] = (...args: any[]) => {
          // Call original method for browser console
          originalMethod.apply(loglevel, args);
          
          // Send to our API (fire and forget, no retries)
          const message = args.map(arg => 
            typeof arg === 'string' ? arg : 
            typeof arg === 'object' ? JSON.stringify(arg) : 
            String(arg)
          ).join(' ');

          // Send to server without retry logic
          fetch('/api/dev-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              logs: [{
                level: level.toUpperCase(),
                ts: Date.now(),
                sid: sessionId,
                url: window.location.pathname,
                name: 'browser',
                msgs: [message],
              }]
            })
          }).catch(() => {
            // Silently ignore fetch errors to prevent spam
          });
        };
      });
    }

    logInstance = loglevel;
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize logger:', error);
    // Fallback to no-op logger
    logInstance = {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
      trace: () => {},
    };
    isInitialized = true;
  }

  return logInstance;
};

// Create a proxy logger that initializes on first use
const logger = {
  info: (...args: any[]) => {
    if (typeof window === 'undefined') return; // Extra safety check
    return initializeLogger().info(...args);
  },
  warn: (...args: any[]) => {
    if (typeof window === 'undefined') return; // Extra safety check
    return initializeLogger().warn(...args);
  },
  error: (...args: any[]) => {
    if (typeof window === 'undefined') return; // Extra safety check
    return initializeLogger().error(...args);
  },
  debug: (...args: any[]) => {
    if (typeof window === 'undefined') return; // Extra safety check
    return initializeLogger().debug(...args);
  },
  trace: (...args: any[]) => {
    if (typeof window === 'undefined') return; // Extra safety check
    return initializeLogger().trace(...args);
  },
};

export default logger;

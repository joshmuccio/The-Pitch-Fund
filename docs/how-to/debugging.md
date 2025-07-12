# Debugging Guide

## Logging Methods

The project uses two different logging approaches for different purposes:

### Browser Console Logs (console.log)
**Use for:** Detailed development debugging, temporary logs, verbose output
**Shows in:** Browser DevTools Console only
**Examples:**
```typescript
console.log('🔧 [Component] Detailed state information:', state);
console.log('🔍 [Function] Processing data:', data);
```

### Terminal Logger (log.info, log.warn, etc.)
**Use for:** Important application events, user actions, errors, API calls
**Shows in:** Both browser console AND terminal with colored formatting
**Examples:**
```typescript
import log from '@/lib/logger';

log.info('[SubscribeForm] Email subscription successful');
log.warn('[API] Rate limit approaching');
log.error('[Auth] Login failed: Invalid credentials');
log.debug('[Database] Query executed in 45ms');
log.trace('[Performance] Function entry point');
```

## When to Use Each

### Use `console.log` for:
- ✅ Temporary debugging during development
- ✅ Verbose data inspection (large objects, arrays)
- ✅ Step-by-step function execution tracing
- ✅ Component state changes
- ✅ Quick debugging that will be removed

### Use `log.*()` for:
- ✅ User interactions (form submissions, clicks)
- ✅ API calls and responses
- ✅ Authentication events
- ✅ Error handling
- ✅ Performance monitoring
- ✅ Business logic events
- ✅ Production-ready logging

## Terminal Logger Features

The terminal logger provides:
- **Colored output** based on log level
- **Session tracking** with unique IDs
- **Timestamps** for each log entry
- **URL context** showing which page generated the log
- **Structured formatting** for easy reading

### Example Terminal Output
```
[01:42:32  2d3b56d0] browser  [SubscribeForm] Email subscription successful (/)
[01:42:33  2d3b56d0] browser  [API] Processing payment request (/checkout)
[01:42:34  2d3b56d0] browser  [Auth] User logged out (/dashboard)
```

## Best Practices

1. **Use descriptive prefixes** in square brackets: `[ComponentName]`, `[APIEndpoint]`, `[FeatureName]`
2. **Include context** like user IDs, email domains, or relevant data
3. **Choose appropriate log levels**:
   - `log.error()` - Errors that need attention
   - `log.warn()` - Warnings or unexpected conditions
   - `log.info()` - Normal application events
   - `log.debug()` - Detailed debugging information
   - `log.trace()` - Very detailed execution tracing
4. **Keep messages concise** but informative
5. **Remove temporary `console.log` statements** before committing

## Quick Reference

```typescript
// ❌ Won't show in terminal
console.log('User clicked button');

// ✅ Shows in both browser and terminal
log.info('[Button] User clicked submit button');

// ✅ Good formatting with context
log.warn(`[API] Rate limit exceeded for user: ${userId}`);
log.error(`[Payment] Transaction failed: ${error.message}`);
```

Remember: If you want to see it in the terminal for debugging, use `log.*()` methods! 
# Sentry Implementation Guide

This document outlines The Pitch Fund's Sentry error monitoring implementation following official best practices.

## 📋 **Configuration Overview**

Our Sentry setup follows the official Next.js documentation with production-ready optimizations:

### **Configuration Files**

| File | Purpose | Runtime |
|------|---------|---------|
| `src/instrumentation.ts` | **Modern unified initialization** | All runtimes |
| `src/instrumentation-client.ts` | Client-side error tracking | Browser |

**✅ Modern Sentry v8+ Pattern:**
- Single `instrumentation.ts` file with runtime-specific initialization
- Follows official Next.js documentation best practices
- OpenTelemetry-powered integrations included automatically
- Simplified configuration and better performance

### **Environment Variables**

```env
# Required for all environments
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional for build/deployment features
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

## 🎯 **Best Practices Implementation**

### **1. Production-Ready Sampling Rates**

```typescript
// Development: 100% tracing for debugging
// Production: 10% tracing for performance
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

// Session Replay: 10% in production, 100% in development
replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

// Error Replay: Always capture 100% of sessions with errors
replaysOnErrorSampleRate: 1.0,
```

### **2. Environment-Aware Debug Mode**

```typescript
// Only show debug information in development
debug: process.env.NODE_ENV === 'development',

// Set environment context
environment: process.env.NODE_ENV || 'development',
```

### **3. Error Filtering**

```typescript
beforeSend(event, hint) {
  // Filter out browser extension errors in development
  if (process.env.NODE_ENV === 'development') {
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
      frame => frame.filename?.includes('extension://') || frame.filename?.includes('moz-extension://')
    )) {
      return null;
    }
  }
  return event;
}
```

## 🔧 **Feature Integration**

### **Session Replay**

```typescript
integrations: [
  Sentry.replayIntegration({
    maskAllText: false,        // Capture text content
    blockAllMedia: false,      // Allow media capture
  }),
]
```

### **Edge Runtime Support**

```typescript
integrations: [
  Sentry.winterCGFetchIntegration(), // Fetch API monitoring
]
```

### **Next.js 15 Compatibility**

```typescript
// src/instrumentation.ts
export const onRequestError = Sentry.captureRequestError;
```

## 📊 **Error Tracking Patterns**

### **Form Validation Errors**

```typescript
Sentry.captureMessage('Admin form validation failed', {
  level: 'warning',
  tags: {
    component: 'CompanyManager',
    action: 'form_validation',
    error_type: 'validation_failed',
  },
  contexts: {
    validation: {
      company_name: companyData.name,
      error_count: Object.keys(validationErrors).length,
      error_fields: Object.keys(validationErrors),
    },
  },
});
```

### **Database Operation Errors**

```typescript
Sentry.captureException(error, {
  tags: {
    component: 'CompanyManager',
    operation: 'database_save',
    table: 'companies',
  },
  contexts: {
    operation: {
      company_name: companyData.name,
      operation_type: 'update',
      retry_count: 0,
    },
  },
});
```

### **Client-Side Error Boundary**

```typescript
Sentry.captureException(error, {
  tags: {
    errorBoundary: 'component',
    section: componentName,
  },
  contexts: {
    error_boundary: {
      name: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
      environment: process.env.NODE_ENV,
    },
  },
  level: 'error',
});
```

### **Network Request Errors**

```typescript
Sentry.captureException(error, {
  tags: {
    component: 'SubscribeForm',
    action: 'email_subscription',
    provider: 'beehiiv',
  },
  contexts: {
    subscription: {
      email_domain: email.split('@')[1],
      request_url: '/api/subscribe',
      http_status: error.response?.status,
    },
  },
});
```

## 🚀 **Performance Monitoring**

### **Route-Level Monitoring**

All API routes include Sentry initialization:

```typescript
import * as Sentry from '@sentry/nextjs';

// Edge runtime routes
export const runtime = 'edge';

// Initialize Sentry for the route
Sentry.captureException(new Error("Edge API initialized"));
```

### **Transaction Tracking**

- **87.5% of API routes** use edge runtime for optimal performance
- Router transitions automatically tracked
- Database operations monitored
- Form submissions traced

## 📈 **Dashboard Organization**

### **Error Grouping Strategy**

Errors are organized by:
- **Component** (`CompanyManager`, `SubscribeForm`, etc.)
- **Operation Type** (`form_validation`, `database_save`, `api_request`)
- **Environment** (`development`, `production`)
- **Error Boundary** (`global`, `component`, `route`)

### **Performance Insights**

- **Page Load Performance**: Client-side route monitoring
- **API Response Times**: Edge runtime performance tracking
- **Database Query Performance**: Operation-level monitoring
- **Form Interaction Analytics**: User experience metrics

## 🧪 **Testing & Validation**

### **Development Testing**

```bash
# Test Sentry error tracking
curl http://localhost:3001/api/sentry-example-api

# Test form validation errors
# Submit admin forms with invalid data

# Check console for Sentry debug information
npm run dev
```

### **Production Checklist**

- [ ] `SENTRY_DSN` environment variable configured
- [ ] `NEXT_PUBLIC_SENTRY_DSN` environment variable configured
- [ ] Source maps uploaded for better stack traces
- [ ] Release tracking enabled
- [ ] Performance monitoring active
- [ ] Session replay configured

## 🔗 **Integration with Next.js**

### **Build Configuration**

```javascript
// next.config.js
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(module.exports, {
  org: "the-pitch",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
```

### **Instrumentation Hook**

```javascript
// next.config.js
experimental: {
  instrumentationHook: true,
}
```

## 📚 **Additional Resources**

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Environment Variable Setup](../ENVIRONMENT_SETUP.md)
- [Edge Runtime Guide](./EDGE_RUNTIME_GUIDE.md)
- [Form Validation Guide](./FORM_VALIDATION_GUIDE.md)

## 🎯 **Summary**

Our Sentry implementation provides:
- **Comprehensive Error Tracking**: All application layers monitored
- **Production-Ready Configuration**: Optimized sampling rates and filtering
- **Detailed Context**: Rich error metadata for debugging
- **Performance Monitoring**: End-to-end application performance
- **User Experience Insights**: Session replay and interaction tracking 
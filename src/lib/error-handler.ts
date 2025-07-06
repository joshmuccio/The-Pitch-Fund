'use client';

// Global error handler for better monitoring
export class ErrorHandler {
  private static originalError = console.error;

  static init() {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.originalError('Unhandled promise rejection:', event.reason);
      this.reportError(event.reason, 'unhandledrejection');
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.originalError('Global error:', event.error);
      this.reportError(event.error, 'global');
    });

    // Handle console errors
    console.error = (...args) => {
      this.originalError.apply(console, args);
      this.reportError(args.join(' '), 'console');
    };
  }

  static reportError(error: any, type: string) {
    // In development, log to console using original console.error
    if (process.env.NODE_ENV === 'development') {
      this.originalError(`🚨 Error (${type}):`, error);
    }

    // In production, you can send to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Vercel's error tracking
      // You can integrate with services like Sentry, LogRocket, etc.
      this.sendToErrorService(error, type);
    }
  }

  private static sendToErrorService(error: any, type: string) {
    // This is where you'd integrate with your error reporting service
    // For now, we'll just log to console in production using original console.error
    this.originalError(`Production error (${type}):`, error);
    
    // Example integration with error reporting service:
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', 'exception', {
    //     description: error.message || error,
    //     fatal: false
    //   });
    // }
  }
}

// Error handler will be initialized by ErrorHandlerInit component 
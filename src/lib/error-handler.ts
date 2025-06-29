// Global error handler for better monitoring
export class ErrorHandler {
  static init() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.reportError(event.reason, 'unhandledrejection');
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.reportError(event.error, 'global');
    });

    // Handle console errors
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      this.reportError(args.join(' '), 'console');
    };
  }

  static reportError(error: any, type: string) {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error (${type})`);
      console.error(error);
      console.groupEnd();
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
    // For now, we'll just log to console in production
    console.error(`Production error (${type}):`, error);
    
    // Example integration with error reporting service:
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', 'exception', {
    //     description: error.message || error,
    //     fatal: false
    //   });
    // }
  }
}

// Initialize error handler when this module is imported
if (typeof window !== 'undefined') {
  ErrorHandler.init();
} 
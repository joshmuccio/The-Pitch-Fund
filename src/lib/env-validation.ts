/**
 * Environment Variable Validation
 * Validates that all required environment variables are present and properly formatted
 */

const requiredEnvVars = {
  // Sentry configuration
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Database configuration
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Application configuration
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
} as const;

const optionalEnvVars = {
  // Email integration (optional)
  BEEHIIV_API_KEY: process.env.BEEHIIV_API_KEY,
  BEEHIIV_PUBLICATION_ID: process.env.BEEHIIV_PUBLICATION_ID,
  
  // Sentry build/deployment (optional)
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
} as const;

/**
 * Validates that all required environment variables are present
 * Logs warnings for missing optional variables
 */
export function validateEnvironmentVariables() {
  const missing: string[] = [];
  const missingOptional: string[] = [];
  
  // Check required variables
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    }
  });
  
  // Check optional variables
  Object.entries(optionalEnvVars).forEach(([key, value]) => {
    if (!value) {
      missingOptional.push(key);
    }
  });
  
  // Report missing required variables
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease check your .env.local file and ENVIRONMENT_SETUP.md for configuration details.');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  // Report missing optional variables as warnings
  if (missingOptional.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Missing optional environment variables:');
    missingOptional.forEach(key => console.warn(`   - ${key}`));
    console.warn('\nSome features may not work without these variables.');
  }
  
  // Success message
  if (missing.length === 0) {
    console.log('✅ All required environment variables are configured');
  }
}

/**
 * Get validated environment variables with type safety
 */
export const env = {
  // Sentry
  SENTRY_DSN: process.env.SENTRY_DSN!,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN!,
  
  // Database
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  
  // Application
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL!,
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  
  // Optional
  BEEHIIV_API_KEY: process.env.BEEHIIV_API_KEY,
  BEEHIIV_PUBLICATION_ID: process.env.BEEHIIV_PUBLICATION_ID,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
} as const;

// Validate on import in development
if (process.env.NODE_ENV === 'development') {
  validateEnvironmentVariables();
} 
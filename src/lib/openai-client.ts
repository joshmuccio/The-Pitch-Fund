import OpenAI from 'openai'

// Create a singleton OpenAI client with proper configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Add timeout for requests (30 seconds)
  timeout: 30000,
  // Add retry configuration with exponential backoff
  maxRetries: 3,
})

// Types for better error handling
export interface AIGenerationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  rateLimitInfo?: {
    remainingRequests?: number
    remainingTokens?: number
    resetTime?: string
  }
}

// Enhanced error handling wrapper
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<AIGenerationResult<T>> {
  try {
    const result = await operation()
    return { success: true, data: result }
  } catch (error) {
    console.error(`Error in ${operationName}:`, error)

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      // Rate limit error (429)
      if (error.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again in a few moments.',
          rateLimitInfo: {
            resetTime: error.headers?.['x-ratelimit-reset-requests'] || 'unknown'
          }
        }
      }
      
      // Invalid API key (401)
      if (error.status === 401) {
        return {
          success: false,
          error: 'API authentication failed. Please check configuration.'
        }
      }
      
      // Content policy violation (400)
      if (error.status === 400) {
        return {
          success: false,
          error: 'Request was rejected. Please check your input content.'
        }
      }
      
      // Server errors (500+)
      if (error.status >= 500) {
        return {
          success: false,
          error: 'OpenAI service temporarily unavailable. Please try again.'
        }
      }
      
      // Other API errors
      return {
        success: false,
        error: `API error: ${error.message}`
      }
    }
    
    // Network or other errors
    return {
      success: false,
      error: `Service error: Failed to ${operationName.toLowerCase()}`
    }
  }
}

// Utility to validate API key on startup
export function validateOpenAIConfig(): boolean {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set')
    return false
  }
  
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error('❌ OPENAI_API_KEY appears to be invalid (should start with sk-)')
    return false
  }
  
  console.log('✅ OpenAI API key configuration validated')
  return true
} 
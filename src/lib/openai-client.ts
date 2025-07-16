import OpenAI from 'openai'
import * as Sentry from '@sentry/nextjs'

// Lazy-loaded OpenAI client to avoid build-time instantiation
let openaiInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      // Remove built-in retries - we'll handle this ourselves with proper exponential backoff
      maxRetries: 0,
    })
  }
  return openaiInstance
}

// Export for backward compatibility
export const openai = {
  get chat() {
    return getOpenAIClient().chat
  }
}

// Types for better error handling
export interface AIGenerationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  rateLimitInfo?: {
    remainingRequests?: number
    remainingTokens?: number
    resetTime?: string
    quotaExceeded?: boolean
    errorCode?: string
    errorType?: string
  }
}

// Exponential backoff configuration
interface RetryConfig {
  maxRetries: number
  baseDelay: number // Base delay in milliseconds
  maxDelay: number
  jitter: boolean
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds max
  jitter: true
}

// Sleep function with optional jitter
function sleep(ms: number, jitter: boolean = true): Promise<void> {
  const delay = jitter ? ms + Math.random() * ms * 0.1 : ms // Add up to 10% jitter
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Enhanced exponential backoff implementation following OpenAI best practices
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: Partial<RetryConfig> = {}
): Promise<AIGenerationResult<T>> {
  const sessionId = globalThis.crypto.randomUUID()
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: any = null
  
  console.log(`🔄 [${operationName}:${sessionId}] Starting retry operation with config:`, finalConfig)
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      console.log(`🚀 [${operationName}:${sessionId}] Attempt ${attempt + 1}/${finalConfig.maxRetries + 1}`)
      console.log(`🕒 [${operationName}:${sessionId}] Attempt timestamp:`, new Date().toISOString())
      
      const result = await operation()
      
      if (attempt > 0) {
        console.log(`✅ [${operationName}:${sessionId}] Succeeded after ${attempt + 1} attempts`)
        // Track successful retries in Sentry for monitoring
        Sentry.addBreadcrumb({
          message: `OpenAI retry succeeded for ${operationName}`,
          level: 'info',
          data: { attempts: attempt + 1, operation: operationName, sessionId }
        })
      } else {
        console.log(`✅ [${operationName}:${sessionId}] Succeeded on first attempt`)
      }
      
      return { success: true, data: result }
      
    } catch (error) {
      lastError = error
      console.error(`❌ [${operationName}:${sessionId}] Attempt ${attempt + 1} failed:`, error)

      // Handle specific OpenAI errors
      if (error instanceof OpenAI.APIError) {
        console.log(`🔍 [${operationName}:${sessionId}] OpenAI API Error details:`, {
          status: error.status,
          code: error.code,
          message: error.message,
          type: error.type,
          headers: error.headers
        })
        
        // Rate limit error (429) - Always retry with exponential backoff
        if (error.status === 429) {
          console.log(`⚠️ [${operationName}:${sessionId}] Rate limit hit! Headers:`, error.headers)
          
          // Check if this is a quota exceeded error (don't retry)
          if (error.code === 'insufficient_quota' || error.type === 'insufficient_quota') {
            console.log(`🚫 [${operationName}:${sessionId}] Quota exceeded - no retries needed`)
            Sentry.captureException(new Error(`OpenAI quota exceeded: ${error.message}`), {
              tags: { 
                error_type: 'quota_exceeded',
                operation: operationName
              },
              extra: {
                sessionId,
                errorCode: error.code,
                errorType: error.type,
                message: error.message
              }
            })
            
                         return {
               success: false,
               error: 'OpenAI quota exceeded. Please check your plan and billing details.',
               rateLimitInfo: {
                 quotaExceeded: true,
                 errorCode: error.code || undefined,
                 errorType: error.type || undefined
               }
             }
          }
          
          // This is a true rate limit (requests per minute) - retry
          if (attempt < finalConfig.maxRetries) {
            const delay = Math.min(
              finalConfig.baseDelay * Math.pow(2, attempt),
              finalConfig.maxDelay
            )
            
            console.log(`⏳ [${operationName}:${sessionId}] Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1})`)
            console.log(`📊 [${operationName}:${sessionId}] Rate limit info:`, {
              resetRequests: error.headers?.['x-ratelimit-reset-requests'],
              resetTokens: error.headers?.['x-ratelimit-reset-tokens'],
              remainingRequests: error.headers?.['x-ratelimit-remaining-requests'],
              remainingTokens: error.headers?.['x-ratelimit-remaining-tokens'],
              limitRequests: error.headers?.['x-ratelimit-limit-requests'],
              limitTokens: error.headers?.['x-ratelimit-limit-tokens']
            })
            
            // Track rate limit events for monitoring
            Sentry.addBreadcrumb({
              message: `OpenAI rate limit encountered for ${operationName}`,
              level: 'warning',
              data: { 
                attempt: attempt + 1, 
                delay, 
                operation: operationName,
                sessionId,
                resetTime: error.headers?.['x-ratelimit-reset-requests'],
                remainingRequests: error.headers?.['x-ratelimit-remaining-requests'],
                remainingTokens: error.headers?.['x-ratelimit-remaining-tokens']
              }
            })
            
            await sleep(delay, finalConfig.jitter)
            continue
          }
          
          // Max retries exceeded for rate limit - Track in Sentry
          console.log(`🚫 [${operationName}:${sessionId}] Rate limit exceeded after ${finalConfig.maxRetries + 1} attempts`)
          Sentry.captureException(new Error(`OpenAI rate limit exceeded after ${finalConfig.maxRetries + 1} attempts`), {
            tags: { 
              error_type: 'rate_limit_exceeded',
              operation: operationName
            },
            extra: {
              attempts: finalConfig.maxRetries + 1,
              sessionId,
              resetTime: error.headers?.['x-ratelimit-reset-requests'],
              rateLimitHeaders: error.headers
            }
          })
          
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again in a few minutes.',
            rateLimitInfo: {
              resetTime: error.headers?.['x-ratelimit-reset-requests'] || 'unknown',
              remainingRequests: error.headers?.['x-ratelimit-remaining-requests'],
              remainingTokens: error.headers?.['x-ratelimit-remaining-tokens']
            }
          }
        }
        
        // Server errors (500+) - Retry with exponential backoff
        if (error.status >= 500) {
          console.log(`🔥 [${operationName}:${sessionId}] Server error ${error.status}: ${error.message}`)
          
          if (attempt < finalConfig.maxRetries) {
            const delay = Math.min(
              finalConfig.baseDelay * Math.pow(2, attempt),
              finalConfig.maxDelay
            )
            
            console.log(`⏳ [${operationName}:${sessionId}] Server error. Retrying in ${delay}ms (attempt ${attempt + 1})`)
            
            // Track server errors for monitoring
            Sentry.addBreadcrumb({
              message: `OpenAI server error for ${operationName}`,
              level: 'error',
              data: { 
                attempt: attempt + 1, 
                delay, 
                operation: operationName,
                sessionId,
                status: error.status,
                message: error.message
              }
            })
            
            await sleep(delay, finalConfig.jitter)
            continue
          }
          
          // Max retries exceeded for server errors
          console.log(`🚫 [${operationName}:${sessionId}] Server error exceeded max retries`)
          Sentry.captureException(error, {
            tags: { 
              error_type: 'openai_server_error_exceeded',
              operation: operationName,
              status: error.status.toString()
            },
            extra: {
              attempts: finalConfig.maxRetries + 1,
              sessionId
            }
          })
          
          return {
            success: false,
            error: 'OpenAI service temporarily unavailable. Please try again later.'
          }
        }
        
        // Invalid API key (401) - Don't retry
        if (error.status === 401) {
          console.log(`🔑 [${operationName}:${sessionId}] Authentication failed - API key issue`)
          Sentry.captureException(error, {
            tags: { 
              error_type: 'openai_auth_failed',
              operation: operationName
            },
            extra: { sessionId }
          })
          
          return {
            success: false,
            error: 'API authentication failed. Please check configuration.'
          }
        }
        
        // Content policy violation (400) - Don't retry
        if (error.status === 400) {
          console.log(`🚫 [${operationName}:${sessionId}] Content rejected - policy violation`)
          Sentry.captureException(error, {
            tags: { 
              error_type: 'openai_content_rejected',
              operation: operationName
            },
            extra: { sessionId }
          })
          
          return {
            success: false,
            error: 'Request was rejected. Please check your input content.'
          }
        }
        
        // Other API errors - Don't retry
        console.log(`❓ [${operationName}:${sessionId}] Other API error ${error.status}: ${error.message}`)
        Sentry.captureException(error, {
          tags: { 
            error_type: 'openai_api_error',
            operation: operationName,
            status: error.status?.toString() || 'unknown'
          },
          extra: { sessionId }
        })
        
        return {
          success: false,
          error: `API error: ${error.message}`
        }
      }
      
      // Network or timeout errors - Retry with exponential backoff
      if (
        (error as any)?.name === 'TimeoutError' || 
        (error as any)?.code === 'ECONNRESET' || 
        (error as any)?.code === 'ENOTFOUND'
      ) {
        console.log(`🌐 [${operationName}:${sessionId}] Network error:`, {
          name: (error as any)?.name,
          code: (error as any)?.code,
          message: (error as any)?.message
        })
        
        if (attempt < finalConfig.maxRetries) {
          const delay = Math.min(
            finalConfig.baseDelay * Math.pow(2, attempt),
            finalConfig.maxDelay
          )
          
          console.log(`⏳ [${operationName}:${sessionId}] Network error. Retrying in ${delay}ms (attempt ${attempt + 1})`)
          
          // Track network errors for monitoring
          Sentry.addBreadcrumb({
            message: `Network error for ${operationName}`,
            level: 'warning',
            data: { 
              attempt: attempt + 1, 
              delay, 
              operation: operationName,
              sessionId,
              error_name: (error as any)?.name,
              error_code: (error as any)?.code
            }
          })
          
          await sleep(delay, finalConfig.jitter)
          continue
        }
      }
      
      // For other errors, don't retry - Track in Sentry
      console.log(`💥 [${operationName}:${sessionId}] Unexpected error:`, error)
      Sentry.captureException(error, {
        tags: { 
          error_type: 'openai_unknown_error',
          operation: operationName
        },
        extra: {
          attempts: attempt + 1,
          sessionId
        }
      })
      
      break
    }
  }
  
  // Max retries exceeded or non-retryable error
  console.log(`🚫 [${operationName}:${sessionId}] All attempts failed after ${finalConfig.maxRetries + 1} attempts`)
  const finalError = new Error(`Service error: Failed to ${operationName.toLowerCase()} after ${finalConfig.maxRetries + 1} attempts`)
  
  Sentry.captureException(finalError, {
    tags: { 
      error_type: 'openai_max_retries_exceeded',
      operation: operationName
    },
    extra: {
      attempts: finalConfig.maxRetries + 1,
      sessionId,
      lastError: lastError?.message || 'unknown'
    }
  })
  
  return {
    success: false,
    error: `Service error: Failed to ${operationName.toLowerCase()} after ${finalConfig.maxRetries + 1} attempts`
  }
}

// Optimized request function with proper token management
export async function createChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
    user?: string
    operationName?: string
  } = {}
): Promise<AIGenerationResult<OpenAI.Chat.Completions.ChatCompletion>> {
  const {
    model = 'gpt-4o-mini',
    maxTokens = 150, // Reasonable default for most use cases
    temperature = 0.7,
    user = 'investment-form',
    operationName = 'chat completion'
  } = options

  const sessionId = globalThis.crypto.randomUUID()
  
  const requestParams = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    user,
    stream: false,
  }

  console.log(`📤 [createChatCompletion:${sessionId}] Request params:`, {
    model,
    max_tokens: maxTokens,
    temperature,
    user,
    stream: false,
    messageCount: messages.length,
    totalContentLength: messages.reduce((sum, msg) => sum + (msg.content?.toString().length || 0), 0)
  })

  console.log(`📝 [createChatCompletion:${sessionId}] Messages summary:`, 
    messages.map(msg => ({
      role: msg.role,
      contentLength: msg.content?.toString().length || 0,
      contentPreview: msg.content?.toString().substring(0, 100) || ''
    }))
  )

  return executeWithRetry(
    () => {
      console.log(`🔄 [createChatCompletion:${sessionId}] Executing OpenAI API call`)
      return openai.chat.completions.create(requestParams) as Promise<OpenAI.Chat.Completions.ChatCompletion>
    },
    `${operationName}:${sessionId}`
  )
}

// Helper function to add delay between requests to avoid burst rate limits
export async function addRequestDelay(delayMs: number = 100): Promise<void> {
  await sleep(delayMs, true)
}

// Utility to validate API key on startup
export function validateOpenAIConfig(): boolean {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🔍 [validateOpenAIConfig:${sessionId}] Validating OpenAI configuration`)
  
  if (!process.env.OPENAI_API_KEY) {
    console.error(`❌ [validateOpenAIConfig:${sessionId}] OPENAI_API_KEY environment variable is not set`)
    return false
  }
  
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error(`❌ [validateOpenAIConfig:${sessionId}] OPENAI_API_KEY appears to be invalid (should start with sk-)`)
    console.error(`❌ [validateOpenAIConfig:${sessionId}] Current API key starts with: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`)
    return false
  }
  
  console.log(`✅ [validateOpenAIConfig:${sessionId}] OpenAI API key configuration validated`)
  console.log(`✅ [validateOpenAIConfig:${sessionId}] API key length: ${process.env.OPENAI_API_KEY.length} characters`)
  console.log(`✅ [validateOpenAIConfig:${sessionId}] API key prefix: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`)
  
  return true
} 
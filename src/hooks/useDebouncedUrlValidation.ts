import { useCallback, useRef } from 'react'

interface ValidationResult {
  ok: boolean
  status?: number
  error?: string
  finalUrl?: string
}

interface UseDebouncedUrlValidationProps {
  onValidationStart?: (fieldName: string) => void
  onValidationComplete?: (fieldName: string, result: ValidationResult) => void
  debounceMs?: number
}

/**
 * Custom hook for debounced URL validation to prevent rate limiting
 * and avoid multiple simultaneous requests for the same URL
 */
export function useDebouncedUrlValidation({
  onValidationStart,
  onValidationComplete,
  debounceMs = 1000
}: UseDebouncedUrlValidationProps = {}) {
  
  // Track pending validation requests
  const pendingValidations = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const lastValidatedUrls = useRef<Map<string, string>>(new Map())
  
  const validateUrl = useCallback(async (url: string, fieldName: string): Promise<ValidationResult> => {
    // Clear any existing timeout for this field
    const existingTimeout = pendingValidations.current.get(fieldName)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      pendingValidations.current.delete(fieldName)
    }
    
    // Check if we've already validated this exact URL for this field
    const lastValidatedUrl = lastValidatedUrls.current.get(fieldName)
    if (lastValidatedUrl === url) {
      console.log(`🔄 [Debounced Validation] Skipping re-validation for ${fieldName} - same URL`)
      return { ok: true } // Return success for unchanged URLs
    }
    
    // Return a promise that will be resolved after debounce delay
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        pendingValidations.current.delete(fieldName)
        
        if (!url || url.trim() === '') {
          console.log(`🔄 [Debounced Validation] Empty URL for ${fieldName}, skipping validation`)
          resolve({ ok: true }) // Empty URLs are handled by schema validation
          return
        }

        try {
          // Basic URL format validation
          new URL(url)
        } catch {
          const result = { ok: false, error: 'Please enter a valid URL' }
          if (onValidationComplete) onValidationComplete(fieldName, result)
          resolve(result)
          return
        }

        console.log(`🔄 [Debounced Validation] Starting validation for ${fieldName}: ${url}`)
        
        // Mark validation as started
        if (onValidationStart) onValidationStart(fieldName)
        lastValidatedUrls.current.set(fieldName, url)

        try {
          const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`)
          const responseData = await response.json()
          
          console.log(`📡 [Debounced Validation] API response for ${fieldName}:`, responseData)
          
          const result: ValidationResult = {
            ok: responseData.ok,
            status: responseData.status,
            error: responseData.error,
            finalUrl: responseData.finalUrl
          }
          
          if (onValidationComplete) onValidationComplete(fieldName, result)
          resolve(result)
        } catch (error) {
          console.log(`💥 [Debounced Validation] Error validating ${fieldName}:`, error)
          const result = { 
            ok: false, 
            error: 'Unable to validate URL. Please check your connection and try again.' 
          }
          if (onValidationComplete) onValidationComplete(fieldName, result)
          resolve(result)
        }
      }, debounceMs)
      
      pendingValidations.current.set(fieldName, timeoutId)
    })
  }, [onValidationStart, onValidationComplete, debounceMs])
  
  // Cleanup function to clear pending timeouts
  const cleanup = useCallback(() => {
    pendingValidations.current.forEach(timeout => clearTimeout(timeout))
    pendingValidations.current.clear()
  }, [])
  
  return {
    validateUrl,
    cleanup
  }
} 
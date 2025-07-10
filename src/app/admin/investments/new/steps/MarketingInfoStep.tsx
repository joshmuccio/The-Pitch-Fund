'use client'

import { useFormContext } from 'react-hook-form'
import { type Step3FormValues } from '../../../schemas/companySchema'

interface MarketingInfoStepProps {
  customErrors?: Record<string, any>
}

export default function MarketingInfoStep({ customErrors = {} }: MarketingInfoStepProps) {
  const { 
    register, 
    formState: { errors, touchedFields }
  } = useFormContext<Step3FormValues>()

  const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
    // Helper function to safely access nested error paths
    const getNestedError = (errors: any, path: string) => {
      return path.split('.').reduce((obj, key) => {
        if (obj && typeof obj === 'object') {
          return obj[key]
        }
        return undefined
      }, errors)
    }

    // Prioritize custom errors from step validation
    const customError = customErrors[fieldName]
    const formError = getNestedError(errors, fieldName)
    const isTouched = getNestedError(touchedFields, fieldName)
    
    // Show custom error if it exists, otherwise show form error (real-time validation with Zod)
    const error = customError || formError
    if (!error) return null
    
    // Handle different error types from React Hook Form or custom validation
    let message: string = ''
    if (typeof error === 'string') {
      message = error
    } else if (Array.isArray(error) && error.length > 0) {
      message = error[0] // Take first error message from array
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      message = error.message
    } else {
      message = 'Invalid value'
    }
    
    return (
      <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
        <span className="text-red-400">⚠</span>
        {message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Marketing Information section */}
      <div className="border border-gray-600 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
          🎯 Marketing & Pitch Information
        </h4>
        <p className="text-sm text-gray-400 mb-4">
          Company branding, website, and pitch details
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tagline */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tagline *
            </label>
            <input
              type="text"
              {...register('tagline')}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                errors.tagline || customErrors.tagline ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="One line description of what the company does"
            />
            <ErrorDisplay fieldName="tagline" />
            <div className="text-xs text-gray-500 mt-1">
              A concise, compelling description of your company's value proposition
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Website URL *
              <span className="text-xs text-gray-500 ml-1">(Validated)</span>
            </label>
            <input
              type="url"
              {...register('website_url', {
                validate: async (value) => {
                  if (!value || value.trim() === '') return 'Website URL is required';
                  
                  // Don't validate invalid URLs
                  try {
                    new URL(value);
                  } catch {
                    return 'Please enter a valid URL';
                  }
                  
                  try {
                    const response = await fetch(`/api/check-url?url=${encodeURIComponent(value)}`);
                    const { ok, status, finalUrl } = await response.json();
                    
                    // Handle redirects - update field with final URL
                    if (ok && finalUrl && finalUrl !== value) {
                      console.log('🔄 [URL Validation] Redirect detected, updating URL:', value, '→', finalUrl);
                      // Note: We'd need setValue here but it's not available in this component
                      // The Zod validation will handle this at the schema level
                    }
                    
                    return ok || `URL responded ${status ?? 'with an error'}. Please check the URL and try again.`;
                  } catch (error) {
                    return 'Unable to validate URL. Please check your connection and try again.';
                  }
                },
              })}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                errors.website_url || customErrors.website_url ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="https://example.com"
            />
            <p className="text-xs text-gray-500 mt-1">URL validated on blur - must return a 200 response. Redirects are followed automatically.</p>
            <ErrorDisplay fieldName="website_url" />
          </div>

          {/* Industry Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Industry Tags
            </label>
            <input
              type="text"
              {...register('industry_tags')}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                errors.industry_tags || customErrors.industry_tags ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="e.g. fintech, b2b, saas, ai"
            />
            <ErrorDisplay fieldName="industry_tags" />
            <div className="text-xs text-gray-500 mt-1">
              Comma-separated tags that describe your industry and category
            </div>
          </div>

          {/* Pitch Episode URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Pitch Episode URL
            </label>
            <input
              type="url"
              {...register('pitch_episode_url')}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                errors.pitch_episode_url || customErrors.pitch_episode_url ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="https://..."
            />
            <ErrorDisplay fieldName="pitch_episode_url" />
            <div className="text-xs text-gray-500 mt-1">
              Link to the pitch episode where this company was featured
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
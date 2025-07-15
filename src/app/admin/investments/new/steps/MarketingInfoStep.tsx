'use client'

import { useFormContext } from 'react-hook-form'
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { type Step3FormValues, type CompanyFormValues } from '../../../schemas/companySchema'
import TagSelector from '../../../../../components/TagSelector'

interface MarketingInfoStepProps {
  customErrors?: Record<string, any>
  onUrlValidationChange?: (fieldName: string, status: 'idle' | 'validating' | 'valid' | 'invalid') => void
  fieldsNeedingManualInput?: Set<string>
}

export default function MarketingInfoStep({ customErrors = {}, onUrlValidationChange, fieldsNeedingManualInput = new Set() }: MarketingInfoStepProps) {
  const { 
    register, 
    setValue,
    watch,
    getValues,
    formState: { errors, touchedFields }
  } = useFormContext<CompanyFormValues>()

  // Local state for custom URL validation errors and status
  const [localCustomErrors, setLocalCustomErrors] = useState<Record<string, string>>({})
  const [urlValidationStatus, setUrlValidationStatus] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({
    website_url: 'idle',
    pitch_episode_url: 'idle'
  })

  // Track user interaction with website URL field
  const [userInteractedWithWebsiteUrl, setUserInteractedWithWebsiteUrl] = useState(false)
  
  // Track the last founder email we auto-populated for
  const lastAutoPopulatedEmail = useRef<string>('')

  // AI generation state
  const [taglineGenerating, setTaglineGenerating] = useState(false)
  const [industryTagsGenerating, setIndustryTagsGenerating] = useState(false)
  const [businessModelTagsGenerating, setBusinessModelTagsGenerating] = useState(false)
  const [keywordsGenerating, setKeywordsGenerating] = useState(false)

  // Manual URL validation function (copied from Step 2)
  const validateUrl = useCallback(async (url: string, fieldName: string): Promise<boolean> => {
    console.log(`🌐 [Manual Validation] Starting validation for ${fieldName}:`, url);
    
    if (!url || url.trim() === '') {
      console.log(`🌐 [Manual Validation] Empty URL for ${fieldName}, skipping validation`);
      return true; // Empty URLs are handled by Zod schema
    }

    try {
      new URL(url);
      console.log(`🌐 [Manual Validation] URL format is valid for ${fieldName}`);
    } catch {
      console.log(`🌐 [Manual Validation] Invalid URL format for ${fieldName}`);
      setLocalCustomErrors(prev => ({ ...prev, [fieldName]: 'Please enter a valid URL' }));
      return false;
    }

    // Special domain validation for pitch episode URL
    if (fieldName === 'pitch_episode_url') {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      if (!hostname.includes('thepitch.show')) {
        console.log(`🌐 [Manual Validation] Pitch episode URL must be from thepitch.show domain, got: ${hostname}`);
        setLocalCustomErrors(prev => ({ 
          ...prev, 
          [fieldName]: 'Pitch episode URL must be from thepitch.show domain' 
        }));
        return false;
      }
      
      console.log(`🌐 [Manual Validation] Domain validation passed for pitch episode URL: ${hostname}`);
    }

    try {
      console.log(`🌐 [Manual Validation] Making API call for ${fieldName}:`, url);
      const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`);
      const responseData = await response.json();
      console.log(`📡 [Manual Validation] API response for ${fieldName}:`, responseData);
      
      const { ok, status, finalUrl } = responseData;
      
      if (ok) {
        console.log(`✅ [Manual Validation] URL is valid for ${fieldName}`);
        // Clear any previous error
        setLocalCustomErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        
        // Update URL if redirected
        if (finalUrl && finalUrl !== url) {
          console.log(`🔄 [Manual Validation] Redirect detected for ${fieldName}:`, url, '→', finalUrl);
          setValue(fieldName as any, finalUrl);
        }
        
        // Extract episode publish date for pitch episode URLs
        if (fieldName === 'pitch_episode_url') {
          console.log(`📅 [Episode Date Extraction] Extracting publish date for:`, url);
          try {
            const dateResponse = await fetch(`/api/extract-episode-date?url=${encodeURIComponent(url)}`);
            const dateData = await dateResponse.json();
            
            if (dateData.success && dateData.publishDate) {
              console.log(`📅 [Episode Date Extraction] Successfully extracted date:`, dateData.publishDate);
              setValue('episode_publish_date', dateData.publishDate);
            } else {
              console.log(`⚠️ [Episode Date Extraction] Failed to extract date:`, dateData.error);
            }
          } catch (error) {
            console.log(`💥 [Episode Date Extraction] Error extracting date:`, error);
          }
        }
        
        return true;
      } else {
        console.log(`❌ [Manual Validation] URL is invalid for ${fieldName}, status:`, status);
        const errorMsg = `URL responded ${status ?? 'with an error'}. Please check the URL and try again.`;
        setLocalCustomErrors(prev => ({ ...prev, [fieldName]: errorMsg }));
        return false;
      }
    } catch (error) {
      console.log(`💥 [Manual Validation] Error validating ${fieldName}:`, error);
      const errorMsg = 'Unable to validate URL. Please check your connection and try again.';
      setLocalCustomErrors(prev => ({ ...prev, [fieldName]: errorMsg }));
      return false;
    }
  }, [setLocalCustomErrors, setValue])

  // Helper function to update validation status
  const updateUrlValidationStatus = useCallback((fieldName: string, status: 'idle' | 'validating' | 'valid' | 'invalid') => {
    setUrlValidationStatus(prev => ({ ...prev, [fieldName]: status }))
    // Also notify parent component if callback is provided
    if (onUrlValidationChange) {
      onUrlValidationChange(fieldName, status)
    }
  }, [onUrlValidationChange])

  // AI generation functions
  const generateTagline = useCallback(async () => {
    const transcript = getValues('pitch_transcript')
    const reasonForInvesting = getValues('reason_for_investing')
    const companyDescription = getValues('description_raw')
    
    console.log('🤖 [MarketingInfoStep] generateTagline called with transcript length:', transcript?.length || 0)
    console.log('🤖 [MarketingInfoStep] reason_for_investing length:', reasonForInvesting?.length || 0)
    console.log('🤖 [MarketingInfoStep] description_raw length:', companyDescription?.length || 0)
    
    if (!transcript) {
      console.log('❌ [MarketingInfoStep] No transcript provided for tagline generation')
      return
    }

    setTaglineGenerating(true)
    // Clear any previous errors
    setLocalCustomErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.tagline
      return newErrors
    })

    try {
      console.log('🤖 [MarketingInfoStep] Sending request to /api/ai/generate-tagline')
      const response = await fetch('/api/ai/generate-tagline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript,
          reason_for_investing: reasonForInvesting,
          description_raw: companyDescription
        }),
      })

      console.log('🤖 [MarketingInfoStep] Response status:', response.status)
      const data = await response.json()
      console.log('🤖 [MarketingInfoStep] Response data:', data)

      if (!response.ok) {
        console.log('❌ [MarketingInfoStep] AI request failed:', data.error)
        // Handle specific error types
        if (response.status === 429) {
          // Check if it's a quota exceeded error
          if (data.quotaExceeded) {
            setLocalCustomErrors(prev => ({ ...prev, tagline: 'OpenAI quota exceeded. Please check your plan and billing details.' }))
          } else {
            const rateLimitMsg = data.rateLimitInfo?.resetTime 
              ? `Rate limit exceeded. Try again after ${data.rateLimitInfo.resetTime}`
              : 'Rate limit exceeded. Please wait a moment and try again.'
            setLocalCustomErrors(prev => ({ ...prev, tagline: rateLimitMsg }))
          }
        } else {
          setLocalCustomErrors(prev => ({ ...prev, tagline: data.error || 'Failed to generate tagline' }))
        }
        return
      }

      console.log('✅ [MarketingInfoStep] Tagline generated successfully:', data.tagline)
      setValue('tagline', data.tagline)
    } catch (error) {
      console.error('❌ [MarketingInfoStep] Error generating tagline:', error)
      setLocalCustomErrors(prev => ({ ...prev, tagline: 'Network error. Please check your connection and try again.' }))
    } finally {
      setTaglineGenerating(false)
    }
  }, [setValue, getValues])

  const generateIndustryTags = useCallback(async () => {
    const transcript = getValues('pitch_transcript')
    const reasonForInvesting = getValues('reason_for_investing')
    const companyDescription = getValues('description_raw')
    
    console.log('🤖 [MarketingInfoStep] generateIndustryTags called with transcript length:', transcript?.length || 0)
    console.log('🤖 [MarketingInfoStep] reason_for_investing length:', reasonForInvesting?.length || 0)
    console.log('🤖 [MarketingInfoStep] description_raw length:', companyDescription?.length || 0)
    
    if (!transcript) return

    setIndustryTagsGenerating(true)
    // Clear any previous errors
    setLocalCustomErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.industry_tags
      return newErrors
    })

    try {
      console.log('🤖 [MarketingInfoStep] Sending request to /api/ai/generate-industry-tags')
      const response = await fetch('/api/ai/generate-industry-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript,
          reason_for_investing: reasonForInvesting,
          description_raw: companyDescription
        }),
      })

      console.log('🤖 [MarketingInfoStep] Industry tags response status:', response.status)
      const data = await response.json()
      console.log('🤖 [MarketingInfoStep] Industry tags response data:', data)

      if (!response.ok) {
        console.log('❌ [MarketingInfoStep] Industry tags request failed:', data.error)
        // Handle specific error types
        if (response.status === 429) {
          // Check if it's a quota exceeded error
          if (data.quotaExceeded) {
            setLocalCustomErrors(prev => ({ ...prev, industry_tags: 'OpenAI quota exceeded. Please check your plan and billing details.' }))
          } else {
            const rateLimitMsg = data.rateLimitInfo?.resetTime 
              ? `Rate limit exceeded. Try again after ${data.rateLimitInfo.resetTime}`
              : 'Rate limit exceeded. Please wait a moment and try again.'
            setLocalCustomErrors(prev => ({ ...prev, industry_tags: rateLimitMsg }))
          }
        } else {
          setLocalCustomErrors(prev => ({ ...prev, industry_tags: data.error || 'Failed to generate industry tags' }))
        }
        return
      }

      console.log('✅ [MarketingInfoStep] Industry tags generated successfully:', data.tags)
      // Ensure we only set valid standardized tags
      const validTags = Array.isArray(data.tags) ? data.tags : []
      setValue('industry_tags', validTags.join(', '))
    } catch (error) {
      console.error('❌ [MarketingInfoStep] Error generating industry tags:', error)
      setLocalCustomErrors(prev => ({ ...prev, industry_tags: 'Network error. Please check your connection and try again.' }))
    } finally {
      setIndustryTagsGenerating(false)
    }
  }, [setValue, getValues])

  const generateBusinessModelTags = useCallback(async () => {
    const transcript = getValues('pitch_transcript')
    const reasonForInvesting = getValues('reason_for_investing')
    const companyDescription = getValues('description_raw')
    
    console.log('🤖 [MarketingInfoStep] generateBusinessModelTags called with transcript length:', transcript?.length || 0)
    console.log('🤖 [MarketingInfoStep] reason_for_investing length:', reasonForInvesting?.length || 0)
    console.log('🤖 [MarketingInfoStep] description_raw length:', companyDescription?.length || 0)
    
    if (!transcript) return

    setBusinessModelTagsGenerating(true)
    // Clear any previous errors
    setLocalCustomErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.business_model_tags
      return newErrors
    })

    try {
      console.log('🤖 [MarketingInfoStep] Sending request to /api/ai/generate-business-model-tags')
      const response = await fetch('/api/ai/generate-business-model-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript,
          reason_for_investing: reasonForInvesting,
          description_raw: companyDescription
        }),
      })

      console.log('🤖 [MarketingInfoStep] Business model tags response status:', response.status)
      const data = await response.json()
      console.log('🤖 [MarketingInfoStep] Business model tags response data:', data)

      if (!response.ok) {
        console.log('❌ [MarketingInfoStep] Business model tags request failed:', data.error)
        // Handle specific error types
        if (response.status === 429) {
          // Check if it's a quota exceeded error
          if (data.quotaExceeded) {
            setLocalCustomErrors(prev => ({ ...prev, business_model_tags: 'OpenAI quota exceeded. Please check your plan and billing details.' }))
          } else {
            const rateLimitMsg = data.rateLimitInfo?.resetTime 
              ? `Rate limit exceeded. Try again after ${data.rateLimitInfo.resetTime}`
              : 'Rate limit exceeded. Please wait a moment and try again.'
            setLocalCustomErrors(prev => ({ ...prev, business_model_tags: rateLimitMsg }))
          }
        } else {
          setLocalCustomErrors(prev => ({ ...prev, business_model_tags: data.error || 'Failed to generate business model tags' }))
        }
        return
      }

      console.log('✅ [MarketingInfoStep] Business model tags generated successfully:', data.tags)
      // Ensure we only set valid standardized tags
      const validTags = Array.isArray(data.tags) ? data.tags : []
      setValue('business_model_tags', validTags.join(', '))
    } catch (error) {
      console.error('❌ [MarketingInfoStep] Error generating business model tags:', error)
      setLocalCustomErrors(prev => ({ ...prev, business_model_tags: 'Network error. Please check your connection and try again.' }))
    } finally {
      setBusinessModelTagsGenerating(false)
    }
  }, [setValue, getValues])

  const generateKeywords = useCallback(async () => {
    const transcript = getValues('pitch_transcript')
    const reasonForInvesting = getValues('reason_for_investing')
    const companyDescription = getValues('description_raw')
    
    console.log('🤖 [MarketingInfoStep] generateKeywords called with transcript length:', transcript?.length || 0)
    console.log('🤖 [MarketingInfoStep] reason_for_investing length:', reasonForInvesting?.length || 0)
    console.log('🤖 [MarketingInfoStep] description_raw length:', companyDescription?.length || 0)
    
    if (!transcript) return

    setKeywordsGenerating(true)
    // Clear any previous errors
    setLocalCustomErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.keywords
      return newErrors
    })

    try {
      console.log('🤖 [MarketingInfoStep] Sending request to /api/ai/generate-keywords')
      const response = await fetch('/api/ai/generate-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript,
          reason_for_investing: reasonForInvesting,
          description_raw: companyDescription
        }),
      })

      console.log('🤖 [MarketingInfoStep] Keywords response status:', response.status)
      const data = await response.json()
      console.log('🤖 [MarketingInfoStep] Keywords response data:', data)

      if (!response.ok) {
        console.log('❌ [MarketingInfoStep] Keywords request failed:', data.error)
        // Handle specific error types
        if (response.status === 429) {
          // Check if it's a quota exceeded error
          if (data.quotaExceeded) {
            setLocalCustomErrors(prev => ({ ...prev, keywords: 'OpenAI quota exceeded. Please check your plan and billing details.' }))
          } else {
            const rateLimitMsg = data.rateLimitInfo?.resetTime 
              ? `Rate limit exceeded. Try again after ${data.rateLimitInfo.resetTime}`
              : 'Rate limit exceeded. Please wait a moment and try again.'
            setLocalCustomErrors(prev => ({ ...prev, keywords: rateLimitMsg }))
          }
        } else {
          setLocalCustomErrors(prev => ({ ...prev, keywords: data.error || 'Failed to generate keywords' }))
        }
        return
      }

      console.log('✅ [MarketingInfoStep] Keywords generated successfully:', data.keywords)
      // Ensure we only set valid standardized keywords
      const validKeywords = Array.isArray(data.keywords) ? data.keywords : []
      setValue('keywords', validKeywords.join(', '))
    } catch (error) {
      console.error('❌ [MarketingInfoStep] Error generating keywords:', error)
      setLocalCustomErrors(prev => ({ ...prev, keywords: 'Network error. Please check your connection and try again.' }))
    } finally {
      setKeywordsGenerating(false)
    }
  }, [setValue, getValues])

    // Auto-populate website URL from founder 1 email domain (from Step 2 data)
  useEffect(() => {
    const subscription = watch((data, { name, type }) => {
      console.log('🔧 [MarketingInfoStep] Watch subscription triggered:', { name, type });
      
      try {
        const currentFormData = getValues();
        // Access the first founder's email from the founders array (Step 2 data)
        const founder1Email = (currentFormData as any).founders?.[0]?.email || '';
        const currentWebsiteUrl = currentFormData.website_url || '';
        
        console.log('🔧 [MarketingInfoStep] Auto-populate check:', {
          founder1Email,
          currentWebsiteUrl,
          lastAutoPopulated: lastAutoPopulatedEmail.current,
          userInteracted: userInteractedWithWebsiteUrl,
          changeField: name,
          changeType: type
        });
        
        // Only auto-populate if:
        // 1. We have a founder email
        // 2. Website URL is currently empty
        // 3. We haven't already auto-populated for this specific email
        // 4. User hasn't manually interacted with the website URL field
        if (founder1Email && 
            (!currentWebsiteUrl || currentWebsiteUrl.trim() === '') && 
            lastAutoPopulatedEmail.current !== founder1Email &&
            !userInteractedWithWebsiteUrl) {
          
          try {
            // Extract domain from email (after @)
            const emailDomain = founder1Email.split('@')[1]
            if (emailDomain) {
              const websiteUrl = `https://${emailDomain}`
              console.log('🔧 [MarketingInfoStep] Auto-populating website URL from founder email:', websiteUrl);
              setValue('website_url', websiteUrl)
              
              // Mark that we've auto-populated for this founder email
              lastAutoPopulatedEmail.current = founder1Email
              
              // Trigger actual validation for the auto-populated URL after a short delay
              setTimeout(async () => {
                console.log('🔧 [MarketingInfoStep] Triggering manual validation for auto-populated website URL');
                updateUrlValidationStatus('website_url', 'validating')
                
                try {
                  const isValid = await validateUrl(websiteUrl, 'website_url')
                  console.log('🔧 [MarketingInfoStep] Auto-population validation result:', isValid);
                  updateUrlValidationStatus('website_url', isValid ? 'valid' : 'invalid')
                } catch (error) {
                  console.log('❌ [MarketingInfoStep] Auto-population validation failed:', error);
                  updateUrlValidationStatus('website_url', 'invalid')
                }
              }, 1000) // Wait 1 second for the field to settle
            }
          } catch (error) {
            console.log('🔧 [MarketingInfoStep] Could not extract domain from email:', founder1Email);
          }
        } else {
          console.log('🔧 [MarketingInfoStep] Auto-populate skipped - conditions not met');
        }
      } catch (error) {
        console.log('🔧 [MarketingInfoStep] Error in watch subscription:', error);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [setValue, validateUrl, userInteractedWithWebsiteUrl, updateUrlValidationStatus, watch, getValues])

  // Initial check when component mounts - handle case where founder data is already present
  useEffect(() => {
    const currentFormData = getValues();
    const founder1Email = (currentFormData as any).founders?.[0]?.email || '';
    const currentWebsiteUrl = currentFormData.website_url || '';
    
    console.log('🔧 [MarketingInfoStep] Initial mount check:', {
      founder1Email,
      currentWebsiteUrl,
      lastAutoPopulated: lastAutoPopulatedEmail.current,
      userInteracted: userInteractedWithWebsiteUrl
    });
    
    // Auto-populate on mount if conditions are met
    if (founder1Email && 
        (!currentWebsiteUrl || currentWebsiteUrl.trim() === '') && 
        lastAutoPopulatedEmail.current !== founder1Email &&
        !userInteractedWithWebsiteUrl) {
      
      try {
        const emailDomain = founder1Email.split('@')[1]
        if (emailDomain) {
          const websiteUrl = `https://${emailDomain}`
          console.log('🔧 [MarketingInfoStep] Auto-populating website URL on mount:', websiteUrl);
          setValue('website_url', websiteUrl)
          lastAutoPopulatedEmail.current = founder1Email
          
          // Validate the auto-populated URL
          setTimeout(async () => {
            updateUrlValidationStatus('website_url', 'validating')
            try {
              const isValid = await validateUrl(websiteUrl, 'website_url')
              updateUrlValidationStatus('website_url', isValid ? 'valid' : 'invalid')
            } catch (error) {
              console.log('❌ [MarketingInfoStep] Mount auto-population validation failed:', error);
              updateUrlValidationStatus('website_url', 'invalid')
            }
          }, 500) // Shorter delay for mount
        }
      } catch (error) {
        console.log('🔧 [MarketingInfoStep] Mount: Could not extract domain from email:', founder1Email);
      }
    } else {
      console.log('🔧 [MarketingInfoStep] Mount auto-populate conditions not met');
    }
    
    // Validate existing website URL if present (similar to Step 2 logic)
    if (currentWebsiteUrl && currentWebsiteUrl.trim() !== '') {
      console.log('🔧 [MarketingInfoStep] Found existing website URL, starting validation:', currentWebsiteUrl);
      
      // Validate existing URL after a short delay to allow component to settle
      setTimeout(async () => {
        updateUrlValidationStatus('website_url', 'validating')
        try {
          const isValid = await validateUrl(currentWebsiteUrl, 'website_url')
          console.log('🔧 [MarketingInfoStep] Existing website URL validation result:', isValid);
          updateUrlValidationStatus('website_url', isValid ? 'valid' : 'invalid')
        } catch (error) {
          console.log('❌ [MarketingInfoStep] Existing website URL validation failed:', error);
          updateUrlValidationStatus('website_url', 'invalid')
        }
      }, 300) // Short delay for existing URL validation
    } else {
      console.log('🔧 [MarketingInfoStep] No existing website URL to validate');
    }
    
    // Validate existing pitch episode URL if present
    const currentPitchEpisodeUrl = currentFormData.pitch_episode_url || '';
    if (currentPitchEpisodeUrl && currentPitchEpisodeUrl.trim() !== '') {
      console.log('🔧 [MarketingInfoStep] Found existing pitch episode URL, starting validation:', currentPitchEpisodeUrl);
      
      // Validate existing URL after a short delay to allow component to settle
      setTimeout(async () => {
        updateUrlValidationStatus('pitch_episode_url', 'validating')
        try {
          const isValid = await validateUrl(currentPitchEpisodeUrl, 'pitch_episode_url')
          console.log('🔧 [MarketingInfoStep] Existing pitch episode URL validation result:', isValid);
          updateUrlValidationStatus('pitch_episode_url', isValid ? 'valid' : 'invalid')
        } catch (error) {
          console.log('❌ [MarketingInfoStep] Existing pitch episode URL validation failed:', error);
          updateUrlValidationStatus('pitch_episode_url', 'invalid')
        }
      }, 400) // Slightly longer delay to avoid too many simultaneous requests
    } else {
      console.log('🔧 [MarketingInfoStep] No existing pitch episode URL to validate');
    }
  }, []) // Only run on mount

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
    const localError = localCustomErrors[fieldName]
    const isTouched = getNestedError(touchedFields, fieldName)
    
    // Priority: localError (manual validation) > customError (prop) > formError (zod)
    const error = localError || customError || formError
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
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          {/* Pitch Episode URL - Takes up 9 columns */}
          <div className="md:col-span-9">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Pitch Episode URL
              {urlValidationStatus.pitch_episode_url === 'validating' && (
                <span className="text-xs text-blue-400 ml-2">🔄 Validating...</span>
              )}
              {urlValidationStatus.pitch_episode_url === 'valid' && (
                <span className="text-xs text-green-400 ml-2">✅ Valid</span>
              )}
              {urlValidationStatus.pitch_episode_url === 'invalid' && (
                <span className="text-xs text-red-400 ml-2">❌ Invalid</span>
              )}
            </label>
            <div className="relative">
              <input
                type="url"
                {...register('pitch_episode_url')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  errors.pitch_episode_url || customErrors.pitch_episode_url || localCustomErrors.pitch_episode_url ? 'border-red-500' : 
                  urlValidationStatus.pitch_episode_url === 'valid' ? 'border-green-500' :
                  urlValidationStatus.pitch_episode_url === 'invalid' ? 'border-red-500' :
                  urlValidationStatus.pitch_episode_url === 'validating' ? 'border-blue-500' :
                  'border-gray-600'
                }`}
                placeholder="https://thepitch.show/episode/..."
                onBlur={async (e) => {
                  const url = e.target.value;
                  console.log('🎯 [onBlur] Pitch Episode URL blur event triggered, value:', url);
                  
                  if (url && url.trim() !== '') {
                    console.log('🎯 [onBlur] Starting manual validation process for pitch_episode_url');
                    updateUrlValidationStatus('pitch_episode_url', 'validating');
                    
                    const isValid = await validateUrl(url, 'pitch_episode_url');
                    console.log('🎯 [onBlur] Manual validation result:', isValid);
                    
                    updateUrlValidationStatus('pitch_episode_url', isValid ? 'valid' : 'invalid');
                  } else {
                    console.log('🎯 [onBlur] Empty value, setting to idle');
                    updateUrlValidationStatus('pitch_episode_url', 'idle');
                    // Clear any previous error for empty values
                    setLocalCustomErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.pitch_episode_url;
                      return newErrors;
                    });
                  }
                }}
              />
              {urlValidationStatus.pitch_episode_url === 'validating' && (
                <div className="absolute right-3 top-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                </div>
              )}
            </div>
            <ErrorDisplay fieldName="pitch_episode_url" />
            <div className="text-xs text-gray-500 mt-1">
              Link to the pitch episode where this company was featured (must be from thepitch.show)
            </div>
          </div>

          {/* Episode Publish Date - Takes up 3 columns */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Episode Publish Date
            </label>
            <input
              type="date"
              {...register('episode_publish_date')}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                errors.episode_publish_date || customErrors.episode_publish_date ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="YYYY-MM-DD"
            />
            <ErrorDisplay fieldName="episode_publish_date" />
            <div className="text-xs text-gray-500 mt-1">
              Auto-populated from URL
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pitch Transcript */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Pitch Episode Transcript *
            </label>
            <textarea
              {...register('pitch_transcript')}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                errors.pitch_transcript || customErrors.pitch_transcript ? 'border-red-500' : 'border-gray-600'
              }`}
              rows={8}
              placeholder="Paste the full transcript of the pitch episode here..."
            />
            <ErrorDisplay fieldName="pitch_transcript" />
            <div className="text-xs text-gray-500 mt-1">
              Full transcript of the pitch episode. This will be used to generate AI-powered suggestions for tagline and tags.
            </div>
          </div>

          {/* Tagline */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tagline *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                {...register('tagline')}
                className={`flex-1 px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  errors.tagline || customErrors.tagline ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="One line description of what the company does"
              />
              <button
                type="button"
                onClick={() => generateTagline()}
                disabled={!watch('pitch_transcript') || taglineGenerating}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
              >
                {taglineGenerating ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    AI
                  </>
                ) : (
                  '✨ Generate'
                )}
              </button>
            </div>
            <ErrorDisplay fieldName="tagline" />
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Website URL *
              {urlValidationStatus.website_url === 'validating' && (
                <span className="text-xs text-blue-400 ml-2">🔄 Validating...</span>
              )}
              {urlValidationStatus.website_url === 'valid' && (
                <span className="text-xs text-green-400 ml-2">✅ Valid</span>
              )}
              {urlValidationStatus.website_url === 'invalid' && (
                <span className="text-xs text-red-400 ml-2">❌ Invalid</span>
              )}
            </label>
            <div className="relative">
              <input
                type="url"
                {...register('website_url', {
                  onChange: (e) => {
                    // Track that user has manually interacted with this field
                    setUserInteractedWithWebsiteUrl(true)
                    console.log('🔧 [MarketingInfoStep] User manually changed website URL:', e.target.value);
                  }
                })}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  errors.website_url || customErrors.website_url || localCustomErrors.website_url ? 'border-red-500' : 
                  urlValidationStatus.website_url === 'valid' ? 'border-green-500' :
                  urlValidationStatus.website_url === 'invalid' ? 'border-red-500' :
                  urlValidationStatus.website_url === 'validating' ? 'border-blue-500' :
                  'border-gray-600'
                }`}
                placeholder="https://example.com"
                onBlur={async (e) => {
                  const url = e.target.value;
                  console.log('🎯 [onBlur] Website URL blur event triggered, value:', url);
                  
                  if (url && url.trim() !== '') {
                    console.log('🎯 [onBlur] Starting manual validation process for website_url');
                    updateUrlValidationStatus('website_url', 'validating');
                    
                    const isValid = await validateUrl(url, 'website_url');
                    console.log('🎯 [onBlur] Manual validation result:', isValid);
                    
                    updateUrlValidationStatus('website_url', isValid ? 'valid' : 'invalid');
                  } else {
                    console.log('🎯 [onBlur] Empty value, setting to idle');
                    updateUrlValidationStatus('website_url', 'idle');
                    // Clear any previous error for empty values
                    setLocalCustomErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.website_url;
                      return newErrors;
                    });
                  }
                }}
              />
              {urlValidationStatus.website_url === 'validating' && (
                <div className="absolute right-3 top-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                </div>
              )}
            </div>
            <ErrorDisplay fieldName="website_url" />
          </div>

          {/* Industry Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Industry Tags *
            </label>
            <div className="flex items-center gap-2">
              <TagSelector
                tagType="industry"
                value={watch('industry_tags') ? watch('industry_tags').split(',').map(tag => tag.trim()).filter(Boolean) : []}
                onChange={(selectedTags) => {
                  setValue('industry_tags', selectedTags.join(', '))
                }}
                placeholder="Select industry tags..."
                maxTags={10}
                showCount={true}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => generateIndustryTags()}
                disabled={!watch('pitch_transcript') || industryTagsGenerating}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
              >
                {industryTagsGenerating ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    AI
                  </>
                ) : (
                  '✨ Generate'
                )}
              </button>
            </div>
            <ErrorDisplay fieldName="industry_tags" />
            <div className="text-xs text-gray-500 mt-1">
              Select up to 10 standardized industry tags that describe your company
            </div>
          </div>

          {/* Business Model Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Business Model Tags *
            </label>
            <div className="flex items-center gap-2">
              <TagSelector
                tagType="business_model"
                value={watch('business_model_tags') ? watch('business_model_tags').split(',').map(tag => tag.trim()).filter(Boolean) : []}
                onChange={(selectedTags: string[]) => {
                  setValue('business_model_tags', selectedTags.join(', '))
                }}
                placeholder="Select business model tags..."
                maxTags={10}
                showCount={true}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => generateBusinessModelTags()}
                disabled={!watch('pitch_transcript') || businessModelTagsGenerating}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
              >
                {businessModelTagsGenerating ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    AI
                  </>
                ) : (
                  '✨ Generate'
                )}
              </button>
            </div>
            <ErrorDisplay fieldName="business_model_tags" />
            <div className="text-xs text-gray-500 mt-1">
              Select up to 10 standardized business model tags that describe your company
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Keywords
            </label>
            <div className="flex items-center gap-2">
              <TagSelector
                tagType="keywords"
                value={watch('keywords') ? watch('keywords')?.split(',').map(tag => tag.trim()).filter(Boolean) || [] : []}
                onChange={(selectedTags: string[]) => {
                  setValue('keywords', selectedTags.join(', '))
                }}
                placeholder="Select keywords..."
                maxTags={15}
                showCount={true}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => generateKeywords()}
                disabled={!watch('pitch_transcript') || keywordsGenerating}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
              >
                {keywordsGenerating ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    AI
                  </>
                ) : (
                  '✨ Generate'
                )}
              </button>
            </div>
            <ErrorDisplay fieldName="keywords" />
            <div className="text-xs text-gray-500 mt-1">
              Select up to 15 keywords that describe technology approaches, delivery models, or operational characteristics
            </div>
          </div>


        </div>
      </div>
    </div>
  )
} 
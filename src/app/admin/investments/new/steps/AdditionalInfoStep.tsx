'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { type Step2FormValues } from '../../../schemas/companySchema'
import { countries } from '@/lib/countries'
import Step2QuickPastePanel from '@/components/Step2QuickPastePanel'
import LogoUploader from '@/components/LogoUploader'
import { type Step2AutoPopulateField, type AddressNormalizationResult } from '@/lib/parseFounderDiligence'


interface AdditionalInfoStepProps {
  customErrors?: Record<string, string>
  onUrlValidationChange?: (fieldName: string, status: 'idle' | 'validating' | 'valid' | 'invalid') => void
  fieldsNeedingManualInput?: Set<string>
}

export default function AdditionalInfoStep({ customErrors = {}, onUrlValidationChange, fieldsNeedingManualInput = new Set() }: AdditionalInfoStepProps) {
  const { 
    register, 
    control, 
    formState: { errors, touchedFields }, 
    setValue, 
    watch, 
    trigger
  } = useFormContext<Step2FormValues>()

  // Local state for custom URL validation errors
  const [localCustomErrors, setLocalCustomErrors] = useState<Record<string, string>>({})

  // Local state for tracking fields that need manual input from Step2QuickPaste
  const [step2FieldsNeedingManualInput, setStep2FieldsNeedingManualInput] = useState<Set<Step2AutoPopulateField>>(new Set())
  
  // Local state for address normalization results (for styling address fields)
  const [addressNormalizationResult, setAddressNormalizationResult] = useState<AddressNormalizationResult | null>(null)



  // URL validation status state - using Record to support dynamic keys like founders.0.linkedin_url
  const [urlValidationStatus, setUrlValidationStatus] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({
    company_linkedin_url: 'idle'
  })

  // Watch logo_url for form integration
  const logoUrlValue = watch('logo_url')

  // Helper function to update validation status and notify parent
  const updateUrlValidationStatus = useCallback((fieldName: string, status: 'idle' | 'validating' | 'valid' | 'invalid') => {
    setUrlValidationStatus(prev => {
      const newStatus = { ...prev, [fieldName]: status }
      return newStatus
    })
    
    // Notify parent component asynchronously to avoid render-phase updates
    if (onUrlValidationChange) {
      setTimeout(() => {
        onUrlValidationChange(fieldName, status)
      }, 0)
    }
  }, [onUrlValidationChange])

  // Manual URL validation function
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

  // Logo upload handlers
  const handleLogoUploadSuccess = useCallback((url: string) => {
    console.log('🎨 [Logo Upload] Upload successful:', url)
    setValue('logo_url', url)
    // Trigger validation to clear any existing errors
    trigger('logo_url')
  }, [setValue, trigger])

  const handleLogoUploadError = useCallback((error: string) => {
    console.log('🎨 [Logo Upload] Upload failed:', error)
    setLocalCustomErrors(prev => ({ ...prev, logo_url: error }))
  }, [setLocalCustomErrors])

  // Helper function to determine field styling based on validation status
  const getFieldClasses = (fieldName: string, baseClasses: string = 'w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none') => {
    // Helper function to safely access nested error paths (same as ErrorDisplay)
    const getNestedError = (errors: any, path: string) => {
      return path.split('.').reduce((obj, key) => {
        if (obj && typeof obj === 'object') {
          return obj[key]
        }
        return undefined
      }, errors)
    }

    const formError = getNestedError(errors, fieldName)
    const customError = customErrors[fieldName]
    const localError = localCustomErrors[fieldName]
    const hasError = formError || customError || localError
    const needsManualInput = step2FieldsNeedingManualInput.has(fieldName as Step2AutoPopulateField)
    const urlStatus = urlValidationStatus[fieldName]
    
    // Check if this is an address field that was normalized
    const isAddressField = ['hq_address_line_1', 'hq_city', 'hq_state', 'hq_zip_code', 'hq_country', 'hq_latitude', 'hq_longitude'].includes(fieldName)
    const addrResult = addressNormalizationResult
    
    let borderClass = 'border-gray-600' // default
    let backgroundClass = ''
    
    if (hasError) {
      borderClass = 'border-red-500' // error (highest priority)
    } else if (urlStatus === 'valid') {
      borderClass = 'border-green-500' // URL validation success
    } else if (urlStatus === 'invalid') {
      borderClass = 'border-red-500' // URL validation failed  
    } else if (urlStatus === 'validating') {
      borderClass = 'border-blue-500' // URL validation in progress
    } else if (isAddressField && addrResult) {
      // Style address fields based on normalization method and confidence
      if (addrResult.method === 'mapbox' && !addrResult.needsReview) {
        borderClass = 'border-green-500' // High confidence Mapbox
        backgroundClass = 'bg-green-50/5'
      } else if (addrResult.method === 'mapbox' && addrResult.needsReview) {
        borderClass = 'border-yellow-400' // Low confidence Mapbox
        backgroundClass = 'bg-yellow-50/5'
      } else if (addrResult.method === 'regex') {
        borderClass = 'border-orange-400' // Regex parsing
        backgroundClass = 'bg-orange-50/5'
      } else if (addrResult.method === 'fallback') {
        borderClass = 'border-red-400' // Fallback - needs manual entry
        backgroundClass = 'bg-red-50/5'
      }
    } else if (needsManualInput) {
      borderClass = 'border-orange-400 bg-orange-50/5' // needs manual input
    }
    
    return `${baseClasses} ${borderClass} ${backgroundClass}`
  }

  // Use useFieldArray for dynamic founders management
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'founders',
  })

  // Track if we've initialized to prevent duplicate founders
  const hasInitialized = useRef(false)

  // Initialize with one founder if none exist (only once)
  useEffect(() => {
    if (fields.length === 0 && !hasInitialized.current) {
      console.log('🔧 [AdditionalInfoStep] Initializing with 1 founder');
      hasInitialized.current = true
      append({
        first_name: '',
        last_name: '',
        title: '',
        email: '',
        linkedin_url: '',
        role: 'founder',
        sex: '',
        bio: ''
      })
    } else if (fields.length > 0) {
      // If there are already founders (e.g., from draft restoration), don't initialize
      hasInitialized.current = true
      console.log('🔧 [AdditionalInfoStep] Found existing founders, skipping initialization. Count:', fields.length);
    }
  }, [fields.length, append])

  // 🚀 Dynamic founder role management logic
  useEffect(() => {
    if (fields.length === 0) return; // Skip if no founders yet

    console.log('🔧 [AdditionalInfoStep] Managing founder roles. Current count:', fields.length);

    if (fields.length === 1) {
      // Only one founder - set role to 'founder'
      console.log('🔧 [AdditionalInfoStep] Single founder detected - setting role to "founder"');
      setValue('founders.0.role', 'founder');
    } else if (fields.length > 1) {
      // Multiple founders - set all roles to 'cofounder'
      console.log('🔧 [AdditionalInfoStep] Multiple founders detected - setting all roles to "cofounder"');
      fields.forEach((_, index) => {
        setValue(`founders.${index}.role`, 'cofounder');
      });
    }
  }, [fields, setValue])

  // Clear manual input highlighting when user starts typing in a field
  const watchedValues = watch()
  useEffect(() => {
    if (step2FieldsNeedingManualInput.size === 0) return

    const updatedNeedsManualInput = new Set(step2FieldsNeedingManualInput)
    let hasChanges = false

    // Helper function to safely access nested values
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => {
        return current && typeof current === 'object' ? current[key] : undefined
      }, obj)
    }

    // Check each field that needs manual input to see if user has provided input
    step2FieldsNeedingManualInput.forEach(fieldName => {
      const fieldValue = getNestedValue(watchedValues, fieldName)
      
      // If the field now has a value (user typed something), remove it from the manual input list
      if (fieldValue !== undefined && fieldValue !== '' && fieldValue !== null) {
        updatedNeedsManualInput.delete(fieldName)
        hasChanges = true
        console.log(`✅ [AdditionalInfoStep] Field ${fieldName} no longer needs manual input - user provided value`)
      }
    })

    if (hasChanges) {
      setStep2FieldsNeedingManualInput(updatedNeedsManualInput)
    }
  }, [watchedValues, step2FieldsNeedingManualInput])

  // Track if we've already validated URLs when step becomes active
  const hasValidatedOnStepEntry = useRef(false)

  // Effect to validate URLs when step 2 becomes active (user navigates from step 1)
  useEffect(() => {
    // Only run once when step becomes active and hasn't already validated
    if (hasValidatedOnStepEntry.current) return;
    
    const urlFieldsToValidate = [
      'company_linkedin_url'
    ];
    
    // Add a small delay to ensure component is fully mounted
    const timeoutId = setTimeout(() => {
      // Check if we need to validate URLs (existing data from localStorage or previous entry)
      const currentValues = watch();
      
      // Check company-level URLs
      const hasCompanyUrls = urlFieldsToValidate.some(field => {
        const value = (currentValues as any)[field];
        return value && value.trim() !== '';
      });
      
      // Check founder LinkedIn URLs
      const founders = currentValues.founders || [];
      const hasFounderLinkedInUrls = founders.some((founder: any) => 
        founder.linkedin_url && founder.linkedin_url.trim() !== ''
      );
      
      if ((hasCompanyUrls || hasFounderLinkedInUrls) && !hasValidatedOnStepEntry.current) {
        console.log('🔄 [AdditionalInfoStep] Step 2 active with existing URLs, triggering validation');
        hasValidatedOnStepEntry.current = true;
        
        // Validate company-level URL fields
        urlFieldsToValidate.forEach(async (fieldName) => {
          const url = (currentValues as any)[fieldName];
          if (url && url.trim() !== '') {
            console.log(`🔄 [AdditionalInfoStep] Validating existing URL for ${fieldName}:`, url);
            updateUrlValidationStatus(fieldName, 'validating');
            
            try {
              const isValid = await validateUrl(url, fieldName);
              console.log(`🔄 [AdditionalInfoStep] Existing URL validation result for ${fieldName}:`, isValid);
              updateUrlValidationStatus(fieldName, isValid ? 'valid' : 'invalid');
              
              // LinkedIn URL validation complete (logo upload is now separate)
            } catch (error) {
              console.log(`❌ [AdditionalInfoStep] Existing URL validation failed for ${fieldName}:`, error);
              updateUrlValidationStatus(fieldName, 'invalid');
            }
          }
        });
        
        // Validate founder LinkedIn URLs
        founders.forEach(async (founder: any, index: number) => {
          const linkedinUrl = founder.linkedin_url;
          if (linkedinUrl && linkedinUrl.trim() !== '') {
            const fieldName = `founders.${index}.linkedin_url`;
            console.log(`🔄 [AdditionalInfoStep] Validating existing founder LinkedIn for ${fieldName}:`, linkedinUrl);
            updateUrlValidationStatus(fieldName, 'validating');
            
            try {
              const isValid = await validateUrl(linkedinUrl, fieldName);
              console.log(`🔄 [AdditionalInfoStep] Existing founder LinkedIn validation result for ${fieldName}:`, isValid);
              updateUrlValidationStatus(fieldName, isValid ? 'valid' : 'invalid');
            } catch (error) {
              console.log(`❌ [AdditionalInfoStep] Existing founder LinkedIn validation failed for ${fieldName}:`, error);
              updateUrlValidationStatus(fieldName, 'invalid');
            }
          }
        });
      }
    }, 500); // Wait 500ms for step to settle
    
    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutId);
  }, [validateUrl, updateUrlValidationStatus, watch]) // Dependencies for the effect

  const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
    // Helper function to get nested error
    const getNestedError = (errors: any, path: string) => {
      return path.split('.').reduce((acc, key) => acc?.[key], errors)
    }
    
    const formError = getNestedError(errors, fieldName)
    const customError = customErrors[fieldName]
    const localError = localCustomErrors[fieldName]
    const isTouched = getNestedError(touchedFields, fieldName)
    
    // Priority: localError (manual validation) > customError (prop) > formError (zod)
    const error = localError || customError || formError
    
    if (error && (isTouched || customError || localError)) {
      return (
        <p className="text-red-400 text-xs mt-1">
          {typeof error === 'string' ? error : error.message}
        </p>
      )
    }
    
    return null
  }

  const addFounder = () => {
    if (fields.length < 3) {
      append({
        first_name: '',
        last_name: '',
        title: '',
        email: '',
        linkedin_url: '',
        role: 'cofounder', // Will be automatically updated by useEffect
        sex: '',
        bio: ''
      })
    }
  }

  const removeFounder = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }



  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left side: Form Fields */}
      <div className="space-y-6">
        {/* Company Information section - includes address fields */}
        <div className="border border-gray-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
            📋 Company Information
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            Company details and headquarters location
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Legal Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Legal Entity Name *
              </label>
              <input
                type="text"
                {...register('legal_name')}
                className={getFieldClasses('legal_name')}
                placeholder="e.g. Example Corp."
              />
              <ErrorDisplay fieldName="legal_name" />
            </div>

            {/* Company LinkedIn URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Company LinkedIn *
                {urlValidationStatus.company_linkedin_url === 'validating' && (
                  <span className="text-xs text-blue-400 ml-2">🔄 Validating...</span>
                )}
                {urlValidationStatus.company_linkedin_url === 'valid' && (
                  <span className="text-xs text-green-400 ml-2">✅ Valid</span>
                )}
                {urlValidationStatus.company_linkedin_url === 'invalid' && (
                  <span className="text-xs text-red-400 ml-2">❌ Invalid</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="url"
                  {...register('company_linkedin_url')}
                  className={getFieldClasses('company_linkedin_url')}
                  placeholder="https://linkedin.com/company/..."
                  onBlur={async (e) => {
                    const url = e.target.value;
                    console.log('🎯 [onBlur] Company LinkedIn URL blur event triggered, value:', url);
                    
                    if (url && url.trim() !== '') {
                      console.log('🎯 [onBlur] Starting manual validation process for company_linkedin_url');
                      updateUrlValidationStatus('company_linkedin_url', 'validating');
                      
                      const isValid = await validateUrl(url, 'company_linkedin_url');
                      console.log('🎯 [onBlur] Manual validation result:', isValid);
                      
                      updateUrlValidationStatus('company_linkedin_url', isValid ? 'valid' : 'invalid');
                      
                      // LinkedIn URL validation complete (logo upload is now separate)
                    } else {
                      console.log('🎯 [onBlur] Empty value, setting to idle');
                      updateUrlValidationStatus('company_linkedin_url', 'idle');
                      // Clear any previous error for empty values
                      setLocalCustomErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.company_linkedin_url;
                        return newErrors;
                      });
                    }
                  }}
                />
                {urlValidationStatus.company_linkedin_url === 'validating' && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                  </div>
                )}
              </div>
              <ErrorDisplay fieldName="company_linkedin_url" />
            </div>

            {/* Company Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-platinum-mist mb-2">
                Company Logo
              </label>
              <LogoUploader
                onUploadSuccess={handleLogoUploadSuccess}
                onUploadError={handleLogoUploadError}
                currentLogoUrl={logoUrlValue || ''}
                className="mb-2"
              />
              <ErrorDisplay fieldName="logo_url" />
            </div>



            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Address Line 1 *
                {addressNormalizationResult && (
                  <span className="text-xs ml-2">
                    {addressNormalizationResult.method === 'mapbox' && !addressNormalizationResult.needsReview && (
                      <span className="text-green-400">🗺️ Mapbox verified</span>
                    )}
                    {addressNormalizationResult.method === 'mapbox' && addressNormalizationResult.needsReview && (
                      <span className="text-yellow-400">🗺️ Mapbox (low confidence)</span>
                    )}
                    {addressNormalizationResult.method === 'regex' && (
                      <span className="text-orange-400">🔧 Pattern parsed</span>
                    )}
                    {addressNormalizationResult.method === 'fallback' && (
                      <span className="text-red-400">❌ Manual entry needed</span>
                    )}
                  </span>
                )}
              </label>
              <input
                type="text"
                {...register('hq_address_line_1')}
                className={getFieldClasses('hq_address_line_1')}
                placeholder="123 Main Street"
              />
              <ErrorDisplay fieldName="hq_address_line_1" />
            </div>

            {/* Address Line 2 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                {...register('hq_address_line_2')}
                className={getFieldClasses('hq_address_line_2')}
                placeholder="Suite 100 (optional)"
              />
              <ErrorDisplay fieldName="hq_address_line_2" />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                City *
              </label>
              <input
                type="text"
                {...register('hq_city')}
                className={getFieldClasses('hq_city')}
                placeholder="San Francisco"
              />
              <ErrorDisplay fieldName="hq_city" />
            </div>

            {/* State/Province */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                State/Province *
              </label>
              <input
                type="text"
                {...register('hq_state')}
                className={getFieldClasses('hq_state')}
                placeholder="CA"
              />
              <ErrorDisplay fieldName="hq_state" />
            </div>

            {/* ZIP/Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                ZIP/Postal Code *
              </label>
              <input
                type="text"
                {...register('hq_zip_code')}
                className={getFieldClasses('hq_zip_code')}
                placeholder="94102"
              />
              <ErrorDisplay fieldName="hq_zip_code" />
            </div>

            {/* HQ Country */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Country *
              </label>
              <select
                {...register('hq_country')}
                className={getFieldClasses('hq_country')}
              >
                <option value="">Select country...</option>
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <ErrorDisplay fieldName="hq_country" />
            </div>

            {/* Latitude */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Latitude
                {addressNormalizationResult && addressNormalizationResult.method === 'mapbox' && (
                  <span className="text-xs text-green-400 ml-2">🗺️ Mapbox</span>
                )}
                <span className="text-xs text-gray-500 ml-1">(Auto-populated)</span>
              </label>
              <input
                type="number"
                step="any"
                {...register('hq_latitude')}
                disabled={true}
                className={`w-full px-3 py-2 bg-gray-800 border rounded text-platinum-mist cursor-not-allowed ${
                  errors.hq_latitude || customErrors.hq_latitude ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="38.571654"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically populated from address geocoding
              </p>
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Longitude
                {addressNormalizationResult && addressNormalizationResult.method === 'mapbox' && (
                  <span className="text-xs text-green-400 ml-2">🗺️ Mapbox</span>
                )}
                <span className="text-xs text-gray-500 ml-1">(Auto-populated)</span>
              </label>
              <input
                type="number"
                step="any"
                {...register('hq_longitude')}
                disabled={true}
                className={`w-full px-3 py-2 bg-gray-800 border rounded text-platinum-mist cursor-not-allowed ${
                  errors.hq_longitude || customErrors.hq_longitude ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="-121.480357"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically populated from address geocoding
              </p>
            </div>
          </div>
        </div>

        {/* Founders Section - NOW DYNAMIC */}
        <div className="border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-platinum-mist flex items-center gap-2">
                👥 Founders ({fields.length}/3)
              </h4>
              <p className="text-sm text-gray-400">
                Add up to 3 founders for this company
              </p>
            </div>
            {fields.length < 3 && (
              <button
                type="button"
                onClick={addFounder}
                className="text-sm bg-cobalt-pulse hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
              >
                Add Founder
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-700 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-md font-medium text-platinum-mist">
                    Founder {index + 1}
                  </h5>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFounder(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      {...register(`founders.${index}.first_name`)}
                      className={getFieldClasses(`founders.${index}.first_name`)}
                      placeholder="John"
                    />
                    <ErrorDisplay fieldName={`founders.${index}.first_name`} />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      {...register(`founders.${index}.last_name`)}
                      className={getFieldClasses(`founders.${index}.last_name`)}
                      placeholder="Doe"
                    />
                    <ErrorDisplay fieldName={`founders.${index}.last_name`} />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register(`founders.${index}.email`)}
                      className={getFieldClasses(`founders.${index}.email`)}
                      placeholder="founder@company.com"
                      autoComplete="email"
                    />
                    <ErrorDisplay fieldName={`founders.${index}.email`} />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      {...register(`founders.${index}.title`)}
                      className={getFieldClasses(`founders.${index}.title`)}
                      placeholder="CEO, CTO, Co-Founder, etc."
                    />
                    <ErrorDisplay fieldName={`founders.${index}.title`} />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      LinkedIn Profile *
                      {urlValidationStatus[`founders.${index}.linkedin_url`] === 'validating' && (
                        <span className="text-xs text-blue-400 ml-2">🔄 Validating...</span>
                      )}
                      {urlValidationStatus[`founders.${index}.linkedin_url`] === 'valid' && (
                        <span className="text-xs text-green-400 ml-2">✅ Valid</span>
                      )}
                      {urlValidationStatus[`founders.${index}.linkedin_url`] === 'invalid' && (
                        <span className="text-xs text-red-400 ml-2">❌ Invalid</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        {...register(`founders.${index}.linkedin_url`)}
                        className={getFieldClasses(`founders.${index}.linkedin_url`)}
                        placeholder="https://linkedin.com/in/..."
                        onBlur={async (e) => {
                          const url = e.target.value;
                          const fieldName = `founders.${index}.linkedin_url`;
                          console.log(`🎯 [onBlur] Founder ${index + 1} LinkedIn URL validation:`, url);
                          
                          if (url && url.trim() !== '') {
                            console.log(`🎯 [onBlur] Starting manual validation process for ${fieldName}`);
                            updateUrlValidationStatus(fieldName, 'validating');
                            
                            try {
                              const isValid = await validateUrl(url, fieldName);
                              console.log(`🎯 [onBlur] Founder ${index + 1} LinkedIn validation result:`, isValid);
                              updateUrlValidationStatus(fieldName, isValid ? 'valid' : 'invalid');
                            } catch (error) {
                              console.log(`❌ [onBlur] Founder ${index + 1} LinkedIn validation error:`, error);
                              updateUrlValidationStatus(fieldName, 'invalid');
                            }
                          } else {
                            console.log(`🎯 [onBlur] Empty value for ${fieldName}, setting to idle`);
                            updateUrlValidationStatus(fieldName, 'idle');
                            // Clear any previous error for empty values
                            setLocalCustomErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[fieldName];
                              return newErrors;
                            });
                          }
                        }}
                      />
                      {urlValidationStatus[`founders.${index}.linkedin_url`] === 'validating' && (
                        <div className="absolute right-3 top-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                        </div>
                      )}
                    </div>
                    <ErrorDisplay fieldName={`founders.${index}.linkedin_url`} />
                  </div>

                  {/* Role - Auto-managed based on founder count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Founder Role
                      <span className="text-xs text-gray-500 ml-1">(Auto-managed)</span>
                    </label>
                    <select
                      {...register(`founders.${index}.role`)}
                      disabled={true}
                      className={`w-full px-3 py-2 bg-gray-800 border rounded text-platinum-mist cursor-not-allowed ${
                        errors.founders?.[index]?.role || customErrors[`founders.${index}.role`] ? 'border-red-500' : 'border-gray-600'
                      }`}
                    >
                      <option value="founder">Founder</option>
                      <option value="cofounder">Co-Founder</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {fields.length === 1 ? 'Single founder → "Founder"' : 'Multiple founders → "Co-Founder"'}
                    </p>
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Sex *
                    </label>
                    <select
                      {...register(`founders.${index}.sex`)}
                      className={getFieldClasses(`founders.${index}.sex`)}
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <ErrorDisplay fieldName={`founders.${index}.sex`} />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    {...register(`founders.${index}.bio`)}
                    className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                      errors.founders?.[index]?.bio || customErrors[`founders.${index}.bio`] ? 'border-red-500' : 'border-gray-600'
                    }`}
                    rows={3}
                    placeholder="Brief background and experience..."
                  />
                  <ErrorDisplay fieldName={`founders.${index}.bio`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Quick-Paste Panel */}
      <div className="space-y-6">
        <Step2QuickPastePanel onParseComplete={(failedFields, addressNormalization) => {
          setStep2FieldsNeedingManualInput(failedFields);
          setAddressNormalizationResult(addressNormalization || null);
          console.log('🔶 [AdditionalInfoStep] Step2 QuickPaste failed fields:', Array.from(failedFields));
          if (addressNormalization) {
            console.log('🔶 [AdditionalInfoStep] Address normalization result:', addressNormalization);
          }
        }} />
      </div>
    </div>
  )
} 
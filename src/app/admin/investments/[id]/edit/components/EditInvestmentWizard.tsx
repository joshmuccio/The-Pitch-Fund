'use client'

import { useState, useEffect } from 'react'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { companySchema, partialCompanySchema, type CompanyFormValues, getStepFieldNames, validateStep } from '../../../../schemas/companySchema'
import { validateInvestmentSubmission, cleanFormData } from '@/lib/form-validation'
import AngelListStep from '../../../new/steps/AngelListStep'
import AdditionalInfoStep from '../../../new/steps/AdditionalInfoStep'
import MarketingInfoStep, { type SelectedVc } from '../../../new/steps/MarketingInfoStep'
import InvestmentTrackingStep, { type VcInvestment } from '../../../new/steps/InvestmentTrackingStep'

interface EditInvestmentWizardProps {
  initialData: CompanyFormValues
  onSave: (data: CompanyFormValues, selectedVcs: SelectedVc[], investmentData: VcInvestment[]) => void
  onCancel: () => void
  saving?: boolean
}

// Internal wizard content that uses the form context
function WizardContent({ initialData, onSave, onCancel, saving = false }: EditInvestmentWizardProps) {
  const [step, setStep] = useState(0)
  const [stepErrors, setStepErrors] = useState<Record<string, any>>({})
  const [urlValidationStatus, setUrlValidationStatus] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({
    website_url: 'idle',
    pitch_episode_url: 'idle',
    youtube_url: 'idle',
    apple_podcasts_url: 'idle',
    spotify_url: 'idle',
    company_linkedin_url: 'idle'
  })
  const [fieldsNeedingManualInput] = useState<Set<string>>(new Set()) // For edit mode, we don't need manual input tracking
  const [selectedVcs, setSelectedVcs] = useState<SelectedVc[]>([])
  const [investmentData, setInvestmentData] = useState<VcInvestment[]>([])
  const [isSubmitButtonClicked, setIsSubmitButtonClicked] = useState(false)
  const { handleSubmit, formState, trigger, getValues, watch } = useFormContext<CompanyFormValues>()

  // Watch all form values to clear stepErrors when fields become valid
  const watchedValues = watch()

  // Debug step errors changes
  useEffect(() => {
    console.log('🔧 [Edit Step Errors] Step errors changed:', stepErrors)
    console.log('🔧 [Edit Step Errors] Current step:', step)
    console.log('🔧 [Edit Step Errors] Submit button will be disabled:', Object.keys(stepErrors).length > 0)
  }, [stepErrors, step])

  // Real-time step validation to ensure submit button state is always correct
  useEffect(() => {
    // Only validate the final step (Step 4, index 3) for submit button enabling
    if (step !== 3) return

    const validateCurrentStep = async () => {
      const currentValues = getValues()
      console.log('🔍 [Edit Step 4 Validation] Current form values:', currentValues)
      
      const validationResult = await validateStep(step, currentValues)
      console.log('🔍 [Edit Step 4 Validation] Step validation result:', validationResult)
      
      // For Step 4 (Investment Tracking), also validate investment data
      let hasInvestmentErrors = false
      if (step === 3) {
        const investedVcs = investmentData.filter(inv => inv.isInvested)
        console.log('🔍 [Edit Step 4 Validation] Invested VCs:', investedVcs)
        
        investedVcs.forEach(investment => {
          if (!investment.investmentAmount || investment.investmentAmount <= 0 || !investment.investmentDate) {
            hasInvestmentErrors = true
            console.log('❌ [Edit Step 4 Validation] Investment error for VC:', investment.vcName, {
              amount: investment.investmentAmount,
              date: investment.investmentDate
            })
          }
        })
      }
      
      if (!validationResult.isValid || hasInvestmentErrors) {
        // Update stepErrors if validation fails
        const errors = { ...validationResult.errors }
        if (hasInvestmentErrors) {
          errors.investment_tracking = 'All invested VCs must have investment amount and date'
        }
        console.log('❌ [Edit Step 4 Validation] Setting errors:', errors)
        setStepErrors(errors)
      } else {
        // Clear stepErrors if validation passes
        console.log('✅ [Edit Step 4 Validation] All validation passed, clearing errors')
        setStepErrors({})
      }
    }

    // Debounce validation to prevent infinite loops
    const timeoutId = setTimeout(validateCurrentStep, 300)
    return () => clearTimeout(timeoutId)
  }, [step, watchedValues.tagline, watchedValues.website_url, watchedValues.pitch_episode_url, urlValidationStatus.website_url, urlValidationStatus.pitch_episode_url, investmentData])

  // Clear stepErrors for individual fields when they become valid during real-time validation
  useEffect(() => {
    if (Object.keys(stepErrors).length > 0) {
      const updatedStepErrors = { ...stepErrors }
      let hasChanges = false

      // Helper function to safely access nested values
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((current, key) => {
          return current && typeof current === 'object' ? current[key] : undefined
        }, obj)
      }

      // Check each field in stepErrors to see if it's now valid
      Object.keys(stepErrors).forEach(fieldName => {
        const fieldValue = getNestedValue(watchedValues, fieldName)
        const hasFormError = !!getNestedValue(formState.errors, fieldName)
        
        // If the field has a value and no form error, clear the step error
        if (fieldValue !== undefined && fieldValue !== '' && !hasFormError) {
          delete updatedStepErrors[fieldName]
          hasChanges = true
        }
      })

      if (hasChanges) {
        setStepErrors(updatedStepErrors)
      }
    }
  }, [watchedValues, formState.errors, stepErrors])

  // Handle URL validation status updates from step components
  const handleUrlValidationChange = (fieldName: string, status: 'idle' | 'validating' | 'valid' | 'invalid') => {
    setUrlValidationStatus(prev => ({ ...prev, [fieldName]: status }))
  }

  const steps = [
    {
      title: '⚡ Company & Investment Details',
      description: 'AngelList fields and basic investment information',
      component: <AngelListStep key={0} customErrors={stepErrors} fieldsNeedingManualInput={fieldsNeedingManualInput} onQuickPasteComplete={() => {}} />
    },
    {
      title: '📋 Company & Founders',
      description: 'Company HQ location and founder information', 
      component: <AdditionalInfoStep key={1} customErrors={stepErrors} onUrlValidationChange={handleUrlValidationChange} fieldsNeedingManualInput={fieldsNeedingManualInput} />
    },
    {
      title: '🎯 Marketing, Pitch & VCs',
      description: 'Company branding, website, pitch details, and associated VCs',
      component: <MarketingInfoStep key={2} customErrors={stepErrors} onUrlValidationChange={handleUrlValidationChange} fieldsNeedingManualInput={fieldsNeedingManualInput} onVcsChange={setSelectedVcs} />
    },
    {
      title: '💰 Investment Tracking',
      description: 'Track which VCs invested and investment amounts',
      component: <InvestmentTrackingStep key={3} selectedVcs={selectedVcs} onInvestmentDataChange={setInvestmentData} customErrors={stepErrors} />
    }
  ]

  const handleFormSubmit = async (data: any) => {
    console.log('🚀 [Edit Form Submission] Starting submission process')
    console.log('🚀 [Edit Form Submission] Current step:', step, 'Expected last step:', steps.length - 1)
    
    // Get current form values directly from form state
    const currentFormValues = getValues()
    console.log('🚀 [Edit Form Submission] Current form values from getValues():', currentFormValues)
    console.log('🚀 [Edit Form Submission] Current form founders from getValues():', (currentFormValues as any).founders)
    
    console.log('🚀 [Edit Form Submission] Form data from handleSubmit:', data)
    console.log('🚀 [Edit Form Submission] Form data founders from handleSubmit:', data.founders)
    console.log('🚀 [Edit Form Submission] Form data keys:', Object.keys(data))
    console.log('🚀 [Edit Form Submission] Selected VCs:', selectedVcs)
    console.log('🚀 [Edit Form Submission] Investment data:', investmentData)
    
    // Only allow submission on last step
    if (step !== steps.length - 1) {
      console.log('❌ [Edit Form Submission] Blocked: Not on last step')
      setStepErrors({ 
        submission: 'Form submission only allowed on the final step. Please complete all steps first.' 
      })
      return
    }
    
    // If founders data is missing from submitted data but exists in form state, use form state
    const dataToUse = { 
      ...data,
      // Ensure founders array is included if it exists in form state
      founders: data.founders || (currentFormValues as any).founders
    }
    console.log('🚀 [Edit Form Submission] Data to use (with founders from form state):', dataToUse)
    
    // Clean and normalize data first
    const cleanedData = cleanFormData(dataToUse)
    console.log('🚀 [Edit Form Submission] Cleaned data:', cleanedData)
    
    // Comprehensive pre-submission validation
    const preValidation = validateInvestmentSubmission(cleanedData, investmentData)
    console.log('🚀 [Edit Form Submission] Pre-validation result:', preValidation)
    
    if (!preValidation.isValid) {
      console.error('❌ [Edit Form Submission] Pre-submission validation failed:', preValidation.errors)
      setStepErrors({ 
        submission: preValidation.errors.join('; '),
        ...preValidation.warnings.length > 0 && { warnings: preValidation.warnings.join('; ') }
      })
      return
    }
    
    // Final validation with complete schema
    try {
      console.log('🚀 [Edit Form Submission] Running final schema validation...')
      const validatedData = await companySchema.parseAsync(cleanedData)
      console.log('✅ [Edit Form Submission] Schema validation passed')
      
      console.log('🚀 [Edit Form Submission] Calling onSave...')
      console.log('🚀 [Edit Form Submission] Validated data being passed to onSave:', validatedData)
      console.log('🚀 [Edit Form Submission] Validated data founders:', (validatedData as any).founders)
      console.log('🚀 [Edit Form Submission] Validated data type:', typeof validatedData)
      
      // ⚠️ IMPORTANT: Add founders array back to validated data since companySchema strips it out
      const dataWithFounders = {
        ...validatedData,
        founders: (cleanedData as any).founders || []
      }
      console.log('🚀 [Edit Form Submission] Final data with founders restored:', dataWithFounders)
      console.log('🚀 [Edit Form Submission] Final founders array:', dataWithFounders.founders)
      
      await onSave(dataWithFounders as any, selectedVcs, investmentData)
      
      console.log('✅ [Edit Form Submission] Update completed successfully')
    } catch (error: unknown) {
      console.error('❌ [Edit Form Submission] Submission failed:', error)
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {}
        error.errors.forEach((err: z.ZodIssue) => {
          // Build the full field path for nested errors (e.g., "founders.0.title")
          const fieldName = err.path.join('.')
          if (!fieldErrors[fieldName]) {
            fieldErrors[fieldName] = []
          }
          fieldErrors[fieldName].push(err.message)
        })
        
        // Set errors to display to user
        setStepErrors(fieldErrors)
        
        // Scroll to top to show errors
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  // Handle next step with per-page validation
  const handleNext = async () => {
    // Get field names for current step
    const currentStepFields = getStepFieldNames(step)
    
    // Get current form values for debugging
    const currentValues = getValues()
    
    // Check URL validation status for steps with URLs
    if (step === 1) { // Step 2 (0-indexed) - Company LinkedIn and founder LinkedIn URLs
      const urlFields = ['company_linkedin_url']
      const invalidUrls: string[] = []
      const validatingUrls: string[] = []
      
      // Check main URL fields
      urlFields.forEach(field => {
        const status = urlValidationStatus[field]
        const fieldValue = currentValues[field as keyof CompanyFormValues]
        
        // Only check status if field has a value
        if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim() !== '') {
          if (status === 'invalid') {
            invalidUrls.push(field)
          } else if (status === 'validating') {
            validatingUrls.push(field)
          }
        }
      })
      
      // Check founder LinkedIn URLs
      const founders = (currentValues as any).founders as any[] || []
      founders.forEach((founder, index) => {
        if (founder?.linkedin_url && founder.linkedin_url.trim() !== '') {
          const fieldName = `founders.${index}.linkedin_url`
          const status = urlValidationStatus[fieldName]
          if (status === 'invalid') {
            invalidUrls.push(`Founder ${index + 1} LinkedIn URL`)
          } else if (status === 'validating') {
            validatingUrls.push(`Founder ${index + 1} LinkedIn URL`)
          }
        }
      })
      
      // Block progression if there are invalid or validating URLs
      if (invalidUrls.length > 0) {
        setStepErrors({
          ...stepErrors,
          urlValidation: [`Please fix invalid URLs: ${invalidUrls.join(', ')}`]
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      
      if (validatingUrls.length > 0) {
        setStepErrors({
          ...stepErrors,
          urlValidation: [`Please wait for URL validation to complete: ${validatingUrls.join(', ')}`]
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    
    // Check URL validation status for Step 3 (all required URLs)
    if (step === 2) { // Step 3 (0-indexed) - Marketing step
      const urlFields = ['website_url', 'pitch_episode_url', 'youtube_url', 'apple_podcasts_url', 'spotify_url']
      const invalidUrls: string[] = []
      const validatingUrls: string[] = []
      
      // Check Step 3 URL fields
      urlFields.forEach(field => {
        const status = urlValidationStatus[field]
        const fieldValue = currentValues[field as keyof CompanyFormValues]
        
        // Only check status if field has a value
        if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim() !== '') {
          if (status === 'invalid') {
            invalidUrls.push(field)
          } else if (status === 'validating') {
            validatingUrls.push(field)
          }
        }
      })
      
      // Block progression if there are invalid or validating URLs
      if (invalidUrls.length > 0) {
        setStepErrors({
          ...stepErrors,
          urlValidation: [`Please fix invalid URLs: ${invalidUrls.join(', ')}`]
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      
      if (validatingUrls.length > 0) {
        setStepErrors({
          ...stepErrors,
          urlValidation: [`Please wait for URL validation to complete: ${validatingUrls.join(', ')}`]
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    
    // Use step-specific validation that doesn't affect touched state
    const validationResult = await validateStep(step, currentValues)
    
    if (validationResult.isValid) {
      // Clear any previous step errors
      setStepErrors({})
      setStep(step + 1)
    } else {
      // Set step-specific errors
      setStepErrors(validationResult.errors)
      
      // Scroll to top to show validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-platinum-mist">{steps[step].title}</h2>
            <p className="text-gray-400 mt-1">{steps[step].description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400">
              Step {step + 1} of {steps.length}
            </div>
            {/* Show validation status indicator - only for step errors */}
            {Object.keys(stepErrors).length > 0 && (
              <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                {stepErrors.urlValidation ? stepErrors.urlValidation[0] : `${Object.keys(stepErrors).length} field(s) need attention`}
              </div>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-cobalt-pulse h-2 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={(e) => {
        // Always prevent default form submission behavior
        e.preventDefault();
        
        // Only allow submission if it's from our submit button on the final step
        if (step === steps.length - 1 && isSubmitButtonClicked) {
          console.log('✅ [Edit Form] Allowing submission from submit button on final step');
          setIsSubmitButtonClicked(false); // Reset flag
          handleSubmit(handleFormSubmit)(e);
        } else {
          console.log('❌ [Edit Form] Blocking form submission - not on final step or submit button not clicked');
          console.log('❌ [Edit Form] Current step:', step, 'Final step:', steps.length - 1, 'Submit clicked:', isSubmitButtonClicked);
          setIsSubmitButtonClicked(false); // Reset flag
        }
      }} onKeyDown={(e) => {
        // Prevent Enter key from submitting form unless on submit button
        if (e.key === 'Enter' && e.target !== e.currentTarget) {
          const target = e.target as HTMLElement;
          if (target.tagName !== 'BUTTON' && target.getAttribute('type') !== 'submit') {
            e.preventDefault();
            console.log('🔒 [Edit Form] Blocked Enter key submission from', target.tagName);
          }
        }
      }} className="space-y-6">
        {/* Current step */}
        {steps[step].component}
        
        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            )}
            
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-cobalt-pulse hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors font-medium"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving || Object.keys(stepErrors).length > 0}
                onClick={() => setIsSubmitButtonClicked(true)}
                className="bg-cobalt-pulse hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition-colors font-medium"
              >
                {saving ? 'Updating Investment...' : 'Update Investment'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// Main wizard component that provides form context
export default function EditInvestmentWizard({ initialData, onSave, onCancel, saving = false }: EditInvestmentWizardProps) {
  const formMethods = useForm<CompanyFormValues>({
    mode: 'onChange', // Validate on change for real-time feedback
    reValidateMode: 'onChange', // Re-validate on change
    shouldUnregister: false, // keep values when steps unmount
    defaultValues: initialData, // Pre-populate with existing data
  })

  return (
    <FormProvider {...formMethods}>
      <WizardContent initialData={initialData} onSave={onSave} onCancel={onCancel} saving={saving} />
    </FormProvider>
  )
} 
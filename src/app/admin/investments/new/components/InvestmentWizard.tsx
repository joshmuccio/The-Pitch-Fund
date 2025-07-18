'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { companySchema, partialCompanySchema, type CompanyFormValues, getStepFieldNames, validateStep } from '../../../schemas/companySchema'
import { useDraftPersist } from '@/hooks/useDraftPersist'
import { validateInvestmentSubmission, cleanFormData } from '@/lib/form-validation'
import AngelListStep from '../steps/AngelListStep'
import AdditionalInfoStep from '../steps/AdditionalInfoStep'
import MarketingInfoStep, { type SelectedVc } from '../steps/MarketingInfoStep'
import InvestmentTrackingStep, { type VcInvestment } from '../steps/InvestmentTrackingStep'

interface InvestmentWizardProps {
  onSave: (data: CompanyFormValues, selectedVcs: SelectedVc[], investmentData: VcInvestment[]) => void
  onCancel: () => void
  saving?: boolean
}

// Internal wizard content that uses the form context
function WizardContent({ onSave, onCancel, saving = false }: InvestmentWizardProps) {
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
  const [fieldsNeedingManualInput, setFieldsNeedingManualInput] = useState<Set<string>>(new Set())
  const [selectedVcs, setSelectedVcs] = useState<SelectedVc[]>([])
  const [investmentData, setInvestmentData] = useState<VcInvestment[]>([])
  const { handleSubmit, formState, reset, trigger, getValues, watch } = useFormContext<CompanyFormValues>()
  const router = useRouter()

  // Watch all form values to clear stepErrors when fields become valid
  const watchedValues = watch()

  // Draft persistence with auto-save
  const { clearDraft, isSaving: isDraftSaving, hasUnsavedChanges } = useDraftPersist<CompanyFormValues>('investmentWizardDraft')
  
  // Track combined saving state
  const isAnySaving = saving || isDraftSaving

  // Debug step errors changes
  useEffect(() => {
    console.log('🔧 [Step Errors] Step errors changed:', stepErrors)
    console.log('🔧 [Step Errors] Current step:', step)
    console.log('🔧 [Step Errors] Submit button will be disabled:', Object.keys(stepErrors).length > 0)
  }, [stepErrors, step])

  // Handle QuickPaste completion and track fields that need manual input
  const handleQuickPasteComplete = (failedFields: Set<string>) => {
    setFieldsNeedingManualInput(failedFields)
  }

  // Clear manual input highlighting when user starts typing in a field
  useEffect(() => {
    if (fieldsNeedingManualInput.size === 0) return

    const updatedNeedsManualInput = new Set(fieldsNeedingManualInput)
    let hasChanges = false

    // Helper function to safely access nested values
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => {
        return current && typeof current === 'object' ? current[key] : undefined
      }, obj)
    }

    // Check each field that needs manual input to see if user has provided input
    fieldsNeedingManualInput.forEach(fieldName => {
      const fieldValue = getNestedValue(watchedValues, fieldName)
      
      // If the field now has a value (user typed something), remove it from the manual input list
      if (fieldValue !== undefined && fieldValue !== '' && fieldValue !== null) {
        updatedNeedsManualInput.delete(fieldName)
        hasChanges = true
      }
    })

    if (hasChanges) {
      setFieldsNeedingManualInput(updatedNeedsManualInput)
    }
  }, [watchedValues, fieldsNeedingManualInput])

  // Real-time step validation to ensure submit button state is always correct
  useEffect(() => {
    // Only validate the final step (Step 4, index 3) for submit button enabling
    if (step !== 3) return

    const validateCurrentStep = async () => {
      const currentValues = getValues()
      console.log('🔍 [Step 4 Validation] Current form values:', currentValues)
      
      const validationResult = await validateStep(step, currentValues)
      console.log('🔍 [Step 4 Validation] Step validation result:', validationResult)
      
      // For Step 4 (Investment Tracking), also validate investment data
      let hasInvestmentErrors = false
      if (step === 3) {
        const investedVcs = investmentData.filter(inv => inv.isInvested)
        console.log('🔍 [Step 4 Validation] Invested VCs:', investedVcs)
        
        investedVcs.forEach(investment => {
          if (!investment.investmentAmount || investment.investmentAmount <= 0 || !investment.investmentDate) {
            hasInvestmentErrors = true
            console.log('❌ [Step 4 Validation] Investment error for VC:', investment.vcName, {
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
        console.log('❌ [Step 4 Validation] Setting errors:', errors)
        setStepErrors(errors)
      } else {
        // Clear stepErrors if validation passes
        console.log('✅ [Step 4 Validation] All validation passed, clearing errors')
        setStepErrors({})
      }
    }

    // Debounce validation to prevent infinite loops
    const timeoutId = setTimeout(validateCurrentStep, 300)
    return () => clearTimeout(timeoutId)
  }, [step, watchedValues.tagline, watchedValues.website_url, watchedValues.pitch_episode_url, urlValidationStatus.website_url, urlValidationStatus.pitch_episode_url, investmentData]) // Watch investment data for final step validation

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

  // ────────────────────────────────────────────────────────────────────
  // 🛡️ DATA PERSISTENCE SYSTEM (No popups - drafts survive page refresh)
  // ────────────────────────────────────────────────────────────────────

  const steps = [
    {
      title: '⚡ Company & Investment Details',
      description: 'AngelList fields that can be auto-populated',
      component: <AngelListStep key={0} customErrors={stepErrors} fieldsNeedingManualInput={fieldsNeedingManualInput} onQuickPasteComplete={handleQuickPasteComplete} />
    },
    {
      title: '📋 Company & Founders (1-3)',
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
    console.log('🚀 [Form Submission] Starting submission process')
    console.log('🚀 [Form Submission] Current step:', step, 'Expected last step:', steps.length - 1)
    console.log('🚀 [Form Submission] Form data:', data)
    console.log('🚀 [Form Submission] Selected VCs:', selectedVcs)
    console.log('🚀 [Form Submission] Investment data:', investmentData)
    
    // Only allow submission on last step
    if (step !== steps.length - 1) {
      console.log('❌ [Form Submission] Blocked: Not on last step')
      return
    }
    
    // Clean and normalize data first
    const cleanedData = cleanFormData(data)
    console.log('🚀 [Form Submission] Cleaned data:', cleanedData)
    
    // Debug the specific TagSelector fields
    console.log('🔍 [Form Submission] TagSelector fields analysis:')
    console.log('🔍 [Form Submission] Raw form keywords:', data.keywords)
    console.log('🔍 [Form Submission] Raw form industry_tags:', data.industry_tags)
    console.log('🔍 [Form Submission] Raw form business_model_tags:', data.business_model_tags)
    console.log('🔍 [Form Submission] Cleaned keywords:', cleanedData.keywords)
    console.log('🔍 [Form Submission] Cleaned industry_tags:', cleanedData.industry_tags)
    console.log('🔍 [Form Submission] Cleaned business_model_tags:', cleanedData.business_model_tags)
    
    // Comprehensive pre-submission validation
    const preValidation = validateInvestmentSubmission(cleanedData, investmentData)
    console.log('🚀 [Form Submission] Pre-validation result:', preValidation)
    
    if (!preValidation.isValid) {
      console.error('❌ [Form Submission] Pre-submission validation failed:', preValidation.errors)
      setStepErrors({ 
        submission: preValidation.errors.join('; '),
        ...preValidation.warnings.length > 0 && { warnings: preValidation.warnings.join('; ') }
      })
      return
    }
    
    // Final validation with complete schema
    try {
      console.log('🚀 [Form Submission] Running final schema validation...')
      const validatedData = await companySchema.parseAsync(cleanedData)
      console.log('✅ [Form Submission] Schema validation passed')
      
      clearDraft() // Clear draft on successful submission
      console.log('🚀 [Form Submission] Calling onSave...')
      await onSave(validatedData, selectedVcs, investmentData)
    } catch (error: unknown) {
      console.error('❌ [Form Submission] Form validation failed:', error)
      
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

  const handleClearForm = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear the form? All entered data will be lost.'
    )
    
    if (confirmed) {
      clearDraft() // Clear draft and show toast notification
      reset({}) // Reset form to empty state
      setStep(0) // Reset to first step
      // Force a page reload to ensure complete reset
      window.location.reload()
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

      <form onSubmit={handleSubmit(handleFormSubmit)} onKeyDown={(e) => {
        // Prevent Enter key from submitting form unless on submit button
        if (e.key === 'Enter' && e.target !== e.currentTarget) {
          const target = e.target as HTMLElement;
          if (target.tagName !== 'BUTTON' && target.getAttribute('type') !== 'submit') {
            e.preventDefault();
          }
        }
      }} className="space-y-6">
        {/* Current step */}
        {steps[step].component}
        
        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handleClearForm}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            Clear form
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
                disabled={isAnySaving || Object.keys(stepErrors).length > 0}
                className="bg-cobalt-pulse hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition-colors font-medium"
              >
                {saving ? 'Creating Investment...' : isDraftSaving ? 'Saving Draft...' : 'Create Investment'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// Main wizard component that provides form context
export default function InvestmentWizard({ onSave, onCancel, saving = false }: InvestmentWizardProps) {
  const formMethods = useForm({
    resolver: zodResolver(partialCompanySchema), // Use partial schema for real-time validation
    mode: 'onChange', // Validate on change for real-time feedback
    reValidateMode: 'onChange', // Re-validate on change
    shouldUnregister: false, // keep values when steps unmount
    defaultValues: {
      has_pro_rata_rights: false, // Keep this as it's a boolean checkbox
      fund: 'fund_i' as const, // Default to Fund I (most commonly used)
      status: 'active' as const, // Always default to active for new investments
      // founders array will be initialized in AdditionalInfoStep component
      // Removed: stage_at_investment, instrument - these should be explicitly selected
    },
  })

  return (
    <FormProvider {...formMethods}>
      <WizardContent onSave={onSave} onCancel={onCancel} saving={saving} />
    </FormProvider>
  )
}

// ────────────────────────────────────────────────────────────────────
// 🧪 PROTECTION FEATURES SUMMARY
// ────────────────────────────────────────────────────────────────────
// 
// 1. **Browser Leave Protection**: Prevents closing tab/window with unsaved changes
// 2. **Router Navigation Protection**: Prevents in-app navigation with unsaved changes  
// 3. **Cancel Button Protection**: Confirms before canceling with unsaved changes
// 4. **Visual Indicators**: Shows "Unsaved changes" and "Auto-saving..." status
// 5. **Draft Persistence**: Auto-saves form data every 700ms
// 
// **How to Test:**
// - Fill out any form field
// - Try to close browser tab → Should show "Leave site?" confirmation
// - Try to navigate to another page → Should show confirmation dialog
// - Click Cancel button → Should show confirmation dialog
// - Watch for visual indicators in the header
// ──────────────────────────────────────────────────────────────────── 
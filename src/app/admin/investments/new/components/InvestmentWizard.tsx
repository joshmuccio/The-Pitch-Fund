'use client'

import { useState, useEffect } from 'react'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { companySchema, type CompanyFormValues, getStepFieldNames, validateStep } from '../../../schemas/companySchema'
import { useDraftPersist } from '@/hooks/useDraftPersist'
import AngelListStep from '../steps/AngelListStep'
import AdditionalInfoStep from '../steps/AdditionalInfoStep'

interface InvestmentWizardProps {
  onSave: (data: CompanyFormValues) => void
  onCancel: () => void
  saving?: boolean
}

// Internal wizard content that uses the form context
function WizardContent({ onSave, onCancel, saving = false }: InvestmentWizardProps) {
  const [step, setStep] = useState(0)
  const [stepErrors, setStepErrors] = useState<Record<string, any>>({})
  const { handleSubmit, formState, reset, trigger, getValues } = useFormContext<CompanyFormValues>()
  const router = useRouter()

  // Draft persistence with auto-save
  const { clearDraft, isSaving: isDraftSaving, hasUnsavedChanges } = useDraftPersist<CompanyFormValues>('investmentWizardDraft')
  
  // Track combined saving state
  const isAnySaving = saving || isDraftSaving

  // Debug logging for protection state
  useEffect(() => {
    if (hasUnsavedChanges) {
      console.log('🔄 [InvestmentWizard] Protection Active - form has unsaved changes')
    }
  }, [hasUnsavedChanges])

  // ────────────────────────────────────────────────────────────────────
  // 🛡️ DATA PERSISTENCE SYSTEM (No popups - drafts survive page refresh)
  // ────────────────────────────────────────────────────────────────────

  const steps = [
    {
      title: '⚡ Company & Investment Details',
      description: 'AngelList fields that can be auto-populated',
      component: <AngelListStep key={0} customErrors={stepErrors} />
    },
    {
      title: '📋 Company & Founders (1-3)',
      description: 'Company details, HQ location, and founder information', 
      component: <AdditionalInfoStep key={1} customErrors={stepErrors} />
    }
  ]

  const handleFormSubmit = async (data: any) => {
    // Validate the complete form before submission
    try {
      const validatedData = companySchema.parse(data)
      clearDraft() // Clear draft on successful submission
      await onSave(validatedData)
    } catch (error) {
      console.error('Form validation failed:', error)
      // The form will show errors automatically
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
    
    console.log(`🔍 [Validation] Step ${step + 1} - Validating fields:`, currentStepFields)
    
    // Get current form values for debugging
    const currentValues = getValues()
    const stepValues = Object.fromEntries(
      Object.entries(currentValues).filter(([key]) => currentStepFields.includes(key))
    )
    console.log(`🔍 [Validation] Step ${step + 1} - Current values:`, stepValues)
    
    // Use step-specific validation that doesn't affect touched state
    const validationResult = await validateStep(step, currentValues)
    
    console.log(`🔍 [Validation] Step ${step + 1} - Validation result:`, validationResult.isValid)
    console.log(`🔍 [Validation] Step ${step + 1} - Step-specific errors:`, validationResult.errors)
    
    // Enhanced error logging
    if (!validationResult.isValid) {
      console.log(`🔍 [Validation] Step ${step + 1} - Detailed error analysis:`)
      Object.entries(validationResult.errors).forEach(([field, error]) => {
        console.log(`  ❌ ${field}:`, error, 'Current value:', currentValues[field as keyof CompanyFormValues])
      })
    }
    
    if (validationResult.isValid) {
      console.log(`✅ [Validation] Step ${step + 1} - Validation passed, moving to next step`)
      // Clear any previous step errors
      setStepErrors({})
      setStep(step + 1)
    } else {
      // Set step-specific errors
      setStepErrors(validationResult.errors)
      
      const errorCount = Object.keys(validationResult.errors).length
      console.log(`❌ [Validation] Step ${step + 1} - Validation failed: ${errorCount} field(s) need attention`)
      
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
                {Object.keys(stepErrors).length} field(s) need attention
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

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
                disabled={isAnySaving}
                className="bg-cobalt-pulse hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-2 rounded transition-colors font-medium"
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
    resolver: zodResolver(companySchema), // Enable Zod validation for all fields
    mode: 'onChange', // Validate on change for real-time feedback
    reValidateMode: 'onChange', // Re-validate on change
    shouldUnregister: false, // keep values when steps unmount
    defaultValues: {
      has_pro_rata_rights: false,
      fund: 'fund_i' as const,
      stage_at_investment: 'pre_seed' as const,
      instrument: 'safe_post' as const,
      status: 'active' as const, // Always default to active for new investments
      founder_role: 'solo_founder' as const,
      // founders array will be initialized in AdditionalInfoStep component
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
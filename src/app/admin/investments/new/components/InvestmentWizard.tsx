'use client'

import { useState, useEffect } from 'react'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { companySchema, type CompanyFormValues } from '../../../schemas/companySchema'
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
  const { handleSubmit, formState } = useFormContext<CompanyFormValues>()
  const router = useRouter()
  
  // Use draft persistence for the wizard - now safely inside FormProvider
  const { clearDraft, isSaving: isDraftSaving } = useDraftPersist<CompanyFormValues>('investmentWizardDraft', 700)

  // Combined saving state: either server saving OR draft saving
  const isAnySaving = saving || isDraftSaving

  // Track draft saved state for better UX
  const [draftSaved, setDraftSaved] = useState(false)
  
  // Show "Draft saved" indicator for 3 seconds after auto-save
  useEffect(() => {
    if (isDraftSaving) {
      setDraftSaved(false) // Hide any existing "draft saved" indicator
    } else if (formState.isDirty && !saving) {
      // Draft just finished saving and we have unsaved changes
      setDraftSaved(true)
      const timer = setTimeout(() => setDraftSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isDraftSaving, formState.isDirty, saving])

  // Debug logging for form state changes (reduced noise)
  useEffect(() => {
    if (formState.isDirty && !isAnySaving) {
      console.log('🔄 [InvestmentWizard] Protection Active - form has unsaved changes');
    }
  }, [formState.isDirty, isAnySaving])

  // ────────────────────────────────────────────────────────────────────
  // 🛡️ PROTECTION FEATURES: Prevent accidental data loss
  // ────────────────────────────────────────────────────────────────────
  
  // 1. Leave-page guard: Prevent accidental browser/tab closing
  useEffect(() => {
    const hasUnsavedChanges = formState.isDirty && !isAnySaving
    
    if (!hasUnsavedChanges) return
    
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // Chrome requires returnValue to be set
    }
    
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [formState.isDirty, isAnySaving])

  // 2. Router navigation guard: Prevent in-app navigation with unsaved changes
  useEffect(() => {
    const hasUnsavedChanges = formState.isDirty && !isAnySaving
    
    if (!hasUnsavedChanges) return
    
    // Override the router's push method to show confirmation
    const originalPush = router.push
    router.push = (href: string, options?: any) => {
      if (formState.isDirty && !isAnySaving) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
        )
        if (!confirmLeave) return Promise.resolve(false)
      }
      return originalPush.call(router, href, options)
    }
    
    // Cleanup: restore original push method
    return () => {
      router.push = originalPush
    }
  }, [formState.isDirty, isAnySaving, router])

  // ────────────────────────────────────────────────────────────────────

  const steps = [
    {
      title: '⚡ Company & Investment Details',
      description: 'AngelList fields that can be auto-populated',
      component: <AngelListStep key={0} />
    },
    {
      title: '📋 Additional Information',
      description: 'Manual entry fields and founder details', 
      component: <AdditionalInfoStep key={1} />
    }
  ]

  const handleFormSubmit = async (data: CompanyFormValues) => {
    clearDraft() // Clear draft on successful submission
    await onSave(data)
  }

  // 3. Cancel confirmation: Confirm before losing unsaved changes
  const handleCancel = () => {
    if (formState.isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      )
      if (!confirmLeave) return
    }
    
    clearDraft() // Clear draft when canceling
    onCancel()
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
            {/* Status indicators - prioritized display */}
            {isDraftSaving && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Auto-saving...
              </div>
            )}
            {draftSaved && !isDraftSaving && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                Draft saved!
              </div>
            )}
            {formState.isDirty && !isAnySaving && !draftSaved && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Unsaved changes
              </div>
                          )}
              <div className="text-sm text-gray-400">
              Step {step + 1} of {steps.length}
            </div>
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
            onClick={handleCancel}
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
                onClick={() => setStep(step + 1)}
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
    resolver: zodResolver(companySchema),
    mode: 'onBlur' as const,
    shouldUnregister: false, // keep values when steps unmount
    defaultValues: {
      has_pro_rata_rights: false,
      fund: 'fund_i',
      stage_at_investment: 'pre_seed',
      instrument: 'safe_post',
      status: 'active', // Always default to active for new investments
      founder_role: 'solo_founder',
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
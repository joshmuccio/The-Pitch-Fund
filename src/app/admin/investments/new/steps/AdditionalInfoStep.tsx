'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { useEffect, useRef } from 'react'
import { type Step2FormValues } from '../../../schemas/companySchema'
import { countries } from '@/lib/countries'
import Step2QuickPastePanel from '@/components/Step2QuickPastePanel'

interface AdditionalInfoStepProps {
  customErrors?: Record<string, any>
}

export default function AdditionalInfoStep({ customErrors = {} }: AdditionalInfoStepProps) {
  const { 
    register, 
    control,
    formState: { errors, touchedFields }
  } = useFormContext<Step2FormValues>()

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
        bio: ''
      })
    } else if (fields.length > 0) {
      // If there are already founders (e.g., from draft restoration), don't initialize
      hasInitialized.current = true
      console.log('🔧 [AdditionalInfoStep] Found existing founders, skipping initialization. Count:', fields.length);
    }
  }, [fields.length, append])

  const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
    // Prioritize custom errors from step validation
    const customError = customErrors[fieldName]
    const formError = errors[fieldName as keyof Step2FormValues]
    const isTouched = touchedFields[fieldName as keyof Step2FormValues]
    
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

  const addFounder = () => {
    if (fields.length < 3) {
      append({
        first_name: '',
        last_name: '',
        title: '',
        email: '',
        linkedin_url: '',
        role: 'cofounder',
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
            Required company details, marketing information, and headquarters location
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tagline *
              </label>
              <input
                type="text"
                {...register('tagline')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  errors.tagline ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="One line description"
                required
                minLength={10}
                maxLength={200}
              />
              <ErrorDisplay fieldName="tagline" />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Website URL *
              </label>
              <input
                type="url"
                {...register('website_url')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  errors.website_url ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="https://example.com"
                required
                pattern="https?://.+"
              />
              <ErrorDisplay fieldName="website_url" />
            </div>

            {/* Legal Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Legal Entity Name
              </label>
              <input
                type="text"
                {...register('legal_name')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="e.g. Example Corp."
              />
              <ErrorDisplay fieldName="legal_name" />
            </div>

            {/* Company LinkedIn URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Company LinkedIn
              </label>
              <input
                type="url"
                {...register('company_linkedin_url')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="https://linkedin.com/company/..."
                pattern="https?://.+"
              />
              <ErrorDisplay fieldName="company_linkedin_url" />
            </div>

            {/* Industry Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Industry Tags
              </label>
              <input
                type="text"
                {...register('industry_tags')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="e.g. fintech, b2b, saas"
              />
              <ErrorDisplay fieldName="industry_tags" />
            </div>

            {/* Pitch Episode URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Pitch Episode URL
              </label>
              <input
                type="url"
                {...register('pitch_episode_url')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="https://..."
                pattern="https?://.+"
              />
              <ErrorDisplay fieldName="pitch_episode_url" />
            </div>

            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                {...register('hq_address_line_1')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
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
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="Suite 100 (optional)"
              />
              <ErrorDisplay fieldName="hq_address_line_2" />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                {...register('hq_city')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="San Francisco"
              />
              <ErrorDisplay fieldName="hq_city" />
            </div>

            {/* State/Province */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                State/Province
              </label>
              <input
                type="text"
                {...register('hq_state')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="CA"
              />
              <ErrorDisplay fieldName="hq_state" />
            </div>

            {/* ZIP/Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                ZIP/Postal Code
              </label>
              <input
                type="text"
                {...register('hq_zip_code')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="94102"
              />
              <ErrorDisplay fieldName="hq_zip_code" />
            </div>

            {/* HQ Country */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Country
              </label>
              <select
                {...register('hq_country')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
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
                      className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                      placeholder="John"
                      required
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
                      className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                      placeholder="Doe"
                      required
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
                      className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                      placeholder="founder@company.com"
                      required
                      autoComplete="email"
                    />
                    <ErrorDisplay fieldName={`founders.${index}.email`} />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      {...register(`founders.${index}.title`)}
                      className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                      placeholder="CEO, CTO, Co-Founder, etc."
                    />
                    <ErrorDisplay fieldName={`founders.${index}.title`} />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      {...register(`founders.${index}.linkedin_url`)}
                      className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                      placeholder="https://linkedin.com/in/..."
                      pattern="https?://.+"
                    />
                    <ErrorDisplay fieldName={`founders.${index}.linkedin_url`} />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Founder Role
                    </label>
                    <select
                      {...register(`founders.${index}.role`)}
                      className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                    >
                      <option value="founder">Founder</option>
                      <option value="cofounder">Co-Founder</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    {...register(`founders.${index}.bio`)}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                    rows={3}
                    placeholder="Brief background and experience..."
                    maxLength={1000}
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
        <Step2QuickPastePanel />
      </div>
    </div>
  )
} 
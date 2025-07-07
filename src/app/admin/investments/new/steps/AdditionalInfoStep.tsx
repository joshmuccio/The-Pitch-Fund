'use client'

import { useFormContext } from 'react-hook-form'
import { type CompanyFormValues } from '../../../schemas/companySchema'

interface AdditionalInfoStepProps {
  customErrors?: Record<string, any>
}

export default function AdditionalInfoStep({ customErrors = {} }: AdditionalInfoStepProps) {
  const { 
    register, 
    formState: { errors, touchedFields }
  } = useFormContext<CompanyFormValues>()

  const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
    // Prioritize custom errors from step validation
    const customError = customErrors[fieldName]
    const formError = errors[fieldName as keyof CompanyFormValues]
    const isTouched = touchedFields[fieldName as keyof CompanyFormValues]
    
    // Show custom error if it exists, otherwise show form error only if touched
    const error = customError || (isTouched ? formError : null)
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
      <div className="text-red-400 text-xs mt-1">
        {message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Additional Information Section */}
      <div className="border border-gray-600 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
          📋 Additional Information
        </h4>
        <p className="text-sm text-gray-400 mb-4">
          These fields are not auto-populated and must be filled manually
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
            />
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
            />
            <ErrorDisplay fieldName="pitch_episode_url" />
          </div>
        </div>
      </div>

      {/* Founder Information Section */}
      <div className="border border-gray-600 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
          👤 Additional Founder Information
        </h4>
        <p className="text-sm text-gray-400 mb-4">
          Additional founder details not included in AngelList memos
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Founder Email *
            </label>
            <input
              type="email"
              {...register('founder_email')}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                errors.founder_email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="founder@company.com"
            />
            <ErrorDisplay fieldName="founder_email" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Founder LinkedIn
            </label>
            <input
              type="url"
              {...register('founder_linkedin_url')}
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              placeholder="https://linkedin.com/in/..."
            />
            <ErrorDisplay fieldName="founder_linkedin_url" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Founder Role
            </label>
            <select
              {...register('founder_role')}
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
            >
              <option value="solo_founder">Solo Founder</option>
              <option value="cofounder">Co-Founder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Founder Gender
            </label>
            <select
              {...register('founder_sex')}
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Founder Bio
          </label>
          <textarea
            {...register('founder_bio')}
            className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
            rows={3}
            placeholder="Brief background and experience..."
          />
          <ErrorDisplay fieldName="founder_bio" />
        </div>
      </div>
    </div>
  )
} 
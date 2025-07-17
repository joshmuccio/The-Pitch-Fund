'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import ProfileImageUploader from '@/components/ProfileImageUploader'
import { VcSchema, type VcFormData } from '@/lib/validation-schemas'

// URL validation status type
type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

interface Vc {
  id: string
  name: string
  firm_name: string | null
  role_title: string | null
  bio: string | null
  profile_image_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  wikipedia_url: string | null
  website_url: string | null
  podcast_url: string | null
  thepitch_profile_url: string | null
  created_at: string
  updated_at: string
}

interface VcEditModalProps {
  vc: Vc | null
  onClose: () => void
  onVcUpdated: (vc: Vc) => void
  onVcDeleted: (vcId: string) => void
}

export default function VcEditModal({ vc, onClose, onVcUpdated, onVcDeleted }: VcEditModalProps) {
  const isNew = !vc?.id
  
  // React Hook Form with Zod validation
  const form = useForm<VcFormData>({
    resolver: zodResolver(VcSchema),
    defaultValues: {
      name: '',
      firm_name: '',
      role_title: '',
      bio: '',
      profile_image_url: '',
      linkedin_url: '',
      twitter_url: '',
      instagram_url: '',
      youtube_url: '',
      website_url: '',
      podcast_url: '',
      thepitch_profile_url: ''
    }
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = form
  const formData = watch() // Watch all form values
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  
  // URL validation states
  const [urlValidationStatus, setUrlValidationStatus] = useState<Record<string, ValidationStatus>>({})
  const [urlValidationErrors, setUrlValidationErrors] = useState<Record<string, string>>({})

  // URL fields that should be validated
  const urlFields = ['profile_image_url', 'linkedin_url', 'twitter_url', 'instagram_url', 'tiktok_url', 'youtube_url', 'wikipedia_url', 'website_url', 'podcast_url', 'thepitch_profile_url']

  // Helper function to get CSS classes for URL fields based on validation status
  const getUrlFieldClasses = (fieldName: string) => {
    const baseClasses = 'w-full px-3 py-2 bg-pitch-black text-platinum-mist focus:outline-none'
    const hasError = urlValidationErrors[fieldName]
    const status = urlValidationStatus[fieldName]
    
    let borderClass = 'border border-gray-600'
    
    if (hasError || status === 'invalid') {
      borderClass = 'border border-red-500'
    } else if (status === 'valid') {
      borderClass = 'border border-green-500'
    } else if (status === 'validating') {
      borderClass = 'border border-blue-400'
    }
    
    return `${baseClasses} ${borderClass} rounded focus:border-cobalt-pulse`
  }

  // Initialize form data when VC changes
  useEffect(() => {
    if (vc?.id) {
      const formData = {
        name: vc.name || '',
        firm_name: vc.firm_name || '',
        role_title: vc.role_title || '',
        bio: vc.bio || '',
        profile_image_url: vc.profile_image_url || '',
        linkedin_url: vc.linkedin_url || '',
        twitter_url: vc.twitter_url || '',
        instagram_url: vc.instagram_url || '',
        tiktok_url: vc.tiktok_url || '',
        youtube_url: vc.youtube_url || '',
        wikipedia_url: vc.wikipedia_url || '',
        website_url: vc.website_url || '',
        podcast_url: vc.podcast_url || '',
        thepitch_profile_url: vc.thepitch_profile_url || ''
      }
      
      reset(formData)
      
      // Validate any pre-existing URLs
      console.log('🔄 [Form Init] Validating pre-existing URLs for existing VC')
      urlFields.forEach(field => {
        const url = formData[field as keyof typeof formData] as string
        if (url && url.trim() !== '') {
          console.log(`🔄 [Form Init] Validating pre-existing URL for ${field}:`, url)
          validateUrl(field, url)
        }
      })
      
    } else {
      // Reset form for new VC
      console.log('🆕 [Form Init] Resetting form for new VC')
      reset({
        name: '',
        firm_name: '',
        role_title: '',
        bio: '',
        profile_image_url: '',
        linkedin_url: '',
        twitter_url: '',
        instagram_url: '',
        tiktok_url: '',
        youtube_url: '',
        wikipedia_url: '',
        website_url: '',
        podcast_url: '',
        thepitch_profile_url: ''
      })
      
      // Clear validation status for new VC
      setUrlValidationStatus({})
      setUrlValidationErrors({})
    }
  }, [vc, reset])

  const handleInputChange = (field: keyof VcFormData, value: string | number | string[]) => {
    setValue(field, value as any)
    setError('')
  }

  // Function to upload an image from URL to Vercel Blob
  const uploadImageFromUrl = useCallback(async (imageUrl: string): Promise<string | null> => {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return null
    }

    try {
      console.log('📸 [VcEditModal] Uploading image from URL to Vercel Blob:', imageUrl)
      
      // Fetch the image
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      
      // Get the blob
      const imageBlob = await response.blob()
      
      // Determine file extension and MIME type from the original URL and blob
      const urlExtension = imageUrl.split('.').pop()?.toLowerCase()
      const isWebP = urlExtension === 'webp' || imageBlob.type === 'image/webp'
      const isJpeg = urlExtension === 'jpeg'
      
      // Preserve original extension for better compatibility
      let fileExtension = 'jpg' // default
      let mimeType = 'image/jpeg' // default
      
      if (isWebP) {
        fileExtension = 'webp'
        mimeType = 'image/webp'
      } else if (isJpeg) {
        fileExtension = 'jpeg'
        mimeType = 'image/jpeg'
      }
      
      // Create a File object for upload with proper extension and MIME type
      const fileName = `profile-${Date.now()}.${fileExtension}`
      const file = new File([imageBlob], fileName, { type: imageBlob.type || mimeType })
      
      // Upload to Vercel Blob using the same logic as ProfileImageUploader
      const { upload } = await import('@vercel/blob/client')
      const blob = await upload(`profile-images/${fileName}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-logo',
      })
      
      console.log('✅ [VcEditModal] Image uploaded to Vercel Blob:', blob.url)
      return blob.url
      
    } catch (error) {
      console.error('❌ [VcEditModal] Failed to upload image from URL:', error)
      Sentry.captureException(error, {
        tags: { component: 'VcEditModal', operation: 'upload_image_from_url' },
        extra: { originalUrl: imageUrl }
      })
      return null
    }
  }, [])

  // URL validation function
  const validateUrl = async (url: string, fieldName: string): Promise<boolean> => {
    console.log(`🌐 [URL Validation] Starting validation for ${fieldName}:`, url)
    
    if (!url || url.trim() === '') {
      console.log(`🌐 [URL Validation] Empty URL for ${fieldName}, skipping validation`)
      setUrlValidationStatus(prev => ({ ...prev, [fieldName]: 'idle' }))
      setUrlValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
      return true
    }

    // Validate URL format first
    try {
      new URL(url)
      console.log(`🌐 [URL Validation] URL format is valid for ${fieldName}`)
    } catch {
      console.log(`🌐 [URL Validation] Invalid URL format for ${fieldName}`)
      setUrlValidationStatus(prev => ({ ...prev, [fieldName]: 'invalid' }))
      setUrlValidationErrors(prev => ({ ...prev, [fieldName]: 'Please enter a valid URL' }))
      return false
    }

    // Set validating status
    setUrlValidationStatus(prev => ({ ...prev, [fieldName]: 'validating' }))
    
    try {
      console.log(`🌐 [URL Validation] Making API call for ${fieldName}:`, url)
      const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`)
      const responseData = await response.json()
      console.log(`📡 [URL Validation] API response for ${fieldName}:`, responseData)
      
      const { ok, status, finalUrl, error } = responseData
      
      if (ok) {
        console.log(`✅ [URL Validation] URL is valid for ${fieldName}`)
        setUrlValidationStatus(prev => ({ ...prev, [fieldName]: 'valid' }))
        setUrlValidationErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[fieldName]
          return newErrors
        })
        
        // Update URL if redirected, but skip Instagram login redirects
        if (finalUrl && finalUrl !== url) {
          console.log(`🔄 [URL Validation] Redirect detected for ${fieldName}:`, url, '→', finalUrl)
          
          // Don't update form field for Instagram URLs that redirect to login pages
          const isInstagramLoginRedirect = 
            fieldName === 'instagram_url' && 
            finalUrl.toLowerCase().includes('/accounts/login/')
          
          if (isInstagramLoginRedirect) {
            console.log(`📌 [URL Validation] Keeping original Instagram URL in form field: ${url}`)
          } else {
            setValue(fieldName as keyof VcFormData, finalUrl)
          }
        }
        
        return true
      } else {
        console.log(`❌ [URL Validation] URL is invalid for ${fieldName}, status:`, status)
        // Use specific error message if available, otherwise generic message
        const errorMsg = error || `URL responded ${status ?? 'with an error'}. Please check the URL and try again.`
        setUrlValidationStatus(prev => ({ ...prev, [fieldName]: 'invalid' }))
        setUrlValidationErrors(prev => ({ ...prev, [fieldName]: errorMsg }))
        return false
      }
    } catch (error) {
      console.log(`💥 [URL Validation] Error validating ${fieldName}:`, error)
      setUrlValidationStatus(prev => ({ ...prev, [fieldName]: 'invalid' }))
      setUrlValidationErrors(prev => ({ ...prev, [fieldName]: 'Unable to validate URL. Please check your connection and try again.' }))
      return false
    }
  }



  // Auto-scrape when ThePitch.show URL is pasted
  const handleProfileUrlChange = async (url: string) => {
    handleInputChange('thepitch_profile_url', url)
    
    // Auto-scrape if it looks like a valid thepitch.show URL
    if (url.includes('thepitch.show/guests/') && !urlValidationStatus.thepitch_profile_url) {
      await validateUrl(url, 'thepitch_profile_url')
    }
  }

  const handleManualScrape = async () => {
    await validateUrl(formData.thepitch_profile_url, 'thepitch_profile_url')
  }

  // Profile image upload handlers
  const handleProfileImageUploadSuccess = useCallback((url: string) => {
    console.log('📸 [VcEditModal] Profile image upload successful:', url)
    handleInputChange('profile_image_url', url)
  }, [])

  const handleProfileImageUploadError = useCallback((error: string) => {
    console.error('❌ [VcEditModal] Profile image upload failed:', error)
    setError(`Profile image upload failed: ${error}`)
  }, [])

  const validateForm = () => {
    console.log('🔍 [Form Validation] Starting form validation')
    console.log('🔍 [Form Validation] Current formData:', formData)
    console.log('🔍 [Form Validation] Current urlValidationStatus:', urlValidationStatus)
    
    // Check URL validation status for fields that have values
    const invalidUrls: string[] = []
    const validatingUrls: string[] = []
    
    urlFields.forEach(field => {
      const url = formData[field as keyof typeof formData] as string
      const status = urlValidationStatus[field]
      
      console.log(`🔍 [Form Validation] Field ${field}: URL="${url}", Status="${status}"`)
      
      // Only check status if field has a value
      if (url && url.trim() !== '') {
        if (status === 'invalid') {
          invalidUrls.push(field.replace(/_/g, ' '))
          console.log(`❌ [Form Validation] Invalid URL detected: ${field}`)
        } else if (status === 'validating') {
          validatingUrls.push(field.replace(/_/g, ' '))
          console.log(`⏳ [Form Validation] Validating URL detected: ${field}`)
        } else if (status === 'valid') {
          console.log(`✅ [Form Validation] Valid URL: ${field}`)
        } else {
          console.log(`🤔 [Form Validation] Unknown status for ${field}: ${status}`)
        }
      }
    })
    
    // Block save if there are invalid or validating URLs
    if (invalidUrls.length > 0) {
      console.log(`🚫 [Form Validation] Blocking save due to invalid URLs:`, invalidUrls)
      setError(`Please fix invalid URLs: ${invalidUrls.join(', ')}`)
      return false
    }
    
    if (validatingUrls.length > 0) {
      console.log(`🚫 [Form Validation] Blocking save due to validating URLs:`, validatingUrls)
      setError(`Please wait for URL validation to complete: ${validatingUrls.join(', ')}. This usually takes just a few seconds.`)
      return false
    }
    
    console.log('✅ [Form Validation] Form validation passed')
    return true
  }

  const handleSave = async (data: VcFormData) => {
    console.log('💾 [Form Save] Starting form save with data:', data)
    console.log('💾 [Form Save] React Hook Form errors:', errors)
    
    if (!validateForm()) {
      console.log('🚫 [Form Save] Form validation failed, aborting save')
      return
    }

    console.log('✅ [Form Save] Form validation passed, proceeding with save')
    setLoading(true)
    setError('')

    try {
      const payload = {
        name: data.name.trim(),
        // Clean up empty strings to null
        firm_name: data.firm_name.trim() || null,
        role_title: data.role_title.trim() || null,
        bio: data.bio?.trim() || null,
        profile_image_url: data.profile_image_url?.trim() || null,
              linkedin_url: data.linkedin_url?.trim() || null,
      twitter_url: data.twitter_url?.trim() || null,
      instagram_url: data.instagram_url?.trim() || null,
      tiktok_url: data.tiktok_url?.trim() || null,
      youtube_url: data.youtube_url?.trim() || null,
      wikipedia_url: data.wikipedia_url?.trim() || null,
      website_url: data.website_url?.trim() || null,
      podcast_url: data.podcast_url?.trim() || null,
        thepitch_profile_url: data.thepitch_profile_url?.trim() || null,
      }

      if (isNew) {
        console.log('🆕 [VcEditModal] Creating new VC:', payload.name)
        
        const response = await fetch('/api/vcs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to create VC')

        console.log('✅ [VcEditModal] VC created successfully')
        onVcUpdated(result.vc)
      } else {
        console.log('🔄 [VcEditModal] Updating VC:', vc?.name)
        
        const response = await fetch('/api/vcs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: vc?.id, ...payload }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to update VC')

        console.log('✅ [VcEditModal] VC updated successfully')
        onVcUpdated(result.vc)
      }
    } catch (error: any) {
      console.error('❌ [VcEditModal] Save failed:', error)
      setError(error.message || 'Failed to save VC. Please try again.')
      Sentry.captureException(error, {
        tags: { component: 'VcEditModal', operation: isNew ? 'create' : 'update' },
        extra: { vcId: vc?.id, formData }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!vc?.id) return

    setLoading(true)
    setError('')

    try {
      console.log('🗑️ [VcEditModal] Deleting VC:', vc.name)
      
      const response = await fetch(`/api/vcs?id=${vc.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to delete VC')

      console.log('✅ [VcEditModal] VC deleted successfully')
      onVcDeleted(vc.id)
    } catch (error: any) {
      console.error('❌ [VcEditModal] Delete failed:', error)
      setError(error.message || 'Failed to delete VC. Please try again.')
      setShowConfirmDelete(false)
      Sentry.captureException(error, {
        tags: { component: 'VcEditModal', operation: 'delete' },
        extra: { vcId: vc?.id }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-graphite-gray rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-platinum-mist">
              {isNew ? '➕ Add New VC' : `✏️ Edit ${vc?.name}`}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-platinum-mist transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                    errors.name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Full name"
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Firm Name
                </label>
                <input
                  type="text"
                  {...register('firm_name')}
                  className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                    errors.firm_name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Venture capital firm name"
                  disabled={loading}
                />
                {errors.firm_name && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.firm_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  {...register('role_title')}
                  className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                    errors.role_title ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="e.g. Partner, Managing Director"
                  disabled={loading}
                />
                {errors.role_title && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.role_title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  {...register('bio')}
                  className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                    errors.bio ? 'border-red-500' : 'border-gray-600'
                  }`}
                  rows={4}
                  placeholder="Brief professional biography"
                  disabled={loading}
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.bio.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Profile Image URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('profile_image_url')}
                    className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                      errors.profile_image_url ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="https://..."
                    disabled={loading}
                  />
                  {urlValidationStatus.profile_image_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.profile_image_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.profile_image_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.profile_image_url.message}</p>
                )}
                {urlValidationErrors.profile_image_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.profile_image_url}</p>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('linkedin_url')}
                    className={getUrlFieldClasses('linkedin_url')}
                    placeholder="https://linkedin.com/in/..."
                    disabled={loading}
                  />
                  {urlValidationStatus.linkedin_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.linkedin_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.linkedin_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.linkedin_url.message}</p>
                )}
                {urlValidationErrors.linkedin_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.linkedin_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Twitter URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('twitter_url')}
                    className={getUrlFieldClasses('twitter_url')}
                    placeholder="https://twitter.com/..."
                    disabled={loading}
                  />
                  {urlValidationStatus.twitter_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.twitter_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.twitter_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.twitter_url.message}</p>
                )}
                {urlValidationErrors.twitter_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.twitter_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Instagram URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('instagram_url')}
                    className={getUrlFieldClasses('instagram_url')}
                    placeholder="https://instagram.com/..."
                    disabled={loading}
                  />
                  {urlValidationStatus.instagram_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.instagram_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.instagram_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.instagram_url.message}</p>
                )}
                {urlValidationErrors.instagram_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.instagram_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  TikTok URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('tiktok_url')}
                    className={getUrlFieldClasses('tiktok_url')}
                    placeholder="https://tiktok.com/..."
                    disabled={loading}
                  />
                  {urlValidationStatus.tiktok_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.tiktok_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.tiktok_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.tiktok_url.message}</p>
                )}
                {urlValidationErrors.tiktok_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.tiktok_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  YouTube URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('youtube_url')}
                    className={getUrlFieldClasses('youtube_url')}
                    placeholder="https://youtube.com/..."
                    disabled={loading}
                  />
                  {urlValidationStatus.youtube_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.youtube_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.youtube_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.youtube_url.message}</p>
                )}
                {urlValidationErrors.youtube_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.youtube_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Wikipedia URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('wikipedia_url')}
                    className={getUrlFieldClasses('wikipedia_url')}
                    placeholder="https://en.wikipedia.org/wiki/..."
                    disabled={loading}
                  />
                  {urlValidationStatus.wikipedia_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.wikipedia_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.wikipedia_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.wikipedia_url.message}</p>
                )}
                {urlValidationErrors.wikipedia_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.wikipedia_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Website URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('website_url')}
                    className={getUrlFieldClasses('website_url')}
                    placeholder="https://..."
                    disabled={loading}
                  />
                  {urlValidationStatus.website_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.website_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.website_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.website_url.message}</p>
                )}
                {urlValidationErrors.website_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.website_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Podcast URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('podcast_url')}
                    className={getUrlFieldClasses('podcast_url')}
                    placeholder="https://..."
                    disabled={loading}
                  />
                  {urlValidationStatus.podcast_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.podcast_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.podcast_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.podcast_url.message}</p>
                )}
                {urlValidationErrors.podcast_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.podcast_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  ThePitch.show Profile URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    {...register('thepitch_profile_url')}
                    className={getUrlFieldClasses('thepitch_profile_url')}
                    placeholder="https://thepitch.show/guests/..."
                    disabled={loading}
                  />
                  {urlValidationStatus.thepitch_profile_url === 'validating' && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                  {urlValidationStatus.thepitch_profile_url === 'valid' && (
                    <div className="absolute right-3 top-2">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                {errors.thepitch_profile_url && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errors.thepitch_profile_url.message}</p>
                )}
                {urlValidationErrors.thepitch_profile_url && (
                  <p className="text-red-400 text-sm mt-1">⚠ {urlValidationErrors.thepitch_profile_url}</p>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div>
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
                    disabled={loading}
                  >
                    Delete VC
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 hover:text-platinum-mist transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || Object.keys(errors).length > 0}
                  className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(loading) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {loading ? 'Saving...' : (isNew ? 'Create VC' : 'Update VC')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-graphite-gray rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-platinum-mist mb-4">
              ⚠️ Confirm Deletion
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <strong>{vc?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-gray-300 hover:text-platinum-mist transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {loading ? 'Deleting...' : 'Delete VC'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
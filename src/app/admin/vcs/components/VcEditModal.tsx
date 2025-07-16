'use client'

import { useState, useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface Vc {
  id: string
  name: string
  firm_name: string | null
  role_title: string | null
  bio: string | null
  profile_image_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  website_url: string | null
  podcast_url: string | null
  seasons_appeared: string[]
  total_episodes_count: number
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
  const [formData, setFormData] = useState({
    name: '',
    firm_name: '',
    role_title: '',
    bio: '',
    profile_image_url: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: '',
    podcast_url: '',
    seasons_appeared: [] as string[],
    total_episodes_count: 0,
    thepitch_profile_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // Initialize form data when VC changes
  useEffect(() => {
    if (vc?.id) {
      setFormData({
        name: vc.name || '',
        firm_name: vc.firm_name || '',
        role_title: vc.role_title || '',
        bio: vc.bio || '',
        profile_image_url: vc.profile_image_url || '',
        linkedin_url: vc.linkedin_url || '',
        twitter_url: vc.twitter_url || '',
        website_url: vc.website_url || '',
        podcast_url: vc.podcast_url || '',
        seasons_appeared: vc.seasons_appeared || [],
        total_episodes_count: vc.total_episodes_count || 0,
        thepitch_profile_url: vc.thepitch_profile_url || ''
      })
    } else {
      // Reset form for new VC
      setFormData({
        name: '',
        firm_name: '',
        role_title: '',
        bio: '',
        profile_image_url: '',
        linkedin_url: '',
        twitter_url: '',
        website_url: '',
        podcast_url: '',
        seasons_appeared: [],
        total_episodes_count: 0,
        thepitch_profile_url: ''
      })
    }
  }, [vc])

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSeasonsChange = (seasonsString: string) => {
    const seasons = seasonsString
      .split(',')
      .map(s => s.trim())
      .filter(s => s && /^\d+$/.test(s))
    handleInputChange('seasons_appeared', seasons)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('VC name is required')
      return false
    }
    
    // Validate URLs if provided
    const urlFields = [
      'profile_image_url', 'linkedin_url', 'twitter_url', 
      'website_url', 'podcast_url', 'thepitch_profile_url'
    ]
    
    for (const field of urlFields) {
      const url = formData[field as keyof typeof formData] as string
      if (url && url.trim()) {
        try {
          new URL(url)
        } catch {
          setError(`Invalid URL format for ${field.replace('_', ' ')}`)
          return false
        }
      }
    }
    
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        // Clean up empty strings to null
        firm_name: formData.firm_name.trim() || null,
        role_title: formData.role_title.trim() || null,
        bio: formData.bio.trim() || null,
        profile_image_url: formData.profile_image_url.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        twitter_url: formData.twitter_url.trim() || null,
        website_url: formData.website_url.trim() || null,
        podcast_url: formData.podcast_url.trim() || null,
        thepitch_profile_url: formData.thepitch_profile_url.trim() || null,
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
        onVcUpdated(result.data)
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
        onVcUpdated(result.data)
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
          <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="Charles Hudson"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Firm
                </label>
                <input
                  type="text"
                  value={formData.firm_name}
                  onChange={(e) => handleInputChange('firm_name', e.target.value)}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="Precursor Ventures"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role/Title
                </label>
                <input
                  type="text"
                  value={formData.role_title}
                  onChange={(e) => handleInputChange('role_title', e.target.value)}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="Managing Partner"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  value={formData.profile_image_url}
                  onChange={(e) => handleInputChange('profile_image_url', e.target.value)}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="Brief biography and background..."
              />
            </div>

            {/* Episode Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Seasons Appeared
                </label>
                <input
                  type="text"
                  value={formData.seasons_appeared.join(', ')}
                  onChange={(e) => handleSeasonsChange(e.target.value)}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="1, 2, 13"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Comma-separated season numbers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Total Episodes Count
                </label>
                <input
                  type="number"
                  value={formData.total_episodes_count}
                  onChange={(e) => handleInputChange('total_episodes_count', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Twitter URL
                </label>
                <input
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Podcast URL
                </label>
                <input
                  type="url"
                  value={formData.podcast_url}
                  onChange={(e) => handleInputChange('podcast_url', e.target.value)}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="https://podcast.example.com"
                />
              </div>
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                ThePitch.show Profile URL
              </label>
              <input
                type="url"
                value={formData.thepitch_profile_url}
                onChange={(e) => handleInputChange('thepitch_profile_url', e.target.value)}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="https://thepitch.show/guests/..."
              />
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
                  disabled={loading || !formData.name.trim()}
                  className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && (
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
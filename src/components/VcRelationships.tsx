'use client'

import { useState, useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface VcRelationship {
  id: string
  vc: {
    id: string
    name: string
    firm_name: string | null
    role_title: string | null
    profile_image_url: string | null
    linkedin_url: string | null
    twitter_url: string | null
    website_url: string | null
    podcast_url: string | null
    thepitch_profile_url: string | null
  }
  episode_url: string | null
  episode_season: string | null
  episode_number: string | null
  created_at: string
}

interface VcRelationshipsProps {
  companyId: string
  mode?: 'full' | 'compact' | 'minimal'
  showEpisodeContext?: boolean
  showManageButton?: boolean
  className?: string
}

export default function VcRelationships({ 
  companyId, 
  mode = 'full', 
  showEpisodeContext = true,
  showManageButton = false,
  className = ''
}: VcRelationshipsProps) {
  const [relationships, setRelationships] = useState<VcRelationship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (companyId) {
      fetchVcRelationships()
    }
  }, [companyId])

  const fetchVcRelationships = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔍 [VcRelationships] Fetching VC relationships for company: ${companyId}`)
      
      const response = await fetch(`/api/company-vcs?company_id=${companyId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch VC relationships')
      }
      
      console.log(`✅ [VcRelationships] Fetched ${result.data.length} VC relationships`)
      console.log(`🔍 [VcRelationships] Sample relationship data:`, result.data[0])
      console.log(`🔍 [VcRelationships] Full API response:`, result)
      setRelationships(result.data || [])
      
    } catch (error: any) {
      console.error('❌ [VcRelationships] Error fetching VC relationships:', error)
      setError(error.message || 'Failed to load VC relationships')
      Sentry.captureException(error, {
        tags: { component: 'VcRelationships', operation: 'fetchRelationships' },
        extra: { companyId }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
        <span className="text-gray-400 text-sm">Loading VCs...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-red-400 text-sm ${className}`}>
        Failed to load VC relationships
      </div>
    )
  }

  // Filter out relationships with missing VC data for display
  const validRelationships = relationships.filter(relationship => relationship.vc)
  
  console.log(`🔍 [VcRelationships] Rendering logic:`, {
    totalRelationships: relationships.length,
    validRelationships: validRelationships.length,
    sampleValidRelationship: validRelationships[0],
    loading,
    error
  })
  
  if (validRelationships.length === 0) {
    return null // Don't show anything if no valid VCs
  }

  const renderVcCard = (relationship: VcRelationship, isCompact: boolean = false) => {
    const vc = relationship.vc
    
    // Handle case where VC data is missing (orphaned relationship)
    if (!vc) {
      console.warn(`⚠️ [VcRelationships] Missing VC data for relationship ${relationship.id}`)
      return null
    }
    
    if (mode === 'minimal') {
      return (
        <span
          key={relationship.id}
          className="inline-flex items-center gap-1 bg-purple-600 text-white text-xs px-2 py-1 rounded"
        >
          {vc.profile_image_url && (
            <img
              src={vc.profile_image_url}
              alt={vc.name}
              className="w-4 h-4 rounded-full object-cover"
            />
          )}
          {vc.name}
          {vc.firm_name && (
            <span className="text-purple-200">({vc.firm_name})</span>
          )}
        </span>
      )
    }

    return (
      <div
        key={relationship.id}
        className={`border border-gray-600 rounded-lg p-3 hover:border-purple-500 transition-colors ${
          isCompact ? 'bg-gray-800/50' : 'bg-gray-800'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {vc.profile_image_url ? (
              <img
                src={vc.profile_image_url}
                alt={vc.name}
                className={`rounded-full object-cover ${
                  isCompact ? 'w-8 h-8' : 'w-10 h-10'
                }`}
              />
            ) : (
              <div className={`rounded-full bg-purple-600 flex items-center justify-center ${
                isCompact ? 'w-8 h-8' : 'w-10 h-10'
              }`}>
                <span className={`font-semibold text-white ${
                  isCompact ? 'text-sm' : 'text-base'
                }`}>
                  {vc.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* VC Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold text-platinum-mist ${
                isCompact ? 'text-sm' : 'text-base'
              }`}>
                {vc.name}
              </h4>
              {showEpisodeContext && relationship.episode_season && (
                <span className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                  S{relationship.episode_season}
                </span>
              )}
            </div>
            
            {vc.firm_name && (
              <p className={`text-gray-300 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                {vc.firm_name}
              </p>
            )}
            
            {vc.role_title && (
              <p className={`text-gray-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                {vc.role_title}
              </p>
            )}

            

            {/* Social Links */}
            {!isCompact && (
              <div className="flex gap-2 mt-2">
                {vc.linkedin_url && (
                  <a
                    href={vc.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="LinkedIn"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}

                {vc.twitter_url && (
                  <a
                    href={vc.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Twitter"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                )}

                {vc.website_url && (
                  <a
                    href={vc.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 transition-colors"
                    title="Website"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </a>
                )}

                {vc.thepitch_profile_url && (
                  <a
                    href={vc.thepitch_profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                    title="ThePitch Profile"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'minimal') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <span className="text-sm text-gray-400">VCs:</span>
        {validRelationships.map(relationship => renderVcCard(relationship, true))}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-platinum-mist flex items-center gap-2">
          <span>💼</span>
          VCs & Investors ({validRelationships.length})
        </h4>
        {showManageButton && (
          <button className="text-xs text-gray-400 hover:text-platinum-mist transition-colors">
            Manage
          </button>
        )}
      </div>
      
      <div className={`grid gap-3 ${
        mode === 'compact' 
          ? 'grid-cols-1 sm:grid-cols-2' 
          : 'grid-cols-1'
      }`}>
        {validRelationships.map(relationship => renderVcCard(relationship, mode === 'compact'))}
      </div>

      {showEpisodeContext && relationships.some(r => r.episode_url) && (
        <div className="mt-3 text-xs text-gray-400">
          <span>💡 VCs detected from episode context</span>
        </div>
      )}
    </div>
  )
} 
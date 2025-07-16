'use client'

import { useState, useEffect, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import * as Sentry from '@sentry/nextjs'
import { type CompanyFormValues } from '../../../schemas/companySchema'

export interface SelectedVc {
  id?: string
  name: string
  firm_name: string | null
  role_title: string | null
  profile_image_url: string | null
  linkedin_url: string | null
  isFromEpisode?: boolean
  episodeDetected?: boolean
}

interface VcSelectionStepProps {
  customErrors?: Record<string, any>
  fieldsNeedingManualInput?: Set<string>
  onVcsChange?: (vcs: SelectedVc[]) => void
}

export default function VcSelectionStep({ customErrors = {}, fieldsNeedingManualInput = new Set(), onVcsChange }: VcSelectionStepProps) {
  const { watch, setValue, getValues } = useFormContext<CompanyFormValues>()
  
  // State management
  const [availableVcs, setAvailableVcs] = useState<SelectedVc[]>([])
  const [selectedVcs, setSelectedVcs] = useState<SelectedVc[]>([])
  const [loading, setLoading] = useState(true)
  const [episodeDetecting, setEpisodeDetecting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [firmFilter, setFirmFilter] = useState('')
  const [episodeAutoDetected, setEpisodeAutoDetected] = useState(false)
  
  // Track if we've already auto-detected from episode URL
  const hasAutoDetected = useRef(false)
  
  // Watch the episode URL for auto-detection
  const episodeUrl = watch('pitch_episode_url')

  // Fetch available VCs on component mount
  useEffect(() => {
    fetchAvailableVcs()
  }, [])

  // Auto-detect VCs from episode URL when it changes
  useEffect(() => {
    if (episodeUrl && episodeUrl.trim() && !hasAutoDetected.current && episodeUrl.includes('thepitch.show')) {
      console.log('🎯 [VcSelectionStep] Auto-detecting VCs from episode URL:', episodeUrl)
      hasAutoDetected.current = true
      handleEpisodeAutoDetection(episodeUrl)
    }
  }, [episodeUrl])

  const fetchAvailableVcs = async () => {
    try {
      setLoading(true)
      console.log('📋 [VcSelectionStep] Fetching available VCs')
      
      const response = await fetch('/api/vcs')
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Failed to fetch VCs')
      
      console.log(`✅ [VcSelectionStep] Fetched ${result.data.length} VCs`)
      setAvailableVcs(result.data || [])
    } catch (error: any) {
      console.error('❌ [VcSelectionStep] Error fetching VCs:', error)
      Sentry.captureException(error, {
        tags: { component: 'VcSelectionStep', operation: 'fetchVcs' }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEpisodeAutoDetection = async (url: string) => {
    setEpisodeDetecting(true)
    
    try {
      console.log('🔍 [VcSelectionStep] Auto-detecting VCs from episode:', url)
      
      const response = await fetch('/api/scrape-episode-vcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeUrl: url }),
      })

      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Failed to detect VCs from episode')
      
      const detectedVcs = result.data.featuredVcs || []
      console.log(`✅ [VcSelectionStep] Auto-detected ${detectedVcs.length} VCs from episode`)
      
      if (detectedVcs.length > 0) {
        // Match detected VCs with existing database VCs
        const matchedVcs: SelectedVc[] = []
        
        detectedVcs.forEach((detectedVc: any) => {
          const existingVc = availableVcs.find(vc => 
            vc.name.toLowerCase().includes(detectedVc.name.toLowerCase()) ||
            detectedVc.name.toLowerCase().includes(vc.name.toLowerCase())
          )
          
          if (existingVc) {
            matchedVcs.push({
              ...existingVc,
              isFromEpisode: true,
              episodeDetected: true
            })
          } else {
            // Create a temporary VC entry for VCs not in database
            matchedVcs.push({
              name: detectedVc.name,
              firm_name: detectedVc.firm || null,
              role_title: null,
              profile_image_url: null,
              linkedin_url: null,
              isFromEpisode: true,
              episodeDetected: true
            })
          }
        })
        
        // Auto-select detected VCs
        setSelectedVcs(matchedVcs)
        setEpisodeAutoDetected(true)
        
        console.log(`🎯 [VcSelectionStep] Auto-selected ${matchedVcs.length} VCs from episode`)
      }
    } catch (error: any) {
      console.error('❌ [VcSelectionStep] Episode auto-detection failed:', error)
      Sentry.captureException(error, {
        tags: { component: 'VcSelectionStep', operation: 'episodeAutoDetection' },
        extra: { episodeUrl: url }
      })
    } finally {
      setEpisodeDetecting(false)
    }
  }

  const handleVcToggle = (vc: SelectedVc) => {
    const isSelected = selectedVcs.some(selected => 
      (selected.id && vc.id && selected.id === vc.id) ||
      (!selected.id && !vc.id && selected.name === vc.name)
    )
    
    if (isSelected) {
      setSelectedVcs(prev => prev.filter(selected => 
        !((selected.id && vc.id && selected.id === vc.id) ||
          (!selected.id && !vc.id && selected.name === vc.name))
      ))
    } else {
      setSelectedVcs(prev => [...prev, { ...vc, isFromEpisode: false }])
    }
  }

  const handleClearAutoDetected = () => {
    setSelectedVcs(prev => prev.filter(vc => !vc.episodeDetected))
    setEpisodeAutoDetected(false)
    hasAutoDetected.current = false
  }

  const handleRefreshEpisodeDetection = () => {
    if (episodeUrl && episodeUrl.includes('thepitch.show')) {
      hasAutoDetected.current = false
      handleEpisodeAutoDetection(episodeUrl)
    }
  }

  // Get unique firms for filters
  const uniqueFirms = Array.from(new Set(
    availableVcs.map(vc => vc.firm_name).filter(Boolean)
  )).sort()

  // Filter available VCs
  const filteredVcs = availableVcs.filter(vc => {
    const matchesSearch = !searchTerm || 
      vc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vc.firm_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFirm = !firmFilter || vc.firm_name === firmFilter
    
    return matchesSearch && matchesFirm
  })

  // Notify parent component when selected VCs change
  useEffect(() => {
    if (onVcsChange) {
      onVcsChange(selectedVcs)
    }
  }, [selectedVcs, onVcsChange])

  // Note: Selected VCs are managed in local state and will be handled separately when form is submitted
  // They are not part of the main company form data since they go into the company_vcs table

  return (
    <div className="space-y-6">
      {/* Episode Auto-Detection Section */}
      {episodeUrl && episodeUrl.includes('thepitch.show') && (
        <div className="border border-blue-600 rounded-lg p-4 bg-blue-600/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-platinum-mist flex items-center gap-2">
              🎯 Episode Auto-Detection
            </h4>
            <div className="flex gap-2">
              {episodeAutoDetected && (
                <button
                  type="button"
                  onClick={handleClearAutoDetected}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                >
                  Clear Auto-Selected
                </button>
              )}
              <button
                type="button"
                onClick={handleRefreshEpisodeDetection}
                disabled={episodeDetecting}
                className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
              >
                {episodeDetecting ? 'Detecting...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {episodeDetecting ? (
            <div className="flex items-center gap-2 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
              <span className="text-sm">Analyzing episode for featured VCs...</span>
            </div>
          ) : episodeAutoDetected ? (
            <div className="text-sm text-green-400">
              ✅ Auto-detected {selectedVcs.filter(vc => vc.episodeDetected).length} VCs from this episode
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              No VCs auto-detected from episode URL yet
            </div>
          )}
        </div>
      )}

      {/* VC Selection Header */}
      <div className="border border-gray-600 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-platinum-mist mb-2 flex items-center gap-2">
          💼 Select VCs & Investors
        </h4>
        <p className="text-sm text-gray-400 mb-4">
          Choose the VCs and investors associated with this investment. VCs may be auto-detected from the episode URL.
        </p>

        {/* Selected VCs Summary */}
        {selectedVcs.length > 0 && (
          <div className="mb-4 p-3 bg-green-600/10 border border-green-600 rounded">
            <div className="text-sm font-medium text-green-400 mb-2">
              Selected VCs ({selectedVcs.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedVcs.map((vc, index) => (
                <span
                  key={vc.id || vc.name}
                  className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                    vc.episodeDetected 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {vc.episodeDetected && '🎯 '}
                  {vc.name} {vc.firm_name && `(${vc.firm_name})`}
                  <button
                    type="button"
                    onClick={() => handleVcToggle(vc)}
                    className="ml-1 hover:bg-white/20 rounded"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search VCs..."
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none text-sm"
            />
          </div>
          
          <div>
            <select
              value={firmFilter}
              onChange={(e) => setFirmFilter(e.target.value)}
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none text-sm"
            >
              <option value="">All Firms</option>
              {uniqueFirms.map(firm => (
                <option key={firm} value={firm || ''}>{firm}</option>
              ))}
            </select>
          </div>
          
          <div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setFirmFilter('')
              }}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* VC List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cobalt-pulse mx-auto mb-4"></div>
            <p className="text-gray-400">Loading VCs...</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="grid gap-2">
              {filteredVcs.map((vc) => {
                const isSelected = selectedVcs.some(selected => 
                  (selected.id && vc.id && selected.id === vc.id) ||
                  (!selected.id && !vc.id && selected.name === vc.name)
                )
                
                return (
                  <div
                    key={vc.id || vc.name}
                    onClick={() => handleVcToggle(vc)}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-green-500 bg-green-600/10'
                        : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {vc.profile_image_url ? (
                          <img
                            src={vc.profile_image_url}
                            alt={vc.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-300">
                              {vc.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-platinum-mist">
                            {vc.name}
                          </span>
                          {isSelected && (
                            <span className="text-green-400">✓</span>
                          )}
                        </div>
                        {vc.firm_name && (
                          <div className="text-sm text-gray-300">{vc.firm_name}</div>
                        )}
                        {vc.role_title && (
                          <div className="text-xs text-gray-400">{vc.role_title}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {filteredVcs.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No VCs found matching your filters
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-400 mt-3">
          Showing {filteredVcs.length} of {availableVcs.length} VCs
          {selectedVcs.length > 0 && ` • ${selectedVcs.length} selected`}
        </div>
      </div>
    </div>
  )
} 
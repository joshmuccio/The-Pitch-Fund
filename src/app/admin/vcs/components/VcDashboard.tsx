'use client'

import { useState, useEffect } from 'react'
import { track } from '@vercel/analytics'
import * as Sentry from '@sentry/nextjs'
import { createBrowserClient } from '@supabase/ssr'
import VcList from './VcList'
import VcEditModal from './VcEditModal'

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

export default function VcDashboard() {
  const [vcs, setVcs] = useState<Vc[]>([])
  const [loading, setLoading] = useState(true)
  const [editingVc, setEditingVc] = useState<Vc | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [firmFilter, setFirmFilter] = useState('')


  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchVcs()
  }, [])

  const fetchVcs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('vcs')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      
      setVcs(data || [])
    } catch (error) {
      console.error('Error fetching VCs:', error)
      Sentry.captureException(error, {
        tags: {
          component: 'VcDashboard',
          operation: 'fetchVcs'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVcUpdated = (updatedVc: Vc) => {
    setVcs(prevVcs => 
      prevVcs.map(vc => vc.id === updatedVc.id ? updatedVc : vc)
    )
    setEditingVc(null)
    
    // Track VC update
    track('admin_vc_updated', { 
      vc_name: updatedVc.name,
      firm: updatedVc.firm_name
    })
  }

  const handleVcDeleted = (deletedVcId: string) => {
    setVcs(prevVcs => prevVcs.filter(vc => vc.id !== deletedVcId))
    setEditingVc(null)
    
    // Track VC deletion
    track('admin_vc_deleted', { 
      vc_id: deletedVcId
    })
  }

  const handleEditVc = (vc: Vc) => {
    setEditingVc(vc)
    
    // Track edit start
    track('admin_vc_edit_start', { 
      vc_name: vc.name,
      firm: vc.firm_name
    })
  }

  // Get unique firms for filter
  const uniqueFirms = Array.from(new Set(
    vcs.map(vc => vc.firm_name).filter(Boolean)
  )).sort()



  // Filter VCs based on search and filters
  const filteredVcs = vcs.filter(vc => {
    const matchesSearch = !searchTerm || 
      vc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vc.firm_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFirm = !firmFilter || vc.firm_name === firmFilter
    
    const matchesSeason = true // Removed season filtering
    
    return matchesSearch && matchesFirm && matchesSeason
  })

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="border-b border-graphite-gray">
        <div className="py-2 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-platinum-mist flex items-center gap-2">
              <span>💼</span>
              VCs & Investors
            </h2>
            <p className="text-graphite-gray text-sm mt-1">
              Manage venture capital investor profiles and information
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditingVc({} as Vc)}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Manually
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-graphite-gray rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Search VCs
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or firm..."
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Filter by Firm
            </label>
            <select
              value={firmFilter}
              onChange={(e) => setFirmFilter(e.target.value)}
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
            >
              <option value="">All Firms</option>
              {uniqueFirms.map(firm => (
                <option key={firm} value={firm || ''}>{firm}</option>
              ))}
            </select>
          </div>
          

          
          <div className="flex items-end">
            <button
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
        
        <div className="mt-3 text-sm text-gray-400">
          Showing {filteredVcs.length} of {vcs.length} VCs
        </div>
      </div>

      {/* VC List */}
      <VcList 
        vcs={filteredVcs}
        loading={loading}
        onEditVc={handleEditVc}
        onRefresh={fetchVcs}
      />

      {/* Edit Modal */}
      {editingVc && (
        <VcEditModal
          vc={editingVc}
          onClose={() => setEditingVc(null)}
          onVcUpdated={handleVcUpdated}
          onVcDeleted={handleVcDeleted}
        />
      )}
    </div>
  )
} 
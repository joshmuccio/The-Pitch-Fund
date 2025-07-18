'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Founder {
  id: string
  email: string
  first_name?: string
  last_name?: string
  linkedin_url?: string
  role?: string
  bio?: string
  phone?: string
  created_at?: string
}

interface CompanyFounder {
  company_id: string
  founder_id: string
  role?: string
  is_active?: boolean
  equity_percentage?: number
  joined_date?: string
  left_date?: string
  company?: {
    name: string
    slug: string
  }
}

export default function FounderManager() {
  const [founders, setFounders] = useState<Founder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchFounders()
  }, [])

  const fetchFounders = async () => {
    try {
      const { data, error } = await supabase
        .from('founders')
        .select(`
          *,
          company_founders (
            company_id,
            role,
            is_active,
            equity_percentage,
            companies (
              name,
              slug
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFounders(data || [])
    } catch (error) {
      console.error('Error fetching founders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (founder: Founder) => {
    setEditingFounder(founder)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingFounder(null)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingFounder(null)
  }

  const handleSave = () => {
    fetchFounders()
    handleClose()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-platinum-mist">Loading founders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-platinum-mist">
          Portfolio Founders
        </h2>
        <button
          onClick={handleAdd}
          className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add Founder
        </button>
      </div>

      {/* Founders List */}
      <div className="grid gap-4">
        {founders.map((founder) => (
          <div
            key={founder.id}
            className="bg-graphite-gray rounded-lg p-6 border border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-platinum-mist">
                    {[founder.first_name, founder.last_name].filter(Boolean).join(' ') || founder.email || 'Unnamed Founder'}
                  </h3>
                  {founder.role && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      {founder.role}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-platinum-mist ml-1">{founder.email}</span>
                  </div>
                  
                  {founder.linkedin_url && (
                    <div>
                      <span className="text-gray-400">LinkedIn:</span>
                      <a 
                        href={founder.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cobalt-pulse ml-1 hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  )}
                  
                  {founder.phone && (
                    <div>
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-platinum-mist ml-1">{founder.phone}</span>
                    </div>
                  )}
                </div>

                {/* Associated Companies */}
                {(founder as any).company_founders?.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-400 text-sm">Companies:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(founder as any).company_founders.map((cf: any, index: number) => (
                        <span
                          key={index}
                          className="bg-gray-600 text-white text-xs px-2 py-1 rounded"
                        >
                          {cf.companies?.name} ({cf.role})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleEdit(founder)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {founders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No founders found. Add your first founder!</p>
        </div>
      )}

      {/* Founder Form Modal */}
      {showForm && (
        <FounderForm
          founder={editingFounder}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

// Simple Founder Form Component (we'll expand this)
function FounderForm({ 
  founder, 
  onSave, 
  onClose 
}: { 
  founder: Founder | null
  onSave: () => void
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-graphite-gray rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-platinum-mist mb-4">
          {founder ? 'Edit Founder' : 'Add Founder'}
        </h3>
        
        <div className="space-y-4">
          <p className="text-gray-300">
            Founder form coming next... This will include founder details and company associations.
          </p>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
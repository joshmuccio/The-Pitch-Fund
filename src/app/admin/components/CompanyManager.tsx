'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Company {
  id: string
  slug: string
  name: string
  logo_url?: string
  tagline?: string
  industry_tags?: string[]
  latest_round?: string
  employees?: number
  status?: string
  description?: string
  website_url?: string
  company_linkedin_url?: string
  founded_year?: number
  investment_date?: string
  investment_amount?: number
  post_money_valuation?: number
  co_investors?: string[]
  pitch_episode_url?: string
  key_metrics?: Record<string, any>
  is_active?: boolean
  notes?: string
}

export default function CompanyManager() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingCompany(null)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingCompany(null)
  }

  const handleSave = () => {
    fetchCompanies()
    handleClose()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-platinum-mist">Loading companies...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-platinum-mist">
          Portfolio Companies
        </h2>
        <button
          onClick={handleAdd}
          className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add Company
        </button>
      </div>

      {/* Companies List */}
      <div className="grid gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-graphite-gray rounded-lg p-6 border border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-platinum-mist">
                    {company.name}
                  </h3>
                  <span className="text-sm text-gray-400">({company.slug})</span>
                  {company.is_active && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
                
                {company.tagline && (
                  <p className="text-gray-300 mb-2">{company.tagline}</p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {company.founded_year && (
                    <div>
                      <span className="text-gray-400">Founded:</span>
                      <span className="text-platinum-mist ml-1">{company.founded_year}</span>
                    </div>
                  )}
                  {company.investment_date && (
                    <div>
                      <span className="text-gray-400">Investment:</span>
                      <span className="text-platinum-mist ml-1">
                        {new Date(company.investment_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {company.investment_amount && (
                    <div>
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-platinum-mist ml-1">
                        ${company.investment_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {company.latest_round && (
                    <div>
                      <span className="text-gray-400">Round:</span>
                      <span className="text-platinum-mist ml-1">{company.latest_round}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleEdit(company)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No companies found. Add your first portfolio company!</p>
        </div>
      )}

      {/* Company Form Modal */}
      {showForm && (
        <CompanyForm
          company={editingCompany}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

// Simple Company Form Component (we'll expand this)
function CompanyForm({ 
  company, 
  onSave, 
  onClose 
}: { 
  company: Company | null
  onSave: () => void
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-graphite-gray rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-platinum-mist mb-4">
          {company ? 'Edit Company' : 'Add Company'}
        </h3>
        
        <div className="space-y-4">
          <p className="text-gray-300">
            Company form coming next... This will include all the investment tracking fields.
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
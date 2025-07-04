'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@vercel/analytics'
import * as Sentry from '@sentry/nextjs'
import { createBrowserClient } from '@supabase/ssr'
import CompanyManager from './CompanyManager'

export default function AdminDashboard() {
  const router = useRouter()
  
  // Keep the popup functionality for now as fallback during transition
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)

  const handleAddNew = () => {
    // Track add company action
    track('admin_company_add_start', { 
      location: 'admin_dashboard',
      method: 'dedicated_page'
    });
    
    // Navigate to dedicated new investment page
    router.push('/admin/investments/new')
  }

  const handleEditCompany = (company: any) => {
    // Track edit company action
    track('admin_company_edit_start', { 
      company_name: company.name,
      company_slug: company.slug,
      location: 'admin_dashboard',
      method: 'dedicated_page'
    });
    
    // Navigate to dedicated edit investment page
    router.push(`/admin/investments/${company.id}/edit`)
  }

  // Legacy popup handlers (will be removed after transition)
  const handleEdit = (company: any) => {
    setEditingCompany(company)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingCompany(null)
  }

  const handleSave = () => {
    setShowForm(false)
    setEditingCompany(null)
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="border-b border-graphite-gray">
        <div className="py-2 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-platinum-mist flex items-center gap-2">
              <span>🌱</span>
              Portfolio
            </h2>
            <p className="text-graphite-gray text-sm mt-1">
              Manage portfolio companies and their associated founders
            </p>
          </div>
          <div className="flex gap-3">
            {/* New: Dedicated page button */}
            <button
              onClick={handleAddNew}
              className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Investment
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Company Manager with updated edit handler */}
      <div className="mt-6">
        <CompanyManagerWithLinks 
          onEditCompany={handleEditCompany}
        />
      </div>

      {/* Legacy popup support (temporary during transition) */}
      {showForm && (
        <CompanyManager 
          showForm={showForm}
          editingCompany={editingCompany}
          onEdit={handleEdit}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// Enhanced Company Manager that uses links instead of popups
function CompanyManagerWithLinks({ onEditCompany }: { onEditCompany: (company: any) => void }) {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        .select(`
          *,
          company_founders (
            role,
            is_active,
            founders (
              id,
              email,
              name,
              linkedin_url,
              role,
              bio
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform the data to flatten founders
      const transformedData = (data || []).map((company: any) => ({
        ...company,
        founders: company.company_founders?.map((cf: any) => ({
          ...cf.founders,
          company_role: cf.role,
          is_active: cf.is_active
        })) || []
      }))
      
      setCompanies(transformedData)
    } catch (error) {
      console.error('Error fetching companies:', error)
      Sentry.captureException(error, {
        tags: {
          component: 'CompanyManagerWithLinks',
          operation: 'fetchCompanies'
        }
      })
    } finally {
      setLoading(false)
    }
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
                  {company.status === 'active' && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
                
                {company.tagline && (
                  <p className="text-gray-300 mb-2">{company.tagline}</p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
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
                  {company.instrument && (
                    <div>
                      <span className="text-gray-400">Instrument:</span>
                      <span className="text-platinum-mist ml-1 capitalize">
                        {company.instrument.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Associated Founders */}
                {company.founders && company.founders.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-400 text-sm">Founders:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {company.founders.map((founder: any, index: number) => (
                        <span
                          key={founder.id || index}
                          className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                        >
                          {founder.name || founder.email} 
                          {founder.company_role && ` (${founder.company_role})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => onEditCompany(company)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
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
    </div>
  )
} 
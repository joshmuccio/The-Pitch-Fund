'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { track } from '@vercel/analytics'

interface Company {
  id: string
  slug: string
  name: string
  logo_url?: string
  tagline?: string
  industry_tags?: string[]
  latest_round?: string
  employees?: number
  status?: 'active' | 'acquihired' | 'exited' | 'dead'
  description?: any // Vector embedding (1536 dimensions)
  description_backup?: string // Original text description backup
  website_url?: string
  company_linkedin_url?: string
  founded_year?: number
  investment_date?: string
  investment_amount?: number
  post_money_valuation?: number
  co_investors?: string[]
  pitch_episode_url?: string
  key_metrics?: Record<string, any>
  notes?: string
  // New fields from schema update
  annual_revenue_usd?: number
  users?: number
  last_scraped_at?: string
  total_funding_usd?: number
}

interface Founder {
  id?: string
  email: string
  name?: string
  linkedin_url?: string
  role?: string
  bio?: string
}

interface CompanyWithFounders extends Company {
  founders?: (Founder & {
    company_role?: string
    is_active?: boolean
  })[]
}

interface CompanyManagerProps {
  showForm: boolean
  editingCompany: CompanyWithFounders | null
  onEdit: (company: CompanyWithFounders) => void
  onClose: () => void
  onSave: () => void
}

export default function CompanyManager({ 
  showForm, 
  editingCompany, 
  onEdit, 
  onClose, 
  onSave 
}: CompanyManagerProps) {
  const [companies, setCompanies] = useState<CompanyWithFounders[]>([])
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
      const transformedData = (data || []).map(company => ({
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
    } finally {
      setLoading(false)
    }
  }

  const handleSaveComplete = () => {
    fetchCompanies()
    onSave()
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
                  {company.latest_round && (
                    <div>
                      <span className="text-gray-400">Round:</span>
                      <span className="text-platinum-mist ml-1">{company.latest_round}</span>
                    </div>
                  )}
                </div>

                {/* Associated Founders */}
                {company.founders && company.founders.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-400 text-sm">Founders:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {company.founders.map((founder, index) => (
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
                onClick={() => onEdit(company)}
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

      {/* Company + Founder Form Modal */}
      {showForm && (
        <CompanyFounderForm
          company={editingCompany}
          onSave={handleSaveComplete}
          onClose={onClose}
        />
      )}
    </div>
  )
}

// Comprehensive Company + Founder Form Component
function CompanyFounderForm({ 
  company, 
  onSave, 
  onClose 
}: { 
  company: CompanyWithFounders | null
  onSave: () => void
  onClose: () => void 
}) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    // Company fields
    slug: company?.slug || '',
    name: company?.name || '',
    tagline: company?.tagline || '',
    description: company?.description || '',
    website_url: company?.website_url || '',
    company_linkedin_url: company?.company_linkedin_url || '',
    founded_year: company?.founded_year || new Date().getFullYear(),
    industry_tags: company?.industry_tags?.join(', ') || '',
    latest_round: company?.latest_round || '',
    employees: company?.employees || '',
    status: company?.status || 'active',
    investment_date: company?.investment_date || '',
    investment_amount: company?.investment_amount || '',
    post_money_valuation: company?.post_money_valuation || '',
    co_investors: company?.co_investors?.join(', ') || '',
    pitch_episode_url: company?.pitch_episode_url || '',
    notes: company?.notes || '',
    // New fields from schema update
    annual_revenue_usd: company?.annual_revenue_usd || '',
    users: company?.users || '',
    total_funding_usd: company?.total_funding_usd || '',
    description_backup: company?.description_backup || '',

    // Founder fields (single founder for now)
    founder_name: company?.founders?.[0]?.name || '',
    founder_email: company?.founders?.[0]?.email || '',
    founder_linkedin_url: company?.founders?.[0]?.linkedin_url || '',
    founder_role: company?.founders?.[0]?.company_role || 'CEO',
    founder_bio: company?.founders?.[0]?.bio || '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Track form submission attempt
    track('admin_company_form_submit', { 
      action: company ? 'edit' : 'create',
      company_name: formData.name,
      has_founder_data: !!formData.founder_email,
      location: 'admin_dashboard' 
    });

    try {
      // Prepare company data
      const companyData = {
        slug: formData.slug,
        name: formData.name,
        tagline: formData.tagline || null,
        description_backup: formData.description_backup || null,
        website_url: formData.website_url || null,
        company_linkedin_url: formData.company_linkedin_url || null,
        founded_year: formData.founded_year || null,
        industry_tags: formData.industry_tags ? formData.industry_tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
        latest_round: formData.latest_round || null,
        employees: formData.employees ? parseInt(formData.employees.toString()) : null,
        status: formData.status || 'active',
        investment_date: formData.investment_date || null,
        investment_amount: formData.investment_amount ? parseFloat(formData.investment_amount.toString()) : null,
        post_money_valuation: formData.post_money_valuation ? parseFloat(formData.post_money_valuation.toString()) : null,
        co_investors: formData.co_investors ? formData.co_investors.split(',').map(inv => inv.trim()).filter(Boolean) : null,
        pitch_episode_url: formData.pitch_episode_url || null,
        notes: formData.notes || null,
        // New fields from schema update
        annual_revenue_usd: formData.annual_revenue_usd ? parseFloat(formData.annual_revenue_usd.toString()) : null,
        users: formData.users ? parseInt(formData.users.toString()) : null,
        total_funding_usd: formData.total_funding_usd ? parseFloat(formData.total_funding_usd.toString()) : null,
      }

      let companyId: string

      if (company) {
        // Update existing company
        const { error: companyError } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', company.id)

        if (companyError) throw companyError
        companyId = company.id
      } else {
        // Create new company
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert(companyData)
          .select('id')
          .single()

        if (companyError) throw companyError
        companyId = newCompany.id
      }

      // Handle founder data if provided
      if (formData.founder_email) {
        // Check if founder already exists
        let founderId: string
        const { data: existingFounder } = await supabase
          .from('founders')
          .select('id')
          .eq('email', formData.founder_email)
          .single()

        if (existingFounder) {
          // Update existing founder
          founderId = existingFounder.id
          const { error: founderError } = await supabase
            .from('founders')
            .update({
              name: formData.founder_name || null,
              linkedin_url: formData.founder_linkedin_url || null,
              role: formData.founder_role || null,
              bio: formData.founder_bio || null,
            })
            .eq('id', founderId)

          if (founderError) throw founderError
        } else {
          // Create new founder
          const { data: newFounder, error: founderError } = await supabase
            .from('founders')
            .insert({
              email: formData.founder_email,
              name: formData.founder_name || null,
              linkedin_url: formData.founder_linkedin_url || null,
              role: formData.founder_role || null,
              bio: formData.founder_bio || null,
            })
            .select('id')
            .single()

          if (founderError) throw founderError
          founderId = newFounder.id
        }

        // Create or update company-founder relationship
        const { error: relationError } = await supabase
          .from('company_founders')
          .upsert({
            company_id: companyId,
            founder_id: founderId,
            role: formData.founder_role || null,
            is_active: true,
          })

        if (relationError) throw relationError
      }

      // Track successful save
      track('admin_company_form_success', { 
        action: company ? 'edit' : 'create',
        company_name: formData.name,
        has_founder_data: !!formData.founder_email,
        location: 'admin_dashboard' 
      });

      onSave()
    } catch (error) {
      console.error('Error saving company and founder:', error)
      
      // Track save error
      track('admin_company_form_error', { 
        action: company ? 'edit' : 'create',
        company_name: formData.name,
        error: error instanceof Error ? error.message : 'unknown_error',
        location: 'admin_dashboard' 
      });
      
      alert('Error saving data. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-graphite-gray rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-platinum-mist">
            {company ? 'Edit Investment' : 'Add New Investment'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information Section */}
          <div className="border border-gray-600 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
              🏢 Company Info
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.company_linkedin_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_linkedin_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Founded Year
                </label>
                <input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear() + 10}
                  value={formData.founded_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, founded_year: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Industry Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.industry_tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry_tags: e.target.value }))}
                  placeholder="e.g. SaaS, AI, Fintech"
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Latest Round
                </label>
                <select
                  value={formData.latest_round}
                  onChange={(e) => setFormData(prev => ({ ...prev, latest_round: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                >
                  <option value="">Select round</option>
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                  <option value="Series C">Series C</option>
                  <option value="Series D+">Series D+</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Employees
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.employees}
                  onChange={(e) => setFormData(prev => ({ ...prev, employees: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'acquihired' | 'exited' | 'dead' }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="acquihired">Acquihired</option>
                  <option value="exited">Exited</option>
                  <option value="dead">Dead</option>
                </select>
              </div>
            </div>

            {/* Business Metrics Section */}
            <div className="mt-6 pt-4 border-t border-gray-600">
              <h5 className="text-md font-medium text-platinum-mist mb-3">Business Metrics</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Annual Revenue (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.annual_revenue_usd}
                    onChange={(e) => setFormData(prev => ({ ...prev, annual_revenue_usd: e.target.value }))}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Total Users
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.users}
                    onChange={(e) => setFormData(prev => ({ ...prev, users: e.target.value }))}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Total Funding (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_funding_usd}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_funding_usd: e.target.value }))}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div className="mt-6 pt-4 border-t border-gray-600">
              <h5 className="text-md font-medium text-platinum-mist mb-3">Investment Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Investment Date
                  </label>
                  <input
                    type="date"
                    value={formData.investment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, investment_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Investment Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.investment_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, investment_amount: e.target.value }))}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Post-Money Valuation ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.post_money_valuation}
                    onChange={(e) => setFormData(prev => ({ ...prev, post_money_valuation: e.target.value }))}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Co-Investors (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.co_investors}
                    onChange={(e) => setFormData(prev => ({ ...prev, co_investors: e.target.value }))}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description (Text)
              </label>
              <textarea
                rows={3}
                value={formData.description_backup}
                onChange={(e) => setFormData(prev => ({ ...prev, description_backup: e.target.value }))}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="Company description (will be converted to AI embeddings later)"
              />
              <p className="text-xs text-gray-400 mt-1">
                Note: Description is stored as text for now and will be converted to vector embeddings for AI search in the future.
              </p>
            </div>
          </div>

          {/* Founder Information Section */}
          <div className="border border-gray-600 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
              👤 Founder Info
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Founder Name
                </label>
                <input
                  type="text"
                  value={formData.founder_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, founder_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.founder_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, founder_email: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              

              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Founder LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.founder_linkedin_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, founder_linkedin_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role at Company
                </label>
                <select
                  value={formData.founder_role}
                  onChange={(e) => setFormData(prev => ({ ...prev, founder_role: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                >
                  <option value="CEO">CEO</option>
                  <option value="CTO">CTO</option>
                  <option value="COO">COO</option>
                  <option value="CFO">CFO</option>
                  <option value="Co-Founder">Co-Founder</option>
                  <option value="Founder">Founder</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              

              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.founder_bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, founder_bio: e.target.value }))}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-cobalt-pulse hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-2 rounded transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { track } from '@vercel/analytics'
import CompanyManager from './CompanyManager'

export default function AdminDashboard() {
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)

  const handleAdd = () => {
    // Track add company action
    track('admin_company_add_start', { 
      location: 'admin_dashboard' 
    });
    
    setEditingCompany(null)
    setShowForm(true)
  }

  const handleEdit = (company: any) => {
    // Track edit company action
    track('admin_company_edit_start', { 
      company_name: company.name,
      company_slug: company.slug,
      location: 'admin_dashboard' 
    });
    
    setEditingCompany(company)
    setShowForm(true)
  }

  const handleClose = () => {
    // Track form close (without saving)
    track('admin_company_form_close', { 
      action: editingCompany ? 'edit_cancel' : 'add_cancel',
      location: 'admin_dashboard' 
    });
    
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
          <button
            onClick={handleAdd}
            className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + New Investment
          </button>
        </div>
      </div>

      {/* Company Manager with inline founder management */}
      <div className="mt-6">
        <CompanyManager 
          showForm={showForm}
          editingCompany={editingCompany}
          onEdit={handleEdit}
          onClose={handleClose}
          onSave={handleSave}
        />
      </div>
    </div>
  )
} 
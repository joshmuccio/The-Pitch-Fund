'use client'

import { useState } from 'react'
import CompanyManager from './CompanyManager'
import FounderManager from './FounderManager'

type TabType = 'companies' | 'founders'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('companies')

  const tabs = [
    { id: 'companies' as TabType, label: 'Companies', icon: '🏢' },
    { id: 'founders' as TabType, label: 'Founders', icon: '👥' },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-graphite-gray">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-cobalt-pulse text-cobalt-pulse'
                  : 'border-transparent text-graphite-gray hover:text-platinum-mist hover:border-graphite-gray'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'companies' && <CompanyManager />}
        {activeTab === 'founders' && <FounderManager />}
      </div>
    </div>
  )
} 
'use client'

import { useState } from 'react'
import * as Sentry from '@sentry/nextjs'

interface VcScrapeFormProps {
  onClose: () => void
  onVcScraped: (vc: any) => void
}

export default function VcScrapeForm({ onClose, onVcScraped }: VcScrapeFormProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scrapedData, setScrapedData] = useState<any>(null)
  const [step, setStep] = useState<'input' | 'preview' | 'saving'>('input')

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL')
      return
    }

    if (!url.includes('thepitch.show/guests/')) {
      setError('URL must be a thepitch.show guest profile URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔍 [VcScrapeForm] Scraping profile URL:', url)
      
      const response = await fetch('/api/scrape-vc-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl: url }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scrape profile')
      }

      console.log('✅ [VcScrapeForm] Profile scraped successfully:', result.data.name)
      setScrapedData(result.data)
      setStep('preview')

    } catch (error: any) {
      console.error('❌ [VcScrapeForm] Scraping failed:', error)
      setError(error.message || 'Failed to scrape profile. Please check the URL and try again.')
      Sentry.captureException(error, {
        tags: { component: 'VcScrapeForm', operation: 'scrape' },
        extra: { url }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!scrapedData) return

    setStep('saving')
    setError('')

    try {
      console.log('💾 [VcScrapeForm] Saving VC to database:', scrapedData.name)
      
      const response = await fetch('/api/vcs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scrapedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save VC')
      }

      console.log('✅ [VcScrapeForm] VC saved successfully:', result.data.name)
      onVcScraped(result.data)

    } catch (error: any) {
      console.error('❌ [VcScrapeForm] Save failed:', error)
      setError(error.message || 'Failed to save VC. Please try again.')
      setStep('preview')
      Sentry.captureException(error, {
        tags: { component: 'VcScrapeForm', operation: 'save' },
        extra: { scrapedData }
      })
    }
  }

  const handleBack = () => {
    setStep('input')
    setScrapedData(null)
    setError('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-graphite-gray rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-platinum-mist">
              {step === 'input' && '🔗 Add VC from URL'}
              {step === 'preview' && '👁️ Preview VC Profile'}
              {step === 'saving' && '💾 Saving VC...'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-platinum-mist transition-colors"
              disabled={step === 'saving'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step 1: URL Input */}
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ThePitch.show Guest Profile URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://thepitch.show/guests/charles-hudson-precursor-ventures/"
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter the URL of a VC guest profile from thepitch.show
                </p>
              </div>

              {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 hover:text-platinum-mist transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleScrape}
                  disabled={loading || !url.trim()}
                  className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {loading ? 'Scraping...' : 'Scrape Profile'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && scrapedData && (
            <div className="space-y-6">
              <div className="bg-pitch-black rounded-lg p-4">
                <h3 className="text-lg font-semibold text-platinum-mist mb-4">Scraped Profile Data</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-400">Name:</span>
                    <p className="text-platinum-mist font-medium">{scrapedData.name || 'Not found'}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-400">Firm:</span>
                    <p className="text-platinum-mist">{scrapedData.firm_name || 'Not found'}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-400">Role:</span>
                    <p className="text-platinum-mist">{scrapedData.role_title || 'Not found'}</p>
                  </div>
                  

                </div>

                {scrapedData.bio && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-400">Bio:</span>
                    <p className="text-platinum-mist text-sm mt-1">{scrapedData.bio}</p>
                  </div>
                )}

                {/* Social Links */}
                <div className="mt-4">
                  <span className="text-sm text-gray-400">Links found:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {scrapedData.linkedin_url && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">LinkedIn</span>
                    )}
                    {scrapedData.twitter_url && (
                      <span className="bg-blue-400 text-white text-xs px-2 py-1 rounded">Twitter</span>
                    )}
                    {scrapedData.website_url && (
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Website</span>
                    )}
                    {scrapedData.podcast_url && (
                      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">Podcast</span>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-300 hover:text-platinum-mist transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                >
                  Save VC Profile
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Saving */}
          {step === 'saving' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cobalt-pulse mx-auto mb-4"></div>
              <p className="text-platinum-mist">Saving VC profile to database...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
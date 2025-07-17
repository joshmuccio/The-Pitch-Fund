'use client'

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

interface VcListProps {
  vcs: Vc[]
  loading: boolean
  onEditVc: (vc: Vc) => void
  onRefresh: () => void
}

export default function VcList({ vcs, loading, onEditVc, onRefresh }: VcListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cobalt-pulse mx-auto mb-4"></div>
          <p className="text-platinum-mist">Loading VCs...</p>
        </div>
      </div>
    )
  }

  if (vcs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💼</div>
        <h3 className="text-xl font-semibold text-platinum-mist mb-2">No VCs Found</h3>
        <p className="text-gray-400 mb-6">
          No venture capital investors match your current filters.
        </p>
        <button
          onClick={onRefresh}
          className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Refresh List
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* VCs Grid */}
      <div className="grid gap-4">
        {vcs.map((vc) => (
          <VcCard 
            key={vc.id} 
            vc={vc} 
            onEdit={() => onEditVc(vc)} 
          />
        ))}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-gray-400 mt-6">
        Showing {vcs.length} VC{vcs.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

function VcCard({ vc, onEdit }: { vc: Vc; onEdit: () => void }) {
  return (
    <div className="bg-graphite-gray rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start gap-4 mb-3">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {vc.profile_image_url ? (
                <img
                  src={vc.profile_image_url}
                  alt={vc.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-300">
                    {vc.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Name and Firm */}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-platinum-mist">
                {vc.name}
              </h3>
              {vc.firm_name && (
                <p className="text-gray-300 font-medium">{vc.firm_name}</p>
              )}
              {vc.role_title && (
                <p className="text-gray-400 text-sm">{vc.role_title}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {vc.bio && (
            <div className="mb-3">
              <p className="text-gray-300 text-sm line-clamp-2">
                {vc.bio}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
            {/* Added Date */}
            <div>
              <span className="text-gray-400">Added:</span>
              <span className="text-platinum-mist ml-1">
                {new Date(vc.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Last Updated */}
            {vc.updated_at !== vc.created_at && (
              <div>
                <span className="text-gray-400">Updated:</span>
                <span className="text-platinum-mist ml-1">
                  {new Date(vc.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap gap-2 mb-3">
            {vc.linkedin_url && (
              <a
                href={vc.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}

            {vc.twitter_url && (
              <a
                href={vc.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-400 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </a>
            )}

            {vc.instagram_url && (
              <a
                href={vc.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-500 hover:bg-pink-600 text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
            )}

            {vc.tiktok_url && (
              <a
                href={vc.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black hover:bg-gray-800 text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5.76 20.8a6.34 6.34 0 0 0 10.86-4.43V8.77a8.4 8.4 0 0 0 4.52 1.34v-3.4a4.85 4.85 0 0 1-1.55-.02z"/>
                </svg>
                TikTok
              </a>
            )}

            {vc.wikipedia_url && (
              <a
                href={vc.wikipedia_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm5.568 14.794c-.044.264-.08.455-.119.455-.127 0-.213-.323-.213-.323s-.197-.422-.36-.422-.36.422-.36.422-.213.323-.213.323c-.127 0-.213-.323-.213-.323s-.197-.422-.36-.422-.36.422-.36.422-.087.191-.213.323c-.039 0-.074-.191-.119-.455-.531-3.037-.458-4.628-.458-4.628s.433-.422.433-.844c0-.423-.433-.844-.433-.844s-.073-1.591.458-4.628c.045-.264.08-.455.119-.455.127 0 .213.323.213.323s.197.422.36.422.36-.422.36-.422.087-.323.213-.323c.039 0 .074.191.119.455.531 3.037.458 4.628.458 4.628s-.433.421-.433.844c0 .422.433.844.433.844s.073 1.591-.458 4.628z"/>
                </svg>
                Wikipedia
              </a>
            )}

            {vc.youtube_url && (
              <a
                href={vc.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </a>
            )}

            {vc.website_url && (
              <a
                href={vc.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Website
              </a>
            )}

            {vc.podcast_url && (
              <a
                href={vc.podcast_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Podcast
              </a>
            )}

            {vc.thepitch_profile_url && (
              <a
                href={vc.thepitch_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </a>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={onEdit}
            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
      </div>
    </div>
  )
} 
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { portfolioMetadata } from '../../lib/metadata'
import Link from 'next/link'

export const metadata = portfolioMetadata();

interface UserProfile {
  role: 'admin' | 'lp'
}

export default async function PortfolioPage() {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
  
  // Check if user is authenticated (optional)
  const { data: { user } } = await supabase.auth.getUser()
  let userProfile: UserProfile | null = null
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userProfile = profile as UserProfile | null
  }

  // Fetch portfolio companies (public data)
  const { data: companies, error } = await supabase
    .from('companies')
    .select(`
      id,
      slug,
      name,
      logo_url,
      tagline,
      description,
      industry_tags,
      location,
      website_url,
      company_linkedin_url,
      founded_year,
      pitch_episode_url,
      status
    `)
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error('Error fetching companies:', error)
  }

  return (
    <div className="min-h-screen bg-pitch-black pt-[72px]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-platinum-mist mb-2">
            Portfolio Companies
          </h1>
          <p className="text-graphite-gray">
            Founders we've backed from The Pitch podcast
          </p>
          {user && userProfile && (
            <div className="mt-4 text-sm text-cobalt-pulse">
              Signed in as <Link href="/admin" className="hover:underline">{userProfile.role.toUpperCase()}</Link> • Enhanced view enabled
            </div>
          )}
        </div>
        
        {companies && companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div key={company.id} className="bg-graphite-gray rounded-lg p-6 border border-gray-700 hover:border-cobalt-pulse transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {company.logo_url && (
                      <img 
                        src={company.logo_url} 
                        alt={`${company.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-platinum-mist">
                        {company.name}
                      </h3>
                      {company.founded_year && (
                        <p className="text-sm text-gray-400">
                          Founded {company.founded_year}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {company.tagline && (
                  <p className="text-cobalt-pulse font-medium mb-2">
                    {company.tagline}
                  </p>
                )}
                
                {company.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {company.description}
                  </p>
                )}
                
                {company.industry_tags && company.industry_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {company.industry_tags.map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-pitch-black text-xs text-gray-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {company.location && (
                  <p className="text-gray-400 text-sm mb-4">
                    📍 {company.location}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {company.website_url && (
                    <a 
                      href={company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-cobalt-pulse text-pitch-black px-3 py-1 rounded-full hover:opacity-90 transition-opacity"
                    >
                      Website
                    </a>
                  )}
                  {company.pitch_episode_url && (
                    <a 
                      href={company.pitch_episode_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-dawn-gold text-pitch-black px-3 py-1 rounded-full hover:opacity-90 transition-opacity"
                    >
                      Pitch Episode
                    </a>
                  )}
                  {company.company_linkedin_url && (
                    <a 
                      href={company.company_linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-gray-600 text-platinum-mist px-3 py-1 rounded-full hover:opacity-90 transition-opacity"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-graphite-gray rounded-lg p-8 border border-gray-700 text-center">
            <h2 className="text-xl font-semibold text-platinum-mist mb-4">
              Portfolio Coming Soon
            </h2>
            <p className="text-gray-300">
              We're building our portfolio of amazing companies from The Pitch podcast. 
              Check back soon to see the founders we're backing!
            </p>
          </div>
        )}
        
        {user && userProfile && ['lp', 'admin'].includes(userProfile.role) && (
          <div className="mt-8 bg-graphite-gray rounded-lg p-6 border border-cobalt-pulse">
            <h3 className="text-lg font-semibold text-platinum-mist mb-2">
              LP Dashboard Access
            </h3>
            <p className="text-gray-300 mb-4">
              As a registered LP, you have access to additional features and private company data.
            </p>
            <a 
              href="/lp/dashboard" 
              className="inline-block bg-cobalt-pulse text-pitch-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Access LP Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  )
} 
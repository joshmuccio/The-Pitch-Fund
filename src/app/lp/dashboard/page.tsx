import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function LPDashboardPage() {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  // Check authentication - required for LP dashboard
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/login')
  }
  
  // Check if user has LP or admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
    
  if (!profile || !['lp', 'admin'].includes(profile.role)) {
    redirect('/portfolio')
  }

  // Fetch portfolio companies with enhanced data for LPs
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
      investment_date,
      investment_amount,
      post_money_valuation,
      co_investors,
      pitch_episode_url,
      key_metrics,
      notes,
      is_active,
      updated_at
    `)
    .eq('is_active', true)
    .order('investment_date', { ascending: false })

  if (error) {
    console.error('Error fetching companies:', error)
  }

  return (
    <div className="min-h-screen bg-pitch-black pt-[72px]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-platinum-mist mb-2">
            LP Dashboard
          </h1>
          <p className="text-graphite-gray">
            Welcome to your Limited Partner portal
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-cobalt-pulse">
              Signed in as {profile.role.toUpperCase()} • {session.user.email}
            </div>
            <a 
              href="/portfolio" 
              className="text-sm text-gray-400 hover:text-platinum-mist transition-colors"
            >
              ← Back to Public Portfolio
            </a>
          </div>
        </div>
        
        {companies && companies.length > 0 ? (
          <div className="space-y-6">
            {companies.map((company) => (
              <div key={company.id} className="bg-graphite-gray rounded-lg p-6 border border-gray-700">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {company.logo_url && (
                      <img 
                        src={company.logo_url} 
                        alt={`${company.name} logo`}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-platinum-mist">
                        {company.name}
                      </h3>
                      {company.tagline && (
                        <p className="text-cobalt-pulse font-medium">
                          {company.tagline}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                        {company.founded_year && (
                          <span>Founded {company.founded_year}</span>
                        )}
                        {company.investment_date && (
                          <span>• Invested {new Date(company.investment_date).toLocaleDateString()}</span>
                        )}
                        {company.location && (
                          <span>• {company.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {company.investment_amount && (
                      <div className="text-lg font-semibold text-dawn-gold">
                        ${company.investment_amount.toLocaleString()}
                      </div>
                    )}
                    {company.post_money_valuation && (
                      <div className="text-sm text-gray-400">
                        ${company.post_money_valuation.toLocaleString()} valuation
                      </div>
                    )}
                  </div>
                </div>
                
                {company.description && (
                  <p className="text-gray-300 mb-4">
                    {company.description}
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {company.key_metrics && Object.keys(company.key_metrics).length > 0 && (
                    <div className="bg-pitch-black rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-platinum-mist mb-3">
                        Key Metrics
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(company.key_metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-400 capitalize">
                              {key.replace('_', ' ')}:
                            </span>
                            <span className="text-platinum-mist">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {company.co_investors && company.co_investors.length > 0 && (
                    <div className="bg-pitch-black rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-platinum-mist mb-3">
                        Co-Investors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {company.co_investors.map((investor, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-graphite-gray text-xs text-gray-300 rounded-full"
                          >
                            {investor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {company.industry_tags && company.industry_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {company.industry_tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-cobalt-pulse bg-opacity-20 text-cobalt-pulse text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {company.notes && (
                  <div className="bg-dawn-gold bg-opacity-10 border border-dawn-gold border-opacity-30 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-dawn-gold mb-2">
                      Investment Notes
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {company.notes}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-600">
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
              Portfolio Data Coming Soon
            </h2>
            <p className="text-gray-300 mb-4">
              We're adding detailed investment data to your LP dashboard. You'll soon be able to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 max-w-md mx-auto">
              <li>View detailed financial metrics</li>
              <li>Read founder updates and quarterly reports</li>
              <li>Access private company documents</li>
              <li>Track investment performance over time</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
} 
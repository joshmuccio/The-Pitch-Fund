import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function PortfolioPage() {
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
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/login')
  }
  
  // Check if user has access (LP or admin)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
    
  if (!profile || !['lp', 'admin'].includes(profile.role)) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-pitch-black pt-[72px]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-platinum-mist mb-2">
            Portfolio Dashboard
          </h1>
          <p className="text-graphite-gray">
            Welcome to your Limited Partner portal
          </p>
        </div>
        
        <div className="bg-graphite-gray rounded-lg p-8 border border-gray-700">
          <h2 className="text-xl font-semibold text-platinum-mist mb-4">
            Coming Soon
          </h2>
          <p className="text-gray-300 mb-4">
            Your portfolio dashboard is under construction. You'll soon be able to:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>View portfolio company performance metrics</li>
            <li>Read founder updates and quarterly reports</li>
            <li>Access private company documents</li>
            <li>Track investment performance</li>
          </ul>
          
          <div className="mt-6 pt-6 border-t border-gray-600">
            <p className="text-sm text-gray-400">
              Signed in as: {session.user.email}
            </p>
            <p className="text-sm text-gray-400">
              Role: {profile.role.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
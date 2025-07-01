import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AdminDashboard from './components/AdminDashboard'
import LogoutButton from './components/LogoutButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard | The Pitch Fund',
  description: 'Admin dashboard for managing portfolio companies and founders',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminPage() {
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
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-pitch-black pt-[72px]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-platinum-mist mb-2">
              Admin Dashboard
            </h1>
            <p className="text-graphite-gray">
              Manage portfolio companies and founder information
            </p>
          </div>
          <LogoutButton />
        </div>
        
        <AdminDashboard />
      </div>
    </div>
  )
} 
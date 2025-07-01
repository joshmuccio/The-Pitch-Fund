import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import LoginForm from './components/LoginForm'
import { loginMetadata } from '../../../lib/metadata'

export const metadata = loginMetadata();

export default async function LoginPage() {
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
  
  // Check if user is already logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Check user role and redirect appropriately
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role === 'admin') {
      redirect('/admin')
    } else {
      redirect('/portfolio') // LP dashboard
    }
  }

  return (
    <div className="min-h-screen bg-pitch-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-platinum-mist mb-2">
            Sign In
          </h1>
          <p className="text-graphite-gray">
            Access your Limited Partner portal
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  )
} 
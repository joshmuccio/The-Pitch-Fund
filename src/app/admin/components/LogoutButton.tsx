'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { track } from '@vercel/analytics'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    setLoading(true)
    
    // Track logout attempt
    track('logout_attempt', { location: 'admin_dashboard' });
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        // Track logout error
        track('logout_error', { 
          error: error.message,
          location: 'admin_dashboard' 
        });
      } else {
        // Track successful logout
        track('logout_success', { location: 'admin_dashboard' });
        router.push('/auth/login')
        router.refresh()
      }
    } catch (err) {
      console.error('Unexpected logout error:', err)
      // Track unexpected logout error
      track('logout_error', { 
        error: 'unexpected_error',
        location: 'admin_dashboard' 
      });
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
} 
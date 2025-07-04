import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Edge Runtime for fast authentication globally
export const runtime = 'edge'

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge auth callback initialized"));

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('Auth error:', error)
    return NextResponse.redirect(`${origin}/auth/login?error=Authentication failed`)
  }

  if (code) {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/login?error=Authentication failed`)
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login?error=No user found`)
    }

    // Check if user has a profile, create one if not
    let { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      // Create a new profile with default LP role
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            role: 'lp' // Default role
          }
        ])
      
      if (insertError) {
        console.error('Profile creation error:', insertError)
        return NextResponse.redirect(`${origin}/auth/login?error=Profile creation failed`)
      }
      
      profile = { role: 'lp' }
    }

    // Redirect based on user role
    if (profile.role === 'admin') {
      return NextResponse.redirect(`${origin}/admin`)
    } else {
      return NextResponse.redirect(`${origin}/portfolio`)
    }
  }

  // No code parameter, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
} 
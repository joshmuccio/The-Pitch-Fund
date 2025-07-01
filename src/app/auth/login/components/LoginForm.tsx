'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { track } from '@vercel/analytics'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    // Track login attempt
    track('login_attempt', { 
      email_domain: email.split('@')[1] || 'unknown',
      location: 'login_page' 
    });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        // Track login error
        track('login_error', { 
          error: error.message,
          email_domain: email.split('@')[1] || 'unknown',
          location: 'login_page' 
        });
      } else {
        setMessage('Check your email for the login link!')
        // Track successful login link sent
        track('login_link_sent', { 
          email_domain: email.split('@')[1] || 'unknown',
          location: 'login_page' 
        });
      }
    } catch (err) {
      setError('An unexpected error occurred')
      // Track unexpected error
      track('login_error', { 
        error: 'unexpected_error',
        email_domain: email.split('@')[1] || 'unknown',
        location: 'login_page' 
      });
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-graphite-gray rounded-lg p-8 border border-gray-700">
      <form onSubmit={handleSignIn} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-platinum-mist mb-2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded-md text-platinum-mist placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cobalt-pulse focus:border-cobalt-pulse"
            placeholder="Enter your email address"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-md p-3">
            {error}
          </div>
        )}

        {message && (
          <div className="text-green-500 text-sm bg-green-500/10 border border-green-500/20 rounded-md p-3">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cobalt-pulse hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cobalt-pulse disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          We'll send you a secure login link via email.
          <br />
          No password required.
        </p>
      </div>
    </div>
  )
} 
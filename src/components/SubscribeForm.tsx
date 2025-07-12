'use client';

import { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';
import * as Sentry from '@sentry/nextjs';
import log from '@/lib/logger';

// Email validation regex - checks for basic email format with domain
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track subscription attempt
    track('newsletter_subscribe_attempt', { 
      location: 'homepage_footer',
      email_domain: email.split('@')[1] || 'unknown' 
    });
    
    if (!email || !isValidEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      track('newsletter_subscribe_error', { 
        location: 'homepage_footer',
        error: 'invalid_email' 
      });
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Successfully subscribed!');
        setEmail(''); // Clear the form
        
        // Track successful subscription
        track('newsletter_subscribe_success', { 
          location: 'homepage_footer',
          email_domain: email.split('@')[1] || 'unknown' 
        });
        
        // Log successful subscription
        log.info(`[SubscribeForm] Email subscription successful for domain: ${email.split('@')[1] || 'unknown'}`);
      } else {
        setStatus('error');
        setMessage(data.error || 'Subscription failed. Please try again.');
        
        // Track subscription failure
        track('newsletter_subscribe_error', { 
          location: 'homepage_footer',
          error: data.error || 'api_error' 
        });
        
        // Log subscription failure
        log.warn(`[SubscribeForm] Email subscription failed: ${data.error || 'api_error'} (domain: ${email.split('@')[1] || 'unknown'})`);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
      
      // Track network error in analytics
      track('newsletter_subscribe_error', { 
        location: 'homepage_footer',
        error: 'network_error' 
      });
      
      // Log network error
      log.error(`[SubscribeForm] Network error during subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Report network error to Sentry for debugging
      Sentry.captureException(error, {
        tags: {
          component: 'SubscribeForm',
          operation: 'emailSubscription'
        },
        extra: {
          email_domain: email.split('@')[1] || 'unknown',
          location: 'homepage_footer'
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        disabled={status === 'loading'}
        className="w-full rounded-lg bg-graphite-gray px-4 py-3 placeholder:text-platinum-mist/50 focus:outline-none focus:ring-2 focus:ring-cobalt-pulse disabled:opacity-50"
      />
      
      <button 
        type="submit"
        disabled={status === 'loading'}
        className="rounded-lg bg-cobalt-pulse px-6 py-3 font-semibold text-pitch-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>

      {message && (
        <p className={`text-sm mt-2 ${
          status === 'success' 
            ? 'text-green-400' 
            : status === 'error' 
            ? 'text-red-400' 
            : 'text-platinum-mist/80'
        }`}>
          {message}
        </p>
      )}
    </form>
  );
} 
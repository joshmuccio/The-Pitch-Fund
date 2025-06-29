'use client';

import { useState } from 'react';

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
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
      } else {
        setStatus('error');
        setMessage(data.error || 'Subscription failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
import * as Sentry from '@sentry/nextjs';
import { track } from '@vercel/analytics/server';

// Edge Runtime flag
export const runtime = 'edge';
export const dynamic = 'force-dynamic';   // prevent static optimisation

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge subscribe API initialized"));

// Email validation regex - checks for basic email format with domain
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    // Validate email
    if (!email || !isValidEmail(email)) {
      // Track invalid email submissions
      await track('newsletter_server_validation_error', {
        error: 'invalid_email',
        email_provided: !!email
      });
      
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const apiKey = process.env.BEEHIIV_API_TOKEN;
    const pubId = process.env.BEEHIIV_PUBLICATION_ID;

    // Check if environment variables are set
    if (!apiKey) {
      console.error('BEEHIIV_API_TOKEN is not set');
      
      // Track configuration errors
      await track('newsletter_server_config_error', {
        error: 'missing_api_token'
      });
      
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!pubId) {
      console.error('BEEHIIV_PUBLICATION_ID is not set');
      
      // Track configuration errors
      await track('newsletter_server_config_error', {
        error: 'missing_publication_id'
      });
      
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Track API call attempt
    await track('newsletter_beehiiv_api_call', {
      email_domain: email.split('@')[1] || 'unknown'
    });

    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email,
          send_welcome_email: false,
          reactivate_existing: false,
        }),
      }
    );

    const data = await res.json();
    
    if (!res.ok) {
      console.error('Beehiiv API error:', data);
      
      // Track Beehiiv API failures
      await track('newsletter_beehiiv_api_error', {
        status: res.status,
        error: data.message || 'unknown_api_error',
        email_domain: email.split('@')[1] || 'unknown'
      });
      
      return new Response(
        JSON.stringify({ error: data.message || 'Subscription failed' }),
        { 
          status: res.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if Beehiiv marked the subscription as invalid
    if (data.data?.status === 'invalid') {
      console.error('Beehiiv marked subscription as invalid:', data);
      
      // Track invalid subscriptions marked by Beehiiv
      await track('newsletter_beehiiv_invalid', {
        email_domain: email.split('@')[1] || 'unknown',
        beehiiv_status: data.data?.status
      });
      
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 🎉 SUCCESS - Track successful newsletter subscription (server-side)
    await track('newsletter_subscribe_server_success', {
      email_domain: email.split('@')[1] || 'unknown',
      beehiiv_status: data.data?.status || 'unknown',
      subscription_id: data.data?.id || 'unknown'
    });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: 'Successfully subscribed!' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Subscription error:', error);
    
    // Track unexpected server errors
    await track('newsletter_server_error', {
      error: error instanceof Error ? error.message : 'unknown_error'
    });
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 
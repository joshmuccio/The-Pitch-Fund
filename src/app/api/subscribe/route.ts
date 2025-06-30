// Edge Runtime flag
export const runtime = 'edge';
export const dynamic = 'force-dynamic';   // prevent static optimisation

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
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

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
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

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
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 
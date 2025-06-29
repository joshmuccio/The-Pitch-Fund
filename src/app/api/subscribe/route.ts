import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BEEHIIV_API_TOKEN;
    const pubId = process.env.BEEHIIV_PUBLICATION_ID;

    // Check if environment variables are set
    if (!apiKey) {
      console.error('BEEHIIV_API_TOKEN is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!process.env.BEEHIIV_PUBLICATION_ID) {
      console.error('BEEHIIV_PUBLICATION_ID is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
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
      return NextResponse.json(
        { error: data.message || 'Subscription failed' },
        { status: res.status }
      );
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Successfully subscribed!' 
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
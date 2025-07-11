// lib/normalizeAddress.ts
// Address normalization with Mapbox geocoding API and regex fallback
export interface NormalisedAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;          // ISO-3166 ("US")
  lat: number;
  lon: number;
  relevance: number;        // 0-1 confidence score
}

// Regex-based fallback parser for offline/failure scenarios
export function parseAddressWithRegex(raw: string): NormalisedAddress | null {
  if (!raw.trim()) return null;

  const input = raw.trim();
  
  // Try to parse by splitting on comma first
  const commaParts = input.split(',');
  
  if (commaParts.length >= 2) {
    // Get the part after the last comma (should be "STATE ZIP" or "STATE ZIP COUNTRY")
    const lastPart = commaParts[commaParts.length - 1].trim();
    
    // Try to extract state and zip from the last part
    const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)(?:\s+([A-Z]{2}))?$/i);
    
    if (stateZipMatch) {
      const state = stateZipMatch[1].trim().toUpperCase();
      const postal_code = stateZipMatch[2].trim();
      const country = stateZipMatch[3] ? stateZipMatch[3].trim().toUpperCase() : 'US';
      
      // Everything before the last comma should be street + city
      const beforeLastComma = commaParts.slice(0, -1).join(',').trim();
      
      if (commaParts.length >= 3) {
        // Format: "STREET, CITY, STATE ZIP"
        const line1 = commaParts[0].trim();
        const city = commaParts.slice(1, -1).join(',').trim();
        
        return {
          line1,
          line2: undefined,
          city,
          state,
          postal_code,
          country,
          lat: 0,
          lon: 0,
          relevance: 0.6, // Higher confidence for structured format
        };
      } else {
        // Format: "STREET CITY, STATE ZIP" - need to split street from city
        const words = beforeLastComma.split(/\s+/);
        
        if (words.length >= 2) {
          // Heuristic: assume last word before comma is city, rest is street
          const city = words[words.length - 1];
          const line1 = words.slice(0, -1).join(' ');
          
          return {
            line1,
            line2: undefined,
            city,
            state,
            postal_code,
            country,
            lat: 0,
            lon: 0,
            relevance: 0.4, // Medium confidence for heuristic parsing
          };
        } else {
          // Just one word - put it all in line1
          return {
            line1: beforeLastComma,
            line2: undefined,
            city: '',
            state,
            postal_code,
            country,
            lat: 0,
            lon: 0,
            relevance: 0.3,
          };
        }
      }
    }
  }

  // Fallback: try some basic patterns
  const patterns = [
    // Simple state pattern: "ANYTHING, STATE"
    /^(.+),\s*([A-Z]{2})$/i,
    // Basic comma split: "PART1, PART2"
    /^(.+?),\s*(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        line1: match[1].trim(),
        line2: undefined,
        city: match[2].trim(),
        state: pattern.source.includes('([A-Z]{2})') ? match[2].trim().toUpperCase() : '',
        postal_code: '',
        country: 'US',
        lat: 0,
        lon: 0,
        relevance: 0.3,
      };
    }
  }

  // Last resort: put everything in line1
  return {
    line1: input,
    line2: undefined,
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    lat: 0,
    lon: 0,
    relevance: 0.2, // Very low confidence
  };
}

export async function normaliseWithMapbox(
  raw: string
): Promise<NormalisedAddress | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  
  if (!token) {
    console.error('NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN is not set');
    return null;
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      raw
    )}.json`
  );
  url.searchParams.set('access_token', token);
  url.searchParams.set('limit', '1');        // we only care about top hit
  url.searchParams.set('types', 'address');  // better precision

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json();
  
  // Log the FULL Mapbox API response
  console.log('🗺️ [normaliseWithMapbox] FULL MAPBOX API RESPONSE:', JSON.stringify(data, null, 2));
  
  const { features } = data;
  if (!features?.length) return null;

  const f = features[0]; // best match
  
  // Log the first feature in detail
  console.log('🎯 [normaliseWithMapbox] FIRST FEATURE DETAILED:', JSON.stringify(f, null, 2));
  
  const ctx: Record<string, string> = {};
  for (const c of f.context ?? []) ctx[c.id.split('.')[0]] = c.text;
  
  console.log('🔍 [normaliseWithMapbox] Parsed context:', ctx);

  // Try multiple methods to get country code from Mapbox response
  let countryCode = '';
  
  // Method 1: Check properties for short_code or iso_3166_1
  if (f.properties?.short_code) {
    countryCode = f.properties.short_code;
  } else if (f.properties?.iso_3166_1) {
    countryCode = f.properties.iso_3166_1;
  }
  
  // Method 2: Look through context for country
  if (!countryCode) {
    const countryContext = f.context?.find((c: any) => c.id.startsWith('country.'));
    if (countryContext?.short_code) {
      countryCode = countryContext.short_code;
    } else if (ctx.country) {
      // Fallback: map country name to code (basic mapping)
      const countryMapping: Record<string, string> = {
        'United States': 'US',
        'Canada': 'CA',
        'United Kingdom': 'GB',
        'Australia': 'AU',
        // Add more as needed
      };
      countryCode = countryMapping[ctx.country] || 'US';
    }
  }
  
  // Default to US if still no country code
  if (!countryCode) {
    countryCode = 'US';
  }
  
  const finalCountryCode = countryCode.toUpperCase().slice(0, 2);
  
  // Extract the street address from place_name (before the first comma)
  // place_name format: "1401 21st Street, Sacramento, California 95811, United States"
  const addressPart = f.place_name.split(',')[0]?.trim() || '';
  
  console.log('🏠 [normaliseWithMapbox] Address extraction:', {
    place_name: f.place_name,
    extracted_address: addressPart,
    fallback_construction: f.text + (f.address ? ` ${f.address}` : '')
  });

  return {
    line1: addressPart || (f.text + (f.address ? ` ${f.address}` : '')), // Use place_name or fallback
    line2: undefined,
    city: ctx.place ?? '',
    state: ctx.region ?? '',
    postal_code: ctx.postcode ?? '',
    country: finalCountryCode,
    lat: f.center[1],
    lon: f.center[0],
    relevance: f.relevance ?? 0,
  };
} 
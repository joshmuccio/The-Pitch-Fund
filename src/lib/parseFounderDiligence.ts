import { Step2FormValues } from '@/app/admin/schemas/companySchema'
import { normaliseWithMapbox } from './normalizeAddress'

// Interface to track address normalization results for UI feedback
export interface AddressNormalizationResult {
  method: 'mapbox' | 'regex' | 'fallback';
  confidence: number; // 0-1 scale
  needsReview: boolean;
}

const companyLegalNameRe  = /Company Legal Name\s+([\s\S]*?)\n/;
const hqLocationRe        = /Company headquarters location\s+([\s\S]*?)\n/;

// We'll extract founder numbers dynamically rather than using a single regex

// Debug logging for patterns
console.log('🔍 [parseFounderDiligence] Regex patterns loaded:');
console.log('🔍 [parseFounderDiligence] companyLegalNameRe:', companyLegalNameRe);
console.log('🔍 [parseFounderDiligence] hqLocationRe:', hqLocationRe);

// Define all fields that could potentially be auto-populated from founder diligence data
const STEP2_AUTO_POPULATE_FIELDS = [
  'legal_name',
  'hq_address_line_1',
  'hq_address_line_2', 
  'hq_city',
  'hq_state',
  'hq_zip_code',
  'hq_country',
  'hq_latitude',
  'hq_longitude',
  'company_linkedin_url',
  'founders.0.first_name',
  'founders.0.last_name',
  'founders.0.title',
  'founders.0.email',
  'founders.0.linkedin_url',
  'founders.0.sex',
  'founders.1.first_name',
  'founders.1.last_name',
  'founders.1.title',
  'founders.1.email',
  'founders.1.linkedin_url',
  'founders.1.sex',
  'founders.2.first_name',
  'founders.2.last_name',
  'founders.2.title',
  'founders.2.email',
  'founders.2.linkedin_url',
  'founders.2.sex'
] as const;

export type Step2AutoPopulateField = typeof STEP2_AUTO_POPULATE_FIELDS[number];

export interface Step2ParseResult {
  extractedData: Partial<Step2FormValues>;
  successfullyParsed: Set<Step2AutoPopulateField>;
  failedToParse: Set<Step2AutoPopulateField>;
  addressNormalization?: AddressNormalizationResult; // Track address processing results
}

// Helper function for title case
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function parseDiligenceBlob(input: string): Promise<Step2ParseResult> {
  console.log('🔍 [parseFounderDiligence] Starting parse with input length:', input.length);
  console.log('🔍 [parseFounderDiligence] First 500 chars:', input.substring(0, 500));
  
  const out: Partial<Step2FormValues> = {};
  const successfullyParsed = new Set<Step2AutoPopulateField>();
  const failedToParse = new Set<Step2AutoPopulateField>();
  let addressNormalizationResult: AddressNormalizationResult | undefined;

  /* ───────── company ───────── */
  console.log('🔍 [parseFounderDiligence] Testing company legal name regex...');
  const legal = companyLegalNameRe.exec(input);
  console.log('🔍 [parseFounderDiligence] Legal name match:', legal);
  if (legal) {
    out.legal_name = legal[1].trim();
    console.log('✅ [parseFounderDiligence] Extracted legal_name:', out.legal_name);
    successfullyParsed.add('legal_name');
  } else {
    failedToParse.add('legal_name');
  }

  console.log('🔍 [parseFounderDiligence] Testing HQ location regex...');
  const hq = hqLocationRe.exec(input)?.[1].trim();
  console.log('🔍 [parseFounderDiligence] HQ location match:', hq);
  
  if (hq) {
    const line = hq
      .replace(/\s{2,}/g, ' ')      // collapse doubles
      .trim();

    console.log('🔍 [parseFounderDiligence] Cleaned HQ line:', line);

    // 🗺️ First, try Mapbox normalization
    console.log('🗺️ [parseFounderDiligence] Attempting Mapbox normalization...');
    console.log('📥 [parseFounderDiligence] INPUT TO MAPBOX:', JSON.stringify(line, null, 2));
    console.log('📏 [parseFounderDiligence] Input length:', line.length, 'characters');
    console.log('🔤 [parseFounderDiligence] Input preview:', line);
    
    let mapboxResult = null;
    try {
      mapboxResult = await normaliseWithMapbox(line);
    } catch (error) {
      console.error('❌ [parseFounderDiligence] Mapbox normalization failed:', error);
    }

    if (mapboxResult) {
      console.log('✅ [parseFounderDiligence] Mapbox normalization successful!');
      console.log('🗺️ [parseFounderDiligence] FULL MAPBOX RESULT OBJECT:', JSON.stringify(mapboxResult, null, 2));
      
      // Use Mapbox results
      out.hq_address_line_1 = mapboxResult.line1;
      out.hq_city = mapboxResult.city;
      out.hq_state = mapboxResult.state;
      out.hq_zip_code = mapboxResult.postal_code;
      out.hq_country = mapboxResult.country;
      
      // Store coordinates from Mapbox geocoding
      out.hq_latitude = mapboxResult.lat;
      out.hq_longitude = mapboxResult.lon;
      
      // Create address normalization tracking
      addressNormalizationResult = {
        method: 'mapbox',
        confidence: mapboxResult.relevance,
        needsReview: mapboxResult.relevance < 0.75 // Mapbox best practice threshold
      };
      
      // Mark HQ fields as successfully parsed
      successfullyParsed.add('hq_address_line_1');
      successfullyParsed.add('hq_city');
      successfullyParsed.add('hq_state');
      successfullyParsed.add('hq_zip_code');
      successfullyParsed.add('hq_country');
      successfullyParsed.add('hq_latitude');
      successfullyParsed.add('hq_longitude');
      
      console.log('✅ [parseFounderDiligence] Used Mapbox results summary:', {
        original_input: hq,
        parsed_address: out.hq_address_line_1,
        parsed_city: out.hq_city,
        parsed_state: out.hq_state,
        parsed_zip: out.hq_zip_code,
        parsed_country: out.hq_country,
        confidence: mapboxResult.relevance,
        coordinates: { lat: mapboxResult.lat, lon: mapboxResult.lon },
        needsReview: addressNormalizationResult.needsReview
      });
    } else {
      // 📍 Fallback to regex parsing
      console.log('🔄 [parseFounderDiligence] Mapbox failed, falling back to regex parsing');
      
      // Split at comma first to separate state/zip from the rest
      const parts = line.split(',');
      if (parts.length >= 2) {
        const leftPart = parts[0].trim(); // "1401 21ST STE R SACRAMENTO"
        const rightPart = parts[1].trim(); // "CA 95811"
        
        // Parse state and zip from right part
        const stateZipMatch = /([A-Z]{2})\s+(\d{5})/.exec(rightPart);
        
        if (stateZipMatch) {
          const state = stateZipMatch[1];
          const zip = stateZipMatch[2];
          
          // For the left part, assume the last capitalized word is the city
          // Everything before that is the address
          const leftWords = leftPart.split(' ');
          
          // Find the last word that looks like a city name (all caps, like "SACRAMENTO")
          let cityStartIndex = leftWords.length - 1;
          for (let i = leftWords.length - 1; i >= 0; i--) {
            if (/^[A-Z]+$/.test(leftWords[i])) {
              cityStartIndex = i;
              break;
            }
          }
          
          const addressParts = leftWords.slice(0, cityStartIndex);
          const cityParts = leftWords.slice(cityStartIndex);
          
          out.hq_address_line_1 = addressParts.join(' ');
          out.hq_city = toTitleCase(cityParts.join(' '));
          out.hq_state = state;
          out.hq_zip_code = zip;
          out.hq_country = 'US';
          
          // Create address normalization tracking for regex fallback
          addressNormalizationResult = {
            method: 'regex',
            confidence: 0.6, // Medium confidence for successful regex parsing
            needsReview: true // Always recommend review for regex results
          };
          
          // Mark HQ fields as successfully parsed
          successfullyParsed.add('hq_address_line_1');
          successfullyParsed.add('hq_city');
          successfullyParsed.add('hq_state');
          successfullyParsed.add('hq_zip_code');
          successfullyParsed.add('hq_country');
          
          console.log('✅ [parseFounderDiligence] Used regex fallback results:', {
            address: out.hq_address_line_1,
            city: out.hq_city,
            state: out.hq_state,
            zip: out.hq_zip_code,
            confidence: addressNormalizationResult.confidence,
            needsReview: addressNormalizationResult.needsReview
          });
        } else {
          // fallback: dump full string into line_1
          out.hq_address_line_1 = hq;
          
          // Create address normalization tracking for final fallback
          addressNormalizationResult = {
            method: 'fallback',
            confidence: 0.2, // Low confidence for fallback
            needsReview: true // Definitely needs review
          };
          
          successfullyParsed.add('hq_address_line_1');
          failedToParse.add('hq_city');
          failedToParse.add('hq_state');
          failedToParse.add('hq_zip_code');
          failedToParse.add('hq_country');
          console.log('⚠️ [parseFounderDiligence] Using final fallback - full string in address_line_1:', hq);
        }
      } else {
        // fallback: dump full string into line_1
        out.hq_address_line_1 = hq;
        
        // Create address normalization tracking for final fallback
        addressNormalizationResult = {
          method: 'fallback',
          confidence: 0.2, // Low confidence for fallback
          needsReview: true // Definitely needs review
        };
        
        successfullyParsed.add('hq_address_line_1');
        failedToParse.add('hq_city');
        failedToParse.add('hq_state');
        failedToParse.add('hq_zip_code');
        failedToParse.add('hq_country');
        console.log('⚠️ [parseFounderDiligence] Using final fallback - full string in address_line_1:', hq);
      }
    }
  } else {
    // All HQ fields failed to parse
    failedToParse.add('hq_address_line_1');
    failedToParse.add('hq_city');
    failedToParse.add('hq_state');
    failedToParse.add('hq_zip_code');
    failedToParse.add('hq_country');
  }

  // Company LinkedIn URL is never auto-populated from diligence data
  failedToParse.add('company_linkedin_url');
  // Address line 2 is never auto-populated
  failedToParse.add('hq_address_line_2');

  /* ───────── founders ───────── */
  console.log('🔍 [parseFounderDiligence] Testing founder parsing...');
  
  // Extract founder numbers that exist in the text
  const founderMatches = input.match(/Current Founder\s+(\d+):/g) || [];
  const founderNumbers = Array.from(new Set(
    founderMatches.map(match => {
      const numMatch = match.match(/\d+/);
      return numMatch ? parseInt(numMatch[0]) : 0;
    }).filter(num => num > 0)
  )).sort();
  
  console.log('🔍 [parseFounderDiligence] Found founder numbers:', founderNumbers);

  const founders = founderNumbers.map((founderNum, index) => {
    console.log(`🔍 [parseFounderDiligence] Processing founder ${founderNum}...`);
    
    // Extract all content related to this founder number
    const founderPattern = new RegExp(`Current Founder\\s+${founderNum}:[\\s\\S]*?(?=Current Founder\\s+(?!${founderNum}:)|\\nLog in|$)`, 'g');
    const founderContent = input.match(founderPattern)?.join('\n') || '';
    
    console.log(`🔍 [parseFounderDiligence] Founder ${founderNum} content length:`, founderContent.length);
    console.log(`🔍 [parseFounderDiligence] Founder ${founderNum} content preview:`, founderContent.substring(0, 300));
    
    // Use line-by-line parsing for more reliable extraction
    const lines = founderContent.split('\n').map(line => line.trim());
    
    let first = '';
    let last = '';
    let role = '';
    let email = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if ((line === 'first name' || line === '• first name') && i + 1 < lines.length) {
        first = lines[i + 1].trim();
      } else if ((line === 'last name' || line === '• last name') && i + 1 < lines.length) {
        last = lines[i + 1].trim();
      } else if ((line === 'role' || line === '• role' || line.includes(': role')) && i + 1 < lines.length) {
        role = lines[i + 1].trim();
      } else if ((line === 'email' || line === '• email') && i + 1 < lines.length) {
        email = lines[i + 1].trim();
      }
    }
    
    console.log(`🔍 [parseFounderDiligence] Founder ${founderNum} line-by-line parsing results:`);
    console.log(`🔍 [parseFounderDiligence] Founder ${founderNum} first name:`, first);
    console.log(`🔍 [parseFounderDiligence] Founder ${founderNum} last name:`, last);
    console.log(`🔍 [parseFounderDiligence] Founder ${founderNum} role:`, role);
    console.log(`🔍 [parseFounderDiligence] Founder ${founderNum} email:`, email);
    
    // Log the actual extracted values for debugging
    console.log(`🔍 [parseFounderDiligence] Founder ${founderNum} extracted values:`, {
      first_name: first,
      last_name: last,
      role: role,
      email: email
    });

    // Track parsing success for this founder's fields
    const founderFieldPrefix = `founders.${index}` as const;
    
    if (first) {
      successfullyParsed.add(`${founderFieldPrefix}.first_name` as Step2AutoPopulateField);
    } else {
      failedToParse.add(`${founderFieldPrefix}.first_name` as Step2AutoPopulateField);
    }
    
    if (last) {
      successfullyParsed.add(`${founderFieldPrefix}.last_name` as Step2AutoPopulateField);
    } else {
      failedToParse.add(`${founderFieldPrefix}.last_name` as Step2AutoPopulateField);
    }
    
    if (role) {
      successfullyParsed.add(`${founderFieldPrefix}.title` as Step2AutoPopulateField);
    } else {
      failedToParse.add(`${founderFieldPrefix}.title` as Step2AutoPopulateField);
    }
    
    if (email) {
      successfullyParsed.add(`${founderFieldPrefix}.email` as Step2AutoPopulateField);
    } else {
      failedToParse.add(`${founderFieldPrefix}.email` as Step2AutoPopulateField);
    }
    
    // LinkedIn URL and sex are never auto-populated from diligence data
    failedToParse.add(`${founderFieldPrefix}.linkedin_url` as Step2AutoPopulateField);
    failedToParse.add(`${founderFieldPrefix}.sex` as Step2AutoPopulateField);

    if (!first && !last) {
      console.log(`⚠️ [parseFounderDiligence] Founder ${founderNum} - no name found, skipping`);
      return null;
    }
    
    const founder = { 
      first_name: first || '', 
      last_name: last || '', 
      title: role || '',
      email: email || '', // Now extracted from diligence form
      linkedin_url: '', // Will be filled manually
      role: 'founder' as const, // Default role
      sex: '' as any, // Will be filled manually
      bio: '' // Will be filled manually
    };
    
    console.log(`✅ [parseFounderDiligence] Extracted founder ${founderNum}:`, founder);
    return founder;
  }).filter(Boolean) as Step2FormValues['founders'];

  // For any founder slots that weren't found, mark all their fields as failed
  for (let i = founderNumbers.length; i < 3; i++) {
    const founderFieldPrefix = `founders.${i}` as const;
    failedToParse.add(`${founderFieldPrefix}.first_name` as Step2AutoPopulateField);
    failedToParse.add(`${founderFieldPrefix}.last_name` as Step2AutoPopulateField);
    failedToParse.add(`${founderFieldPrefix}.title` as Step2AutoPopulateField);
    failedToParse.add(`${founderFieldPrefix}.email` as Step2AutoPopulateField);
    failedToParse.add(`${founderFieldPrefix}.linkedin_url` as Step2AutoPopulateField);
    failedToParse.add(`${founderFieldPrefix}.sex` as Step2AutoPopulateField);
  }

  console.log('🔍 [parseFounderDiligence] Total founders extracted:', founders.length);
  if (founders.length) {
    out.founders = founders;
    console.log('✅ [parseFounderDiligence] Final founders array:', out.founders);
  }

  console.log('🔍 [parseFounderDiligence] Final output:', out);
  console.log('🔍 [parseFounderDiligence] Successfully parsed fields:', Array.from(successfullyParsed));
  console.log('🔍 [parseFounderDiligence] Failed to parse fields:', Array.from(failedToParse));
  
  return {
    extractedData: out,
    successfullyParsed,
    failedToParse,
    addressNormalization: addressNormalizationResult
  };
} 
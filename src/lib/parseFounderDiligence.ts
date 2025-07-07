import { Step2FormValues } from '@/app/admin/schemas/companySchema'

const companyLegalNameRe  = /Company Legal Name\s+([\s\S]*?)\n/;
const hqLocationRe        = /Company headquarters location\s+([\s\S]*?)\n/;

// We'll extract founder numbers dynamically rather than using a single regex

// Debug logging for patterns
console.log('🔍 [parseFounderDiligence] Regex patterns loaded:');
console.log('🔍 [parseFounderDiligence] companyLegalNameRe:', companyLegalNameRe);
console.log('🔍 [parseFounderDiligence] hqLocationRe:', hqLocationRe);

// Helper function for title case
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function parseDiligenceBlob(input: string): Partial<Step2FormValues> {
  console.log('🔍 [parseFounderDiligence] Starting parse with input length:', input.length);
  console.log('🔍 [parseFounderDiligence] First 500 chars:', input.substring(0, 500));
  
  const out: Partial<Step2FormValues> = {};

  /* ───────── company ───────── */
  console.log('🔍 [parseFounderDiligence] Testing company legal name regex...');
  const legal = companyLegalNameRe.exec(input);
  console.log('🔍 [parseFounderDiligence] Legal name match:', legal);
  if (legal) {
    out.legal_name = legal[1].trim();
    console.log('✅ [parseFounderDiligence] Extracted legal_name:', out.legal_name);
  }

  console.log('🔍 [parseFounderDiligence] Testing HQ location regex...');
  const hq = hqLocationRe.exec(input)?.[1].trim();
  console.log('🔍 [parseFounderDiligence] HQ location match:', hq);
  
  if (hq) {
    /**
     * Better address parsing for:
     *  "1401 21ST STE R SACRAMENTO, CA 95811"
     */
    const line = hq
      .replace(/\s{2,}/g, ' ')      // collapse doubles
      .trim();

    console.log('🔍 [parseFounderDiligence] Cleaned HQ line:', line);

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
        
        console.log('✅ [parseFounderDiligence] Extracted HQ fields:', {
          address: out.hq_address_line_1,
          city: out.hq_city,
          state: out.hq_state,
          zip: out.hq_zip_code
        });
      } else {
        // fallback: dump full string into line_1
        out.hq_address_line_1 = hq;
        console.log('⚠️ [parseFounderDiligence] Using fallback - full string in address_line_1:', hq);
      }
    } else {
      // fallback: dump full string into line_1
      out.hq_address_line_1 = hq;
      console.log('⚠️ [parseFounderDiligence] Using fallback - full string in address_line_1:', hq);
    }
  }

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

  const founders = founderNumbers.map((founderNum) => {
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
      bio: '' // Will be filled manually
    };
    
    console.log(`✅ [parseFounderDiligence] Extracted founder ${founderNum}:`, founder);
    return founder;
  }).filter(Boolean) as Step2FormValues['founders'];

  console.log('🔍 [parseFounderDiligence] Total founders extracted:', founders.length);
  if (founders.length) {
    out.founders = founders;
    console.log('✅ [parseFounderDiligence] Final founders array:', out.founders);
  }

  console.log('🔍 [parseFounderDiligence] Final output:', out);
  return out;
} 
import { Step2FormValues } from '@/app/admin/schemas/companySchema'

const companyLegalNameRe  = /Company Legal Name\s+([\s\S]*?)\n/;
const hqLocationRe        = /Company headquarters location\s+([\s\S]*?)\n/;

// Founder blocks come as "Current Founder <N>: …"
const founderBlockRe = /Current Founder\s+\d+:[\s\S]+?(?=Current Founder|\nLog in|$)/g;

// Debug logging for patterns
console.log('🔍 [parseFounderDiligence] Regex patterns loaded:');
console.log('🔍 [parseFounderDiligence] companyLegalNameRe:', companyLegalNameRe);
console.log('🔍 [parseFounderDiligence] hqLocationRe:', hqLocationRe);
console.log('🔍 [parseFounderDiligence] founderBlockRe:', founderBlockRe);

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
     * Quick-n-dirty split:
     *  "1401 21ST STE R SACRAMENTO, CA 95811"
     */
    const line = hq
      .replace(/\s{2,}/g, ' ')      // collapse doubles
      .replace(/,\s*([A-Z]{2})\s+/, ', $1 ') // ensure comma before state
      .trim();

    console.log('🔍 [parseFounderDiligence] Cleaned HQ line:', line);

    const match = /^(.+?)\s+([A-Z ]+),\s*([A-Z]{2})\s+(\d{5})(?:\s+([A-Z]{2}))?$/i.exec(
      line.replace(/\u00A0/g, ' ')   // no-break space → normal space
    );

    console.log('🔍 [parseFounderDiligence] Address parsing match:', match);

    if (match) {
      out.hq_address_line_1 = match[1];
      out.hq_city           = toTitleCase(match[2]);
      out.hq_state          = match[3].toUpperCase();
      out.hq_zip_code       = match[4];
      out.hq_country        = 'US';
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
  }

  /* ───────── founders ───────── */
  console.log('🔍 [parseFounderDiligence] Testing founder blocks regex...');
  console.log('🔍 [parseFounderDiligence] Founder regex pattern:', founderBlockRe);
  
  const founderBlocks = input.match(founderBlockRe) ?? [];
  console.log('🔍 [parseFounderDiligence] Found founder blocks:', founderBlocks.length);
  
  founderBlocks.forEach((block, index) => {
    console.log(`🔍 [parseFounderDiligence] Founder block ${index + 1}:`, block.substring(0, 200));
  });

  const founders = founderBlocks.map((block, index) => {
    console.log(`🔍 [parseFounderDiligence] Processing founder block ${index + 1}...`);
    
    const firstMatch = /First name\s+([^\n]+)/i.exec(block);
    const lastMatch = /Last name\s+([^\n]+)/i.exec(block);
    const roleMatch = /Role\s+([^\n]+)/i.exec(block);
    
    console.log(`🔍 [parseFounderDiligence] First name match:`, firstMatch);
    console.log(`🔍 [parseFounderDiligence] Last name match:`, lastMatch);
    console.log(`🔍 [parseFounderDiligence] Role match:`, roleMatch);
    
    const first  = firstMatch?.[1].trim();
    const last   = lastMatch?.[1].trim();
    const role   = roleMatch?.[1].trim();

    if (!first && !last) {
      console.log(`⚠️ [parseFounderDiligence] Founder block ${index + 1} - no name found, skipping`);
      return null;
    }
    
    const founder = { 
      first_name: first ?? '', 
      last_name: last ?? '', 
      title: role ?? '',
      email: '', // Will be filled manually
      linkedin_url: '', // Will be filled manually
      role: 'solo_founder' as const, // Default role
      bio: '' // Will be filled manually
    };
    
    console.log(`✅ [parseFounderDiligence] Extracted founder ${index + 1}:`, founder);
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
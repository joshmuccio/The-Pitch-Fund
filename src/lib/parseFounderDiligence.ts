import { Step2FormValues } from '@/app/admin/schemas/companySchema'

const companyLegalNameRe  = /Company Legal Name\s+([\s\S]*?)\n/;
const hqLocationRe        = /Company headquarters location\s+([\s\S]*?)\n/;

// Founder blocks come as "Current Founder <N>: …"
const founderBlockRe = /Current Founder\s+\d+:[\s\S]+?(?=Current Founder|\nLog in|$)/g;

// Helper function for title case
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function parseDiligenceBlob(input: string): Partial<Step2FormValues> {
  const out: Partial<Step2FormValues> = {};

  /* ───────── company ───────── */
  const legal = companyLegalNameRe.exec(input);
  if (legal) out.legal_name = legal[1].trim();

  const hq = hqLocationRe.exec(input)?.[1].trim();
  if (hq) {
    /**
     * Quick-n-dirty split:
     *  "1401 21ST STE R SACRAMENTO, CA 95811"
     */
    const line = hq
      .replace(/\s{2,}/g, ' ')      // collapse doubles
      .replace(/,\s*([A-Z]{2})\s+/, ', $1 ') // ensure comma before state
      .trim();

    const match = /^(.+?)\s+([A-Z ]+),\s*([A-Z]{2})\s+(\d{5})(?:\s+([A-Z]{2}))?$/i.exec(
      line.replace(/\u00A0/g, ' ')   // no-break space → normal space
    );

    if (match) {
      out.hq_address_line_1 = match[1];
      out.hq_city           = toTitleCase(match[2]);
      out.hq_state          = match[3].toUpperCase();
      out.hq_zip_code       = match[4];
      out.hq_country        = 'US';
    } else {
      // fallback: dump full string into line_1
      out.hq_address_line_1 = hq;
    }
  }

  /* ───────── founders ───────── */
  const founderBlocks = input.match(founderBlockRe) ?? [];
  const founders = founderBlocks.map((block) => {
    const first  = /First name\s+([^\n]+)/i.exec(block)?.[1].trim();
    const last   = /Last name\s+([^\n]+)/i.exec(block)?.[1].trim();
    const role   = /Role\s+([^\n]+)/i.exec(block)?.[1].trim();

    if (!first && !last) return null;
    return { 
      first_name: first ?? '', 
      last_name: last ?? '', 
      title: role ?? '',
      email: '', // Will be filled manually
      linkedin_url: '', // Will be filled manually
      role: 'solo_founder' as const, // Default role
      bio: '' // Will be filled manually
    };
  }).filter(Boolean) as Step2FormValues['founders'];

  if (founders.length) out.founders = founders;

  return out;
} 